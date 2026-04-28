import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '_fixtures.dart';

void main() {
  group('VisorThemeContext extensions', () {
    testWidgets('visorColors returns the attached VisorColorsData',
        (tester) async {
      final colors = testColors();
      late VisorColorsData captured;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: colors,
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (context) {
              captured = context.visorColors;
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(captured.textPrimary, colors.textPrimary);
      expect(captured.interactivePrimaryBg, colors.interactivePrimaryBg);
    });

    testWidgets('all seven token extensions resolve via context',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (context) {
              // Access every extension — any missing binding would throw
              // the assert in debug or return the wrong type in release.
              expect(context.visorColors, isA<VisorColorsData>());
              expect(context.visorTextStyles, isA<VisorTextStylesData>());
              expect(context.visorSpacing, isA<VisorSpacingData>());
              expect(context.visorRadius, isA<VisorRadiusData>());
              expect(context.visorShadows, isA<VisorShadowsData>());
              expect(context.visorMotion, isA<VisorMotionData>());
              expect(context.visorStrokeWidths, isA<VisorStrokeWidthsData>());
              return const SizedBox.shrink();
            },
          ),
        ),
      );
    });

    testWidgets('visorStrokeWidths returns default scale from visor_core',
        (tester) async {
      late VisorStrokeWidthsData strokes;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (context) {
              strokes = context.visorStrokeWidths;
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      // Default scale: 1.0 / 1.5 / 2.0 / 2.5
      expect(strokes.thin, 1.0);
      expect(strokes.regular, 1.5);
      expect(strokes.medium, 2.0);
      expect(strokes.thick, 2.5);
    });

    testWidgets('visorSpacing returns default scale from visor_core',
        (tester) async {
      late VisorSpacingData spacing;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (context) {
              spacing = context.visorSpacing;
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      // VisorSpacingData.defaults uses a 4px base — xs = 4, md = 12.
      expect(spacing.xs, 4.0);
      expect(spacing.md, 12.0);
    });
  });
}
