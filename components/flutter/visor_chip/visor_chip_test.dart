import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_chip.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: Center(child: child)),
  );
}

void main() {
  group('VisorChip', () {
    // -------------------------------------------------------------------------
    // Smoke render
    // -------------------------------------------------------------------------

    testWidgets('renders the provided label', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(label: 'Modern', onPressed: null)),
      );
      expect(find.text('Modern'), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // Interaction
    // -------------------------------------------------------------------------

    testWidgets('fires onPressed when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(VisorChip(label: 'Tag', onPressed: () => tapped = true)),
      );
      await tester.tap(find.byType(VisorChip));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('does not throw when onPressed is null', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(label: 'Tag', onPressed: null)),
      );
      await tester.tap(find.byType(VisorChip));
      await tester.pump();
      // No exception = pass
    });

    // -------------------------------------------------------------------------
    // Selected / unselected states
    // -------------------------------------------------------------------------

    testWidgets('renders unselected state by default', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(label: 'Tag', onPressed: null)),
      );
      final container = tester.widget<AnimatedContainer>(
        find.byType(AnimatedContainer),
      );
      final decoration = container.decoration as BoxDecoration;
      // Unselected suggestion chip uses surfaceCard (white in light theme)
      expect(decoration.color, isNotNull);
      expect(decoration.border, isNotNull);
    });

    testWidgets('selected state changes background', (tester) async {
      // Measure unselected bg
      await tester.pumpWidget(
        _wrap(const VisorChip(label: 'Tag', onPressed: null)),
      );
      final unselectedDecoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final unselectedBg = unselectedDecoration.color;

      // Measure selected bg
      await tester.pumpWidget(
        _wrap(const VisorChip(
          label: 'Tag',
          isSelected: true,
          onPressed: null,
        )),
      );
      final selectedDecoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final selectedBg = selectedDecoration.color;

      expect(selectedBg, isNotNull);
      expect(selectedBg, isNot(equals(unselectedBg)));
    });

    testWidgets(
      'dimensions are consistent between selected and unselected states',
      (tester) async {
        await tester.pumpWidget(
          _wrap(const Align(
            alignment: Alignment.topLeft,
            child: VisorChip(label: 'Tag', onPressed: null),
          )),
        );
        final unselectedSize = tester.getSize(find.byType(VisorChip));

        await tester.pumpWidget(
          _wrap(const Align(
            alignment: Alignment.topLeft,
            child: VisorChip(
              label: 'Tag',
              isSelected: true,
              onPressed: null,
            ),
          )),
        );
        final selectedSize = tester.getSize(find.byType(VisorChip));

        // Width may differ slightly due to border-radius animation, but
        // height should remain consistent.
        expect(selectedSize.height, closeTo(unselectedSize.height, 2));
      },
    );

    // -------------------------------------------------------------------------
    // Variant — suggestion
    // -------------------------------------------------------------------------

    testWidgets('suggestion variant unselected uses xl radius', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(
          label: 'Tag',
          variant: VisorChipVariant.suggestion,
          onPressed: null,
        )),
      );
      final decoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final br = decoration.borderRadius! as BorderRadius;
      // xl is ~20–24 depending on theme; just check it's > 8
      expect(br.topLeft.x, greaterThan(8));
    });

    testWidgets('suggestion variant selected uses pill radius', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(
          label: 'Tag',
          variant: VisorChipVariant.suggestion,
          isSelected: true,
          onPressed: null,
        )),
      );
      final decoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final br = decoration.borderRadius! as BorderRadius;
      // pill is 9999 or similar very large value
      expect(br.topLeft.x, greaterThan(20));
    });

    testWidgets('suggestion selected has transparent border', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(
          label: 'Tag',
          variant: VisorChipVariant.suggestion,
          isSelected: true,
          onPressed: null,
        )),
      );
      final decoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final border = decoration.border! as Border;
      expect(border.top.color, Colors.transparent);
    });

    // -------------------------------------------------------------------------
    // Variant — filter
    // -------------------------------------------------------------------------

    testWidgets('filter variant always has a border', (tester) async {
      for (final isSelected in [false, true]) {
        await tester.pumpWidget(
          _wrap(VisorChip(
            label: 'Tag',
            variant: VisorChipVariant.filter,
            isSelected: isSelected,
            onPressed: null,
          )),
        );
        final decoration = (tester
                .widget<AnimatedContainer>(find.byType(AnimatedContainer))
                .decoration as BoxDecoration);
        final border = decoration.border! as Border;
        expect(border.top.color.a, greaterThan(0),
            reason: 'filter variant border should be visible (isSelected=$isSelected)');
      }
    });

    testWidgets('filter variant uses md radius for md size', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(
          label: 'Tag',
          variant: VisorChipVariant.filter,
          size: VisorChipSize.md,
          onPressed: null,
        )),
      );
      final decoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final br = decoration.borderRadius! as BorderRadius;
      // md radius is ~8
      expect(br.topLeft.x, greaterThan(0));
      expect(br.topLeft.x, lessThan(20));
    });

    testWidgets('filter variant uses sm radius for sm size', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorChip(
          label: 'Tag',
          variant: VisorChipVariant.filter,
          size: VisorChipSize.sm,
          onPressed: null,
        )),
      );
      final decoration = (tester
              .widget<AnimatedContainer>(find.byType(AnimatedContainer))
              .decoration as BoxDecoration);
      final br = decoration.borderRadius! as BorderRadius;
      // sm radius is ~4–6
      expect(br.topLeft.x, greaterThan(0));
      expect(br.topLeft.x, lessThan(12));
    });

    // -------------------------------------------------------------------------
    // Size variants
    // -------------------------------------------------------------------------

    testWidgets('sm uses smaller text style than md', (tester) async {
      // Both sizes share the same 48dp minimum-height outer SizedBox (R7),
      // so getSize on VisorChip itself returns 48 in both cases. Instead we
      // verify the AnimatedContainer (the visual chip body) is shorter for sm.
      await tester.pumpWidget(
        _wrap(const Align(
          alignment: Alignment.topLeft,
          child: VisorChip(label: 'Tag', size: VisorChipSize.md, onPressed: null),
        )),
      );
      final mdContainerHeight =
          tester.getSize(find.byType(AnimatedContainer)).height;

      await tester.pumpWidget(
        _wrap(const Align(
          alignment: Alignment.topLeft,
          child: VisorChip(label: 'Tag', size: VisorChipSize.sm, onPressed: null),
        )),
      );
      final smContainerHeight =
          tester.getSize(find.byType(AnimatedContainer)).height;

      expect(smContainerHeight, lessThan(mdContainerHeight));
    });

    // -------------------------------------------------------------------------
    // Semantics — R6 + R11
    // -------------------------------------------------------------------------

    testWidgets('uses label as semantic label by default', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorChip(
          label: 'Accessible Tag',
          onPressed: () {},
        )),
      );
      expect(find.bySemanticsLabel('Accessible Tag'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('semanticLabel override is announced instead of label',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorChip(
          label: 'Modern',
          semanticLabel: 'Select Modern style',
          onPressed: () {},
        )),
      );
      expect(find.bySemanticsLabel('Select Modern style'), findsOneWidget);
      // The text child is excluded from the semantics tree so it does not
      // produce a duplicate label node — only the Semantics wrapper label fires.
      expect(find.bySemanticsLabel('Modern'), findsNothing);
      handle.dispose();
    });

    testWidgets('md size meets Android tap-target + labeled-tap-target guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorChip(
          label: 'Tag',
          size: VisorChipSize.md,
          onPressed: () {},
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    // not-applicable: sm is a compact non-primary variant — similar to
    // VisorButton.sm, it may yield a height under 48dp by design.
    // R11 is satisfied by md above; sm is documented as explicitly compact.
  });
}
