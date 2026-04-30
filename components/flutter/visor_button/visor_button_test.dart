import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_button.dart';

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
  group('VisorButton', () {
    testWidgets('renders the provided label', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorButton(label: 'Save', onPressed: () {})),
      );
      expect(find.text('Save'), findsOneWidget);
    });

    testWidgets('is disabled when onPressed is null', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorButton(label: 'Save', onPressed: null)),
      );
      final button = tester.widget<FilledButton>(find.byType(FilledButton));
      expect(button.onPressed, isNull);
    });

    testWidgets('swaps label for spinner when isLoading', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () {},
          isLoading: true,
        )),
      );
      expect(find.text('Save'), findsNothing);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('isLoading disables onPressed', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () => tapped = true,
          isLoading: true,
        )),
      );
      await tester.tap(find.byType(FilledButton));
      await tester.pump();
      expect(tapped, isFalse);
    });

    testWidgets('style.secondary renders as FilledButton.tonal',
        (tester) async {
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () {},
          style: VisorButtonStyle.secondary,
        )),
      );
      // FilledButton.tonal creates a FilledButton under the hood; we verify
      // rendering succeeds and the button is a FilledButton.
      expect(find.byType(FilledButton), findsOneWidget);
    });

    testWidgets('style.ghost renders as TextButton', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Cancel',
          onPressed: () {},
          style: VisorButtonStyle.ghost,
        )),
      );
      expect(find.byType(TextButton), findsOneWidget);
      expect(find.byType(FilledButton), findsNothing);
    });

    testWidgets('width.full expands to max width', (tester) async {
      await tester.pumpWidget(
        _wrap(
          SizedBox(
            width: 400,
            child: VisorButton(
              label: 'Save',
              onPressed: () {},
              width: VisorButtonWidth.full,
            ),
          ),
        ),
      );
      final sized = tester.widgetList<SizedBox>(find.byType(SizedBox)).firstWhere(
            (s) => s.width == double.infinity,
            orElse: () =>
                throw StateError('Expected an infinite-width SizedBox'),
          );
      expect(sized.width, double.infinity);
    });

    testWidgets('leading and trailing icons render alongside the label',
        (tester) async {
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () {},
          leadingIcon: const Icon(Icons.save),
          trailingIcon: const Icon(Icons.arrow_forward),
        )),
      );
      expect(find.text('Save'), findsOneWidget);
      expect(find.byIcon(Icons.save), findsOneWidget);
      expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
    });

    testWidgets('fires onPressed when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () => tapped = true,
        )),
      );
      await tester.tap(find.byType(FilledButton));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('semanticLabel overrides button accessibility label',
        (tester) async {
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'OK',
          onPressed: () {},
          semanticLabel: 'Confirm deletion',
        )),
      );
      final semantics = tester.getSemantics(find.text('OK'));
      // Walk up to the enclosing button semantics.
      expect(
        find.bySemanticsLabel('Confirm deletion'),
        findsOneWidget,
      );
      expect(semantics, isNotNull);
    });

    // R11 — meetsGuideline tap-target + labeled-tap-target tests (VI-252)

    testWidgets('md size meets Android tap-target + labeled-tap-target guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorButton(label: 'Save', onPressed: () {})),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets('lg size meets Android tap-target + labeled-tap-target guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () {},
          size: VisorButtonSize.lg,
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'semanticLabel override still passes labeledTapTargetGuideline',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'OK',
          onPressed: () {},
          semanticLabel: 'Confirm deletion',
        )),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    // not-applicable: sm is a compact non-primary tap-target variant — see VI-252
    // sm uses vertical: spacing.xs padding and may yield a height under 48dp by
    // design. Bumping vertical padding would defeat the purpose of the variant.
    // R11 is satisfied by md + lg above; sm is documented as explicitly compact.

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('primary style renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorButton(label: 'Save', onPressed: () {})),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('secondary style renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Save',
          onPressed: () {},
          style: VisorButtonStyle.secondary,
        )),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('ghost style renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorButton(
          label: 'Cancel',
          onPressed: () {},
          style: VisorButtonStyle.ghost,
        )),
      );
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
          VisorButton(label: 'Save', onPressed: () {}),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorButton), findsOneWidget);
    });
  });
}
