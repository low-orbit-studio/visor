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

    testWidgets('all eight token extensions resolve via context',
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
              expect(context.visorOpacity, isA<VisorOpacityData>());
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

    testWidgets('visorOpacity returns the canonical 8-slot scale',
        (tester) async {
      late VisorOpacityData opacity;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (context) {
              opacity = context.visorOpacity;
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      // Fixed scale: 0.05 / 0.10 / 0.12 / 0.20 / 0.40 / 0.50 / 0.60 / 0.80
      expect(opacity.alpha5, 0.05);
      expect(opacity.alpha10, 0.10);
      expect(opacity.alpha12, 0.12);
      expect(opacity.alpha20, 0.20);
      expect(opacity.alpha40, 0.40);
      expect(opacity.alpha50, 0.50);
      expect(opacity.alpha60, 0.60);
      expect(opacity.alpha80, 0.80);
    });
  });
}
