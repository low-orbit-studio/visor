import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_stat_card.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Directionality(
      textDirection: textDirection,
      child: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('VisorStatCard', () {
    testWidgets('renders title and value', (tester) async {
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
      )));
      expect(find.text('Revenue'), findsOneWidget);
      expect(find.text(r'$12,430'), findsOneWidget);
    });

    testWidgets('omits delta row when delta is null', (tester) async {
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Users',
        value: '1,204',
      )));
      expect(find.byIcon(Icons.arrow_upward), findsNothing);
      expect(find.byIcon(Icons.arrow_downward), findsNothing);
      expect(find.byIcon(Icons.horizontal_rule), findsNothing);
    });

    testWidgets('shows up arrow for VisorDeltaDirection.up', (tester) async {
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
        delta: '+8.2%',
        deltaDirection: VisorDeltaDirection.up,
      )));
      expect(find.text('+8.2%'), findsOneWidget);
      expect(find.byIcon(Icons.arrow_upward), findsOneWidget);
    });

    testWidgets('shows down arrow for VisorDeltaDirection.down',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Churn',
        value: '2.4%',
        delta: '-0.3pp',
        deltaDirection: VisorDeltaDirection.down,
      )));
      expect(find.byIcon(Icons.arrow_downward), findsOneWidget);
    });

    testWidgets('renders leading icon when provided', (tester) async {
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
        icon: Icons.trending_up,
      )));
      expect(find.byIcon(Icons.trending_up), findsOneWidget);
    });

    testWidgets("default Semantics label is '<title>: <value>' when no delta",
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
      )));
      expect(find.bySemanticsLabel(r'Revenue: $12,430'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('default Semantics label includes delta when present',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
        delta: '+8.2%',
        deltaDirection: VisorDeltaDirection.up,
      )));
      expect(
        find.bySemanticsLabel(r'Revenue: $12,430, +8.2%'),
        findsOneWidget,
      );
      handle.dispose();
    });

    testWidgets('semanticLabel param overrides default composition',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
        semanticLabel: 'Custom override',
      )));
      expect(find.bySemanticsLabel('Custom override'), findsOneWidget);
      expect(find.bySemanticsLabel(r'Revenue: $12,430'), findsNothing);
      handle.dispose();
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('renders with sufficient text contrast (no delta)',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
      )));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('renders with sufficient text contrast (with delta up)',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Revenue',
        value: r'$12,430',
        delta: '+8.2%',
        deltaDirection: VisorDeltaDirection.up,
      )));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('renders with sufficient text contrast (with delta down)',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorStatCard(
        title: 'Churn',
        value: '2.4%',
        delta: '-0.3pp',
        deltaDirection: VisorDeltaDirection.down,
      )));
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
          const VisorStatCard(
            title: 'Revenue',
            value: r'$12,430',
            delta: '+8.2%',
            deltaDirection: VisorDeltaDirection.up,
          ),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorStatCard), findsOneWidget);
      // Delta arrows (arrow_upward / arrow_downward) are semantic direction
      // indicators, not layout-directional icons — they convey trend, not
      // pointing direction. They remain unchanged in RTL (up arrow still means
      // "went up"). No semantic mirroring follow-up required.
      expect(find.byIcon(Icons.arrow_upward), findsOneWidget);
    });
  });
}
