import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A full-surface error state with icon, message, optional body copy, and an
/// optional retry button.
///
/// `VisorErrorView` covers three common error-surface patterns:
///
/// 1. **Inline** — drop it inside a `Column` or `Stack` to replace a loading
///    region when a fetch fails.
/// 2. **Full-screen** — set [wrapWithScaffold] to `true` for a standalone
///    error page with an `AppBar` back button.
/// 3. **Custom action** — pass a [retryCallback] to show a tappable "Try
///    again" button; omit it for informational (non-recoverable) errors.
///
/// All visual properties read from Visor token extensions — no hard-coded
/// colors, radii, spacing, or typography.
///
/// ## Accessibility
///
/// The widget wraps its content in a `Semantics(liveRegion: true, container:
/// true)` node so TalkBack and VoiceOver announce the error when it appears.
/// The announced label defaults to [message]; pass [semanticLabel] to
/// override it (e.g., for a localized string).
///
/// ```dart
/// VisorErrorView(
///   message: 'Could not load your timeline.',
///   body: 'Check your connection and try again.',
///   retryCallback: _reload,
/// )
/// ```
class VisorErrorView extends StatelessWidget {
  const VisorErrorView({
    super.key,
    required this.message,
    this.body,
    this.icon = Icons.error_outline,
    this.retryCallback,
    this.retryLabel,
    this.wrapWithScaffold = false,
    this.scaffoldTitle,
    this.semanticLabel,
  });

  /// Primary error message shown below the icon.
  ///
  /// Kept short — one sentence that explains what went wrong.
  final String message;

  /// Optional supporting copy shown below [message].
  ///
  /// Use this to explain how the user can recover or what happens next.
  final String? body;

  /// Icon rendered above [message].
  ///
  /// Defaults to [Icons.error_outline]. Override with a domain-specific icon
  /// when context makes the default ambiguous (e.g., a WiFi icon for network
  /// errors).
  final IconData icon;

  /// Called when the retry button is tapped.
  ///
  /// When `null` the retry button is not rendered. When non-null a
  /// "Try again" button (or [retryLabel] if set) is shown below the copy.
  final VoidCallback? retryCallback;

  /// Label for the retry button.
  ///
  /// Defaults to `'Try again'` when [retryCallback] is non-null. Has no
  /// effect if [retryCallback] is `null`.
  final String? retryLabel;

  /// When `true` wraps the error content in a [Scaffold] with an [AppBar].
  ///
  /// Use this for full-screen error routes. The [AppBar] renders
  /// [scaffoldTitle] (or nothing if `null`) and a leading back-button.
  final bool wrapWithScaffold;

  /// Title text for the [AppBar] when [wrapWithScaffold] is `true`.
  ///
  /// No title bar is shown when `null`.
  final String? scaffoldTitle;

  /// Optional override for the accessibility label announced by screen
  /// readers.
  ///
  /// Defaults to [message] when `null`.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final content = _buildContent(context);

    if (wrapWithScaffold) {
      return Scaffold(
        appBar: AppBar(
          title: scaffoldTitle != null ? Text(scaffoldTitle!) : null,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            tooltip: MaterialLocalizations.of(context).backButtonTooltip,
            onPressed: () => Navigator.of(context).maybePop(),
          ),
        ),
        body: SafeArea(child: content),
      );
    }

    return content;
  }

  Widget _buildContent(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    // The error message region uses a liveRegion + excludeSemantics so the
    // full composed label (icon + message + body) is announced as a single
    // unit when the widget appears, without duplicating each child text node
    // in the accessibility tree.
    //
    // The retry button (if present) is placed *outside* the excludeSemantics
    // scope so TalkBack/VoiceOver users can navigate to it independently.
    return Center(
      child: Padding(
        padding: EdgeInsetsDirectional.symmetric(
          horizontal: spacing.xl,
          vertical: spacing.xxl,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Semantics(
              container: true,
              liveRegion: true,
              label: semanticLabel ?? message,
              excludeSemantics: true,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    icon,
                    size: spacing.xxxl,
                    color: colors.textError,
                  ),
                  SizedBox(height: spacing.lg),
                  Text(
                    message,
                    style: textStyles.titleMedium
                        .copyWith(color: colors.textPrimary),
                    textAlign: TextAlign.center,
                  ),
                  if (body != null) ...[
                    SizedBox(height: spacing.sm),
                    Text(
                      body!,
                      style: textStyles.bodyMedium
                          .copyWith(color: colors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
            if (retryCallback != null) ...[
              SizedBox(height: spacing.xl),
              _RetryButton(
                label: retryLabel ?? 'Try again',
                onPressed: retryCallback!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Internal retry button that reads from Visor token extensions.
///
/// Matches the secondary interactive palette so it doesn't compete visually
/// with the error icon, which already draws attention in [colors.textError].
class _RetryButton extends StatelessWidget {
  const _RetryButton({
    required this.label,
    required this.onPressed,
  });

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;
    final strokeWidths = context.visorStrokeWidths;
    final opacity = context.visorOpacity;

    return Semantics(
      button: true,
      label: label,
      enabled: true,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          padding: EdgeInsets.symmetric(
            horizontal: spacing.xl,
            vertical: spacing.md,
          ),
          side: BorderSide(
            color: colors.borderError,
            width: strokeWidths.thin,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius.md),
          ),
          backgroundColor: colors.surfaceErrorSubtle,
          foregroundColor: colors.textError,
          overlayColor: colors.surfaceErrorDefault
              .withValues(alpha: opacity.alpha10),
        ),
        child: Text(
          label,
          style: textStyles.labelMedium.copyWith(color: colors.textError),
        ),
      ),
    );
  }
}
