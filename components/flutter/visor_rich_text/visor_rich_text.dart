import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:visor_core/visor_core.dart';

/// Renders text with inline tappable URLs.
///
/// URLs in [text] are auto-detected and rendered as a styled, tappable span.
/// Tapping a link launches it externally via `url_launcher` by default; pass
/// [onLinkTap] to intercept (e.g. open in an in-app webview, log analytics).
///
/// All visual properties read from Visor token extensions — link color
/// resolves to `context.visorColors.textLink` and the base text style
/// resolves to `context.visorTextStyles.bodyMedium`. Pass [style] / [linkStyle]
/// to override either independently.
///
/// ```dart
/// VisorRichText(
///   text: 'See our terms at https://example.com/terms for details.',
/// )
///
/// // Custom link handler (e.g. open in an in-app webview):
/// VisorRichText(
///   text: 'Read more at https://example.com',
///   onLinkTap: (url) => InAppBrowser.open(url),
/// )
/// ```
class VisorRichText extends StatefulWidget {
  /// Creates a rich text widget with auto-detected, tappable URLs.
  const VisorRichText({
    required this.text,
    this.style,
    this.linkStyle,
    this.textAlign,
    this.selectable = true,
    this.onLinkTap,
    this.semanticLabel,
    super.key,
  });

  /// The text to render. URLs (http/https) are auto-detected and rendered as
  /// tappable spans; everything else renders as plain text.
  final String text;

  /// Base text style for non-link runs. Defaults to
  /// `context.visorTextStyles.bodyMedium` with `textPrimary` color.
  final TextStyle? style;

  /// Style applied to detected URL spans. When null, the link spans inherit
  /// [style] and override its color with `context.visorColors.textLink`.
  final TextStyle? linkStyle;

  /// Horizontal alignment passed to the underlying text widget. Defaults to
  /// [TextAlign.start] so RTL flows align correctly.
  final TextAlign? textAlign;

  /// When true (the default) the rendered text is selectable via long-press
  /// (`SelectableText.rich`). Set false for compact contexts where selection
  /// would compete with the parent's gestures (chat bubbles, list tiles).
  final bool selectable;

  /// Optional handler invoked when a link is tapped. When null, the URL is
  /// launched externally via `url_launcher`'s [launchUrl] in
  /// [LaunchMode.externalApplication]. Provide this to override behavior or
  /// to make tests deterministic.
  final ValueChanged<String>? onLinkTap;

  /// Accessibility label that wraps the rendered text in a [Semantics] node.
  /// Detected URL spans always carry their URL string as the span's
  /// `semanticsLabel` regardless of this value.
  final String? semanticLabel;

  @override
  State<VisorRichText> createState() => _VisorRichTextState();
}

class _VisorRichTextState extends State<VisorRichText> {
  /// One recognizer per detected URL, kept alive for the widget's lifetime.
  /// Rebuilt only when [VisorRichText.text] changes.
  final List<TapGestureRecognizer> _recognizers = <TapGestureRecognizer>[];

  /// URLs paired 1:1 with [_recognizers] in match order.
  final List<String> _urls = <String>[];

  @override
  void initState() {
    super.initState();
    _rebuildRecognizers();
  }

  @override
  void didUpdateWidget(covariant VisorRichText oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text) {
      _rebuildRecognizers();
    }
  }

  @override
  void dispose() {
    for (final recognizer in _recognizers) {
      recognizer.dispose();
    }
    _recognizers.clear();
    super.dispose();
  }

  void _rebuildRecognizers() {
    for (final recognizer in _recognizers) {
      recognizer.dispose();
    }
    _recognizers.clear();
    _urls.clear();
    for (final match in _urlRegex.allMatches(widget.text)) {
      final url = _trimTrailingPunctuation(match.group(0)!);
      _urls.add(url);
      _recognizers
          .add(TapGestureRecognizer()..onTap = () => _handleTap(url));
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final textStyles = context.visorTextStyles;

    final baseStyle = widget.style ??
        textStyles.bodyMedium.copyWith(color: colors.textPrimary);
    final effectiveLinkStyle = widget.linkStyle ??
        baseStyle.copyWith(
          color: colors.textLink,
          decoration: TextDecoration.none,
        );

    final spans = _buildTextSpans(
      baseStyle: baseStyle,
      linkStyle: effectiveLinkStyle,
    );

    final root = TextSpan(children: spans);
    final align = widget.textAlign ?? TextAlign.start;

    Widget rendered = widget.selectable
        ? SelectableText.rich(root, textAlign: align)
        : RichText(text: root, textAlign: align);

    if (widget.semanticLabel != null) {
      rendered = Semantics(label: widget.semanticLabel, child: rendered);
    }

    return rendered;
  }

  List<InlineSpan> _buildTextSpans({
    required TextStyle baseStyle,
    required TextStyle linkStyle,
  }) {
    final spans = <InlineSpan>[];

    if (_urls.isEmpty) {
      spans.add(TextSpan(text: widget.text, style: baseStyle));
      return spans;
    }

    var cursor = 0;
    var urlIndex = 0;
    for (final match in _urlRegex.allMatches(widget.text)) {
      if (match.start > cursor) {
        spans.add(
          TextSpan(
            text: widget.text.substring(cursor, match.start),
            style: baseStyle,
          ),
        );
      }
      // Pull the trimmed URL + paired recognizer cached in initState. Iteration
      // order is deterministic — `_urlRegex.allMatches` is the same regex used
      // in `_rebuildRecognizers`.
      final trimmed = _urls[urlIndex];
      final recognizer = _recognizers[urlIndex];
      urlIndex++;
      spans.add(
        TextSpan(
          text: trimmed,
          style: linkStyle,
          // Carries the URL to assistive tech regardless of the outer
          // [semanticLabel] wrapper.
          semanticsLabel: trimmed,
          recognizer: recognizer,
        ),
      );
      cursor = match.start + trimmed.length;
    }

    if (cursor < widget.text.length) {
      spans.add(
        TextSpan(text: widget.text.substring(cursor), style: baseStyle),
      );
    }

    return spans;
  }

  void _handleTap(String url) {
    final handler = widget.onLinkTap;
    if (handler != null) {
      handler(url);
      return;
    }
    final uri = Uri.tryParse(url);
    if (uri == null) return;
    // Fire-and-forget: link launches are user-initiated and the caller has
    // no way to await them on a `TextSpan` recognizer. Failures are silent
    // by design — pass [onLinkTap] for full control.
    launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}

/// Detects http and https URLs, including paths, query strings, fragments,
/// and percent-encoded characters. Trailing sentence punctuation is stripped
/// post-match by [_trimTrailingPunctuation].
final RegExp _urlRegex = RegExp(
  r'https?://(?:[-\w.])+(?:\:[0-9]+)?(?:/(?:[\w/_~:/?#[\]@!$&()*+,;=.%-])*)?',
  caseSensitive: false,
);

/// Strips trailing punctuation that is almost certainly the end of the
/// surrounding sentence rather than part of the URL — `.`, `,`, `;`, `!`,
/// `?`, and an unbalanced closing `)`.
String _trimTrailingPunctuation(String url) {
  var end = url.length;
  while (end > 0) {
    final c = url[end - 1];
    if (c == '.' || c == ',' || c == ';' || c == '!' || c == '?') {
      end--;
      continue;
    }
    if (c == ')') {
      final prefix = url.substring(0, end);
      final opens = '('.allMatches(prefix).length;
      final closes = ')'.allMatches(prefix).length;
      if (closes > opens) {
        end--;
        continue;
      }
    }
    break;
  }
  return url.substring(0, end);
}
