import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_rich_text.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: Center(child: child)),
  );
}

/// Walks a [TextSpan] tree and returns every leaf span. `SelectableText.rich`
/// and `RichText` both accept [TextSpan] children, so this works for either
/// rendering path.
List<TextSpan> _flatten(InlineSpan? span) {
  final out = <TextSpan>[];
  if (span is! TextSpan) return out;
  if (span.text != null && span.text!.isNotEmpty) {
    out.add(span);
  }
  for (final child in span.children ?? const <InlineSpan>[]) {
    out.addAll(_flatten(child));
  }
  return out;
}

TextSpan _topSpan(WidgetTester tester) {
  final selectable = find.byType(SelectableText);
  if (selectable.evaluate().isNotEmpty) {
    return tester.widget<SelectableText>(selectable).textSpan!;
  }
  final rich = tester.widget<RichText>(find.byType(RichText).first);
  return rich.text as TextSpan;
}

void main() {
  group('VisorRichText', () {
    // -----------------------------------------------------------------------
    // Rendering — pure text
    // -----------------------------------------------------------------------

    testWidgets('renders pure text when no URLs are present', (tester) async {
      await tester.pumpWidget(_wrap(const VisorRichText(text: 'Hello world')));
      final spans = _flatten(_topSpan(tester));
      expect(spans, hasLength(1));
      expect(spans.single.text, 'Hello world');
      expect(spans.single.recognizer, isNull);
    });

    // -----------------------------------------------------------------------
    // Rendering — URL detection
    // -----------------------------------------------------------------------

    testWidgets('splits a single URL into a link span', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorRichText(text: 'Visit https://example.com today')),
      );
      final spans = _flatten(_topSpan(tester));
      expect(spans.map((s) => s.text).toList(), [
        'Visit ',
        'https://example.com',
        ' today',
      ]);
      // Only the URL span has a tap recognizer.
      expect(spans[0].recognizer, isNull);
      expect(spans[1].recognizer, isA<TapGestureRecognizer>());
      expect(spans[2].recognizer, isNull);
    });

    testWidgets('handles multiple URLs in one string', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorRichText(
            text: 'See https://a.example.com and https://b.example.com.',
          ),
        ),
      );
      final spans = _flatten(_topSpan(tester));
      final linkTexts =
          spans.where((s) => s.recognizer != null).map((s) => s.text).toList();
      expect(linkTexts, [
        'https://a.example.com',
        'https://b.example.com',
      ]);
    });

    testWidgets('renders the URL at the start of the string as a link',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorRichText(text: 'https://example.com is the link')),
      );
      final spans = _flatten(_topSpan(tester));
      expect(spans.first.text, 'https://example.com');
      expect(spans.first.recognizer, isA<TapGestureRecognizer>());
    });

    // -----------------------------------------------------------------------
    // Tap handling
    // -----------------------------------------------------------------------

    testWidgets('tapping a link span invokes onLinkTap with the URL',
        (tester) async {
      String? tappedUrl;
      await tester.pumpWidget(
        _wrap(
          VisorRichText(
            text: 'Open https://example.com please',
            onLinkTap: (url) => tappedUrl = url,
          ),
        ),
      );
      final span = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      (span.recognizer! as TapGestureRecognizer).onTap!();
      expect(tappedUrl, 'https://example.com');
    });

    // -----------------------------------------------------------------------
    // Token-driven styling
    // -----------------------------------------------------------------------

    testWidgets('link span uses textLink color from VisorColors by default',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorRichText(text: 'Open https://example.com')),
      );
      final link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      // testColors() sets textLink to 0xFF2563EB.
      expect(link.style!.color, const Color(0xFF2563EB));
    });

    testWidgets('linkStyle override is applied to link spans', (tester) async {
      const overrideColor = Color(0xFF112233);
      await tester.pumpWidget(
        _wrap(
          const VisorRichText(
            text: 'Open https://example.com',
            linkStyle: TextStyle(color: overrideColor),
          ),
        ),
      );
      final link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      expect(link.style!.color, overrideColor);
    });

    testWidgets('style override is applied to base spans', (tester) async {
      const overrideColor = Color(0xFF445566);
      await tester.pumpWidget(
        _wrap(
          const VisorRichText(
            text: 'Plain text only',
            style: TextStyle(color: overrideColor),
          ),
        ),
      );
      final span = _flatten(_topSpan(tester)).single;
      expect(span.style!.color, overrideColor);
    });

    // -----------------------------------------------------------------------
    // Selectable toggle
    // -----------------------------------------------------------------------

    testWidgets('renders SelectableText.rich by default', (tester) async {
      await tester.pumpWidget(_wrap(const VisorRichText(text: 'Hello')));
      expect(find.byType(SelectableText), findsOneWidget);
    });

    testWidgets('renders RichText (no SelectableText) when selectable: false',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorRichText(text: 'Hello', selectable: false)),
      );
      expect(find.byType(SelectableText), findsNothing);
      expect(find.byType(RichText), findsAtLeastNWidgets(1));
    });

    // -----------------------------------------------------------------------
    // Semantics
    // -----------------------------------------------------------------------

    testWidgets('link span carries its URL as semanticsLabel', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorRichText(text: 'Visit https://example.com')),
      );
      final link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      expect(link.semanticsLabel, 'https://example.com');
    });

    testWidgets('semanticLabel wraps the widget in a Semantics node',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(
          const VisorRichText(
            text: 'Hello',
            semanticLabel: 'Greeting copy',
          ),
        ),
      );
      expect(find.bySemanticsLabel('Greeting copy'), findsOneWidget);
      handle.dispose();
    });

    // not applicable: inline-text — link tap surfaces are text-sized by
    // design; meetsGuideline tap-target matchers don't apply per quality
    // contract R7/R11 escape hatch.

    // -----------------------------------------------------------------------
    // URL detection — encoding + punctuation
    // -----------------------------------------------------------------------

    testWidgets('preserves percent-encoded characters inside URLs',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorRichText(
            text: 'Search https://example.com/q?term=hello%20world.',
          ),
        ),
      );
      final link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      expect(link.text, 'https://example.com/q?term=hello%20world');
    });

    testWidgets('strips trailing sentence punctuation but keeps balanced ()',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorRichText(
            text: 'See (https://en.wikipedia.org/wiki/URL_(rfc)) for more.',
          ),
        ),
      );
      final link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      expect(link.text, 'https://en.wikipedia.org/wiki/URL_(rfc)');
    });

    // -----------------------------------------------------------------------
    // Recognizer lifecycle — no leak across rebuilds
    // -----------------------------------------------------------------------

    testWidgets('updates link spans when text prop changes', (tester) async {
      String? tappedUrl;
      Widget tree(String text) => _wrap(
            VisorRichText(text: text, onLinkTap: (url) => tappedUrl = url),
          );

      await tester.pumpWidget(tree('First https://a.example.com'));
      var link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      expect(link.text, 'https://a.example.com');

      await tester.pumpWidget(tree('Second https://b.example.com'));
      link = _flatten(_topSpan(tester))
          .firstWhere((s) => s.recognizer != null);
      expect(link.text, 'https://b.example.com');
      // Tapping the new link still routes through onLinkTap with the new URL.
      (link.recognizer! as TapGestureRecognizer).onTap!();
      expect(tappedUrl, 'https://b.example.com');
    });

    testWidgets('disposing the widget tree does not throw',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorRichText(text: 'See https://example.com')),
      );
      // Swap in an empty tree — triggers State.dispose() on VisorRichText.
      await tester.pumpWidget(_wrap(const SizedBox()));
      // Reaching here without exception confirms recognizers disposed cleanly.
    });
  });
}
