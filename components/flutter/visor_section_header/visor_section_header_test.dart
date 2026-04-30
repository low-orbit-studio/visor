import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_section_header.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Directionality(
      textDirection: textDirection,
      child: Scaffold(body: child),
    ),
  );
}

void main() {
  group('VisorSectionHeader', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(title: 'Recent activity'),
      ));
      expect(find.text('Recent activity'), findsOneWidget);
    });

    testWidgets('renders subtitle when provided', (tester) async {
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(
          title: 'Recent activity',
          subtitle: 'Last 30 days',
        ),
      ));
      expect(find.text('Last 30 days'), findsOneWidget);
    });

    testWidgets('omits subtitle when null', (tester) async {
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(title: 'Recent activity'),
      ));
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders trailing widget when provided', (tester) async {
      await tester.pumpWidget(_wrap(
        VisorSectionHeader(
          title: 'Recent activity',
          trailing: TextButton(
            onPressed: () {},
            child: const Text('View all'),
          ),
        ),
      ));
      expect(find.byType(TextButton), findsOneWidget);
      expect(find.text('View all'), findsOneWidget);
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('title renders with sufficient text contrast', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(title: 'Recent activity'),
      ));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('title + subtitle render with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(
          title: 'Recent activity',
          subtitle: 'Last 30 days',
        ),
      ));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    // -------------------------------------------------------------------------
    // R9 — Directionality respect
    // -------------------------------------------------------------------------

    testWidgets('renders without overflow or exception under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorSectionHeader(title: 'Recent activity'),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorSectionHeader), findsOneWidget);
      // VisorSectionHeader is text-only by default; no trailing icons present.
      // The Row lays out title (and optional trailing widget) with Directionality
      // awareness — in RTL, trailing content moves to the left end. No icon
      // mirroring required since there are no directional glyphs in the default
      // configuration.
    });

    testWidgets('renders trailing widget without overflow under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorSectionHeader(
            title: 'Recent activity',
            trailing: TextButton(
              onPressed: () {},
              child: const Text('View all'),
            ),
          ),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(TextButton), findsOneWidget);
    });
  });
}
