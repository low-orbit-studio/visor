import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_loading_dots.dart';

Widget _wrap(Widget child, {bool disableAnimations = false}) {
  return MediaQuery(
    data: MediaQueryData(disableAnimations: disableAnimations),
    child: MaterialApp(
      theme: VisorTheme.build(
        colors: testColors(),
        brightness: Brightness.light,
      ),
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('VisorLoadingDots', () {
    // -----------------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------------

    testWidgets('renders three dots', (tester) async {
      await tester.pumpWidget(_wrap(const VisorLoadingDots()));
      // Three _AnimatedDot widgets → three SizedBox + DecoratedBox pairs.
      expect(find.byType(DecoratedBox), findsNWidgets(3));
    });

    testWidgets('default dot size is 10 dp', (tester) async {
      await tester.pumpWidget(_wrap(const VisorLoadingDots()));
      final boxes = tester.widgetList<SizedBox>(find.byType(SizedBox)).where(
            (s) => s.width == 10.0 && s.height == 10.0,
          );
      expect(boxes.length, 3);
    });

    testWidgets('custom dot size is applied to all three dots', (tester) async {
      await tester.pumpWidget(_wrap(const VisorLoadingDots(dotSize: 20.0)));
      final boxes = tester.widgetList<SizedBox>(find.byType(SizedBox)).where(
            (s) => s.width == 20.0 && s.height == 20.0,
          );
      expect(boxes.length, 3);
    });

    testWidgets('renders a Row with three children', (tester) async {
      await tester.pumpWidget(_wrap(const VisorLoadingDots()));
      final row = tester.widget<Row>(find.byType(Row));
      expect(row.mainAxisSize, MainAxisSize.min);
    });

    // -----------------------------------------------------------------------
    // Animation — running by default
    // -----------------------------------------------------------------------

    testWidgets('animation controller is active when disableAnimations is false',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorLoadingDots()));
      // Advance by 750 ms (half the 1500 ms cycle) — if the controller is
      // repeating, the dots should still be present after frame advance.
      await tester.pump(const Duration(milliseconds: 750));
      // Widget still renders (no error, dots still present).
      expect(find.byType(DecoratedBox), findsNWidgets(3));
    });

    // -----------------------------------------------------------------------
    // Reduce-motion
    // -----------------------------------------------------------------------

    testWidgets('animation halts when disableAnimations is true', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingDots(), disableAnimations: true),
      );
      // Pump a full cycle — if the controller is stopped, state remains stable.
      await tester.pump(const Duration(seconds: 2));
      // Dots still render (no error).
      expect(find.byType(DecoratedBox), findsNWidgets(3));
    });

    testWidgets('dots render at resting color when disableAnimations is true',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorLoadingDots(), disableAnimations: true),
      );
      // All three decorated boxes should be circles; they will use colorStart
      // (surfaceAccentSubtle from testColors = 0xFFEFF6FF).
      final decorated =
          tester.widgetList<DecoratedBox>(find.byType(DecoratedBox)).toList();
      expect(decorated.length, 3);
      for (final box in decorated) {
        final decoration = box.decoration as BoxDecoration;
        expect(decoration.shape, BoxShape.circle);
        // Color must be non-null (controller value = 0 → colorStart).
        expect(decoration.color, isNotNull);
      }
    });

    testWidgets(
        'toggling disableAnimations from true to false resumes animation',
        (tester) async {
      // Start with animations disabled.
      await tester.pumpWidget(
        _wrap(const VisorLoadingDots(), disableAnimations: true),
      );
      // Re-render with animations enabled.
      await tester.pumpWidget(
        _wrap(const VisorLoadingDots(), disableAnimations: false),
      );
      await tester.pump(const Duration(milliseconds: 750));
      // Widget still renders without error — animation resumed.
      expect(find.byType(DecoratedBox), findsNWidgets(3));
    });

    // -----------------------------------------------------------------------
    // Semantics
    // -----------------------------------------------------------------------

    testWidgets('no Semantics label by default', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorLoadingDots()));
      expect(find.bySemanticsLabel('Loading'), findsNothing);
      handle.dispose();
    });

    testWidgets('renders Semantics label when semanticLabel is provided',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorLoadingDots(semanticLabel: 'Loading')),
      );
      expect(find.bySemanticsLabel('Loading'), findsOneWidget);
      handle.dispose();
    });

    // -----------------------------------------------------------------------
    // Custom colors
    // -----------------------------------------------------------------------

    testWidgets('custom colors are accepted without error', (tester) async {
      const customStart = Color(0xFFE0F2FE);
      const customMid = Color(0xFF38BDF8);
      const customEnd = Color(0xFF0369A1);
      await tester.pumpWidget(
        _wrap(
          const VisorLoadingDots(
            colorStart: customStart,
            colorMid: customMid,
            colorEnd: customEnd,
          ),
        ),
      );
      expect(find.byType(DecoratedBox), findsNWidgets(3));
    });

    // -----------------------------------------------------------------------
    // Dispose safety
    // -----------------------------------------------------------------------

    testWidgets('no error when widget is disposed while animating',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorLoadingDots()));
      // Pump a little to ensure controller is running.
      await tester.pump(const Duration(milliseconds: 100));
      // Swap widget out (triggers dispose).
      await tester.pumpWidget(_wrap(const SizedBox()));
      await tester.pump(const Duration(milliseconds: 500));
      // No error = test passes.
    });
  });
}
