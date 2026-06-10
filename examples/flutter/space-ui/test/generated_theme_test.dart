// Smoke test for the Visor-generated Space theme package.
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

    test('primary anchor (#5B6FFF) propagates into light ColorScheme', () {
      final light = VisorAppTheme.light;
      // Space's primary is #5B6FFF (shade 500). The semantic
      // interactive-primary-bg drives ColorScheme.primary.
      expect(light.colorScheme.primary, VisorColors.light.interactivePrimaryBg);
      expect(
        VisorColors.primary500,
        equals(const Color(0xFF5B6FFF)),
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
      // Full-scale roles (primary, neutral) emit 50..950.
      expect(VisorColors.primary50, isA<Color>());
      expect(VisorColors.primary950, isA<Color>());
      expect(VisorColors.neutral50, isA<Color>());
      expect(VisorColors.neutral600, isA<Color>());
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

    test('Space radius scale wires into Material slot shapes', () {
      final theme = VisorAppTheme.light;
      // Button shape uses radius.sm (=4 in Space's YAML).
      final buttonShape = theme.filledButtonTheme.style!.shape!
          .resolve(<WidgetState>{})! as RoundedRectangleBorder;
      expect((buttonShape.borderRadius as BorderRadius).topLeft.x, 4);

      // Card shape uses radius.md (=6).
      final cardShape = theme.cardTheme.shape! as RoundedRectangleBorder;
      expect((cardShape.borderRadius as BorderRadius).topLeft.x, 6);
    });

    test('VisorTextStylesData is attached as a ThemeExtension', () {
      final theme = VisorAppTheme.light;
      expect(theme.extension<VisorTextStylesData>(), isNotNull);
      // labelXSmall is Visor-specific; confirm the default lands.
      expect(
        theme.extension<VisorTextStylesData>()!.labelXSmall.fontSize,
        10,
      );
    });
  });
}
