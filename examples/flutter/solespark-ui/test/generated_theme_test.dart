// Smoke test for the Visor-generated SoleSpark theme package.
//
// Runs against generated code in `lib/` — regenerating tokens should keep
// this test green as long as the core contract holds:
// - VisorAppTheme.light and .dark return non-null ThemeData.
// - VisorColorsData registers as a ThemeExtension.
// - The primary anchor propagates into ColorScheme.primary.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui/ui.dart';

void main() {
  group('VisorAppTheme (generated)', () {
    test('light returns Material 3 ThemeData with VisorColorsData extension', () {
      final theme = VisorAppTheme.light;
      expect(theme.useMaterial3, isTrue);
      expect(theme.brightness, Brightness.light);
      expect(theme.extension<VisorColorsData>(), isNotNull);
    });

    test('dark returns Material 3 ThemeData with VisorColorsData extension', () {
      final theme = VisorAppTheme.dark;
      expect(theme.useMaterial3, isTrue);
      expect(theme.brightness, Brightness.dark);
      expect(theme.extension<VisorColorsData>(), isNotNull);
    });

    test('primary anchor (#6952D9) propagates into light ColorScheme', () {
      final light = VisorAppTheme.light;
      // SoleSpark's primary is #6952D9 (shade 500). The semantic
      // interactive-primary-bg maps to primary-600 in light mode.
      expect(light.colorScheme.primary, VisorColors.light.interactivePrimaryBg);
      expect(
        VisorColors.primary500,
        equals(const Color(0xFF6952D9)),
      );
    });

    test('scaffold background matches surfacePage', () {
      expect(
        VisorAppTheme.light.scaffoldBackgroundColor,
        VisorColors.light.surfacePage,
      );
      expect(
        VisorAppTheme.dark.scaffoldBackgroundColor,
        VisorColors.dark.surfacePage,
      );
    });

    test('generated VisorColors wrapper exposes primitive shade scale', () {
      // Full-scale roles (primary, accent, neutral) emit 50..950.
      expect(VisorColors.primary50, isA<Color>());
      expect(VisorColors.primary950, isA<Color>());
      expect(VisorColors.neutral50, isA<Color>());
      expect(VisorColors.accent600, isA<Color>());
    });

    test('pre-computed opacity variants carry correct alpha', () {
      // 10% alpha = 0x1A / 255 ≈ 0.1
      expect(VisorColors.primary600_10o.a, closeTo(0.1, 0.02));
      // 50% alpha = 0x80 / 255 ≈ 0.5
      expect(VisorColors.primary600_50o.a, closeTo(0.5, 0.02));
    });

    testWidgets('light theme applies to a MaterialApp', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorAppTheme.light,
          home: const Scaffold(body: Text('hello')),
        ),
      );
      expect(find.text('hello'), findsOneWidget);
      final materialApp = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(materialApp.theme, isNotNull);
      expect(materialApp.theme!.brightness, Brightness.light);
    });

    test('SoleSpark type scale propagates to textTheme', () {
      final theme = VisorAppTheme.light;
      // SoleSpark's displayLarge is 56 / w500 / -0.5 (vs Material default 57 / w400 / -0.25)
      expect(theme.textTheme.displayLarge!.fontSize, 56);
      expect(theme.textTheme.displayLarge!.fontWeight, FontWeight.w500);
      expect(theme.textTheme.displayLarge!.letterSpacing, -0.5);
      // SoleSpark's labelMedium is 15 / w600 (vs Material default 12 / w500)
      expect(theme.textTheme.labelMedium!.fontSize, 15);
      expect(theme.textTheme.labelMedium!.fontWeight, FontWeight.w600);
    });

    test('SoleSpark radius scale wires into Material slot shapes', () {
      final theme = VisorAppTheme.light;
      // Button shape uses radius.sm (=6 in SoleSpark's YAML).
      final buttonShape = theme.filledButtonTheme.style!.shape!
          .resolve(<WidgetState>{})! as RoundedRectangleBorder;
      expect((buttonShape.borderRadius as BorderRadius).topLeft.x, 6);

      // Card shape uses radius.md (=8).
      final cardShape = theme.cardTheme.shape! as RoundedRectangleBorder;
      expect((cardShape.borderRadius as BorderRadius).topLeft.x, 8);
    });

    test('VisorTextStylesData is attached as a ThemeExtension', () {
      final theme = VisorAppTheme.light;
      expect(theme.extension<VisorTextStylesData>(), isNotNull);
      // labelXSmall is Visor-specific; confirm the override lands.
      expect(
        theme.extension<VisorTextStylesData>()!.labelXSmall.fontSize,
        10,
      );
    });
  });
}
