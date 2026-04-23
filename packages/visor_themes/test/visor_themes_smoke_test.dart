// Smoke tests for packages/visor_themes — the aggregated Visor Flutter theme package.
//
// Verification plan from VI-216:
// - VisorThemes.blackout.light returns non-null ThemeData with Brightness.light
//   and VisorColorsData extension.
// - VisorThemes.blackout.dark returns ThemeData with Brightness.dark.
// - VisorThemes.modernMinimal.light.colorScheme.primary matches
//   the VisorColors.light.interactivePrimaryBg for that theme.
// - All 11 theme getters are reachable from VisorThemes.
// - Regenerating (re-running themes:apply-flutter) produces identical output
//   (idempotency check via color-value assertions).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_themes/visor_themes.dart';

// Per-theme color accessors for assertion (imported via the barrel's re-export
// of visor_core which exposes VisorColorsData).
import 'package:visor_themes/src/blackout/colors/visor_colors.dart' as blackout_colors;
import 'package:visor_themes/src/modern-minimal/colors/visor_colors.dart' as modern_minimal_colors;
import 'package:visor_themes/src/solespark/colors/visor_colors.dart' as solespark_colors;

void main() {
  // =========================================================================
  // Brightness contract
  // =========================================================================
  group('VisorThemes brightness contract', () {
    test('blackout.light has Brightness.light', () {
      final theme = VisorThemes.blackout.light;
      expect(theme, isNotNull);
      expect(theme.brightness, Brightness.light);
      expect(theme.useMaterial3, isTrue);
    });

    test('blackout.dark has Brightness.dark', () {
      final theme = VisorThemes.blackout.dark;
      expect(theme, isNotNull);
      expect(theme.brightness, Brightness.dark);
      expect(theme.useMaterial3, isTrue);
    });
  });

  // =========================================================================
  // VisorColorsData ThemeExtension
  // =========================================================================
  group('VisorColorsData ThemeExtension', () {
    test('blackout.light carries VisorColorsData extension', () {
      final theme = VisorThemes.blackout.light;
      expect(theme.extension<VisorColorsData>(), isNotNull);
    });

    test('blackout.dark carries VisorColorsData extension', () {
      final theme = VisorThemes.blackout.dark;
      expect(theme.extension<VisorColorsData>(), isNotNull);
    });

    test('modernMinimal.light carries VisorColorsData extension', () {
      expect(VisorThemes.modernMinimal.light.extension<VisorColorsData>(), isNotNull);
    });
  });

  // =========================================================================
  // colorScheme.primary wires from interactivePrimaryBg
  // =========================================================================
  group('ColorScheme.primary propagation', () {
    test('blackout.light colorScheme.primary matches interactivePrimaryBg', () {
      final light = VisorThemes.blackout.light;
      expect(light.colorScheme.primary, blackout_colors.VisorColors.light.interactivePrimaryBg);
    });

    test('modernMinimal.light colorScheme.primary matches interactivePrimaryBg', () {
      final light = VisorThemes.modernMinimal.light;
      expect(light.colorScheme.primary, modern_minimal_colors.VisorColors.light.interactivePrimaryBg);
    });

    test('solespark.light colorScheme.primary matches interactivePrimaryBg', () {
      final light = VisorThemes.solespark.light;
      expect(light.colorScheme.primary, solespark_colors.VisorColors.light.interactivePrimaryBg);
    });
  });

  // =========================================================================
  // All 11 theme getters reachable
  // =========================================================================
  group('All 11 theme getters reachable', () {
    test('blackout is accessible', () {
      expect(VisorThemes.blackout.light, isNotNull);
      expect(VisorThemes.blackout.dark, isNotNull);
    });

    test('modernMinimal is accessible', () {
      expect(VisorThemes.modernMinimal.light, isNotNull);
      expect(VisorThemes.modernMinimal.dark, isNotNull);
    });

    test('neutral is accessible', () {
      expect(VisorThemes.neutral.light, isNotNull);
      expect(VisorThemes.neutral.dark, isNotNull);
    });

    test('space is accessible', () {
      expect(VisorThemes.space.light, isNotNull);
      expect(VisorThemes.space.dark, isNotNull);
    });

    test('blacklight is accessible', () {
      expect(VisorThemes.blacklight.light, isNotNull);
      expect(VisorThemes.blacklight.dark, isNotNull);
    });

    test('blacklightUnderground is accessible', () {
      expect(VisorThemes.blacklightUnderground.light, isNotNull);
      expect(VisorThemes.blacklightUnderground.dark, isNotNull);
    });

    test('entr is accessible', () {
      expect(VisorThemes.entr.light, isNotNull);
      expect(VisorThemes.entr.dark, isNotNull);
    });

    test('kaiah is accessible', () {
      expect(VisorThemes.kaiah.light, isNotNull);
      expect(VisorThemes.kaiah.dark, isNotNull);
    });

    test('referenceApp is accessible', () {
      expect(VisorThemes.referenceApp.light, isNotNull);
      expect(VisorThemes.referenceApp.dark, isNotNull);
    });

    test('solespark is accessible', () {
      expect(VisorThemes.solespark.light, isNotNull);
      expect(VisorThemes.solespark.dark, isNotNull);
    });

    test('veronica is accessible', () {
      expect(VisorThemes.veronica.light, isNotNull);
      expect(VisorThemes.veronica.dark, isNotNull);
    });
  });

  // =========================================================================
  // VisorThemePair contract
  // =========================================================================
  group('VisorThemePair', () {
    test('light and dark are distinct objects', () {
      final pair = VisorThemes.blackout;
      expect(pair.light, isNot(same(pair.dark)));
    });

    test('light.brightness != dark.brightness', () {
      final pair = VisorThemes.solespark;
      expect(pair.light.brightness, isNot(equals(pair.dark.brightness)));
    });
  });

  // =========================================================================
  // Idempotency — getters return fresh equivalent ThemeData each call
  // =========================================================================
  group('Idempotency', () {
    test('blackout.light returns consistent primary color across calls', () {
      final a = VisorThemes.blackout.light;
      final b = VisorThemes.blackout.light;
      expect(a.colorScheme.primary, equals(b.colorScheme.primary));
    });

    test('solespark primary color matches expected hex #6952D9 (primary500)', () {
      // SoleSpark primary is #6952D9 — the semantic interactivePrimaryBg in
      // light mode maps to primary-600 (#5235BB).
      expect(
        solespark_colors.VisorColors.primary500,
        equals(const Color(0xFF6952D9)),
      );
    });

    test('blackout.dark scaffold background matches surfacePage', () {
      final dark = VisorThemes.blackout.dark;
      expect(
        dark.scaffoldBackgroundColor,
        blackout_colors.VisorColors.dark.surfacePage,
      );
    });
  });

  // =========================================================================
  // MaterialApp widget test
  // =========================================================================
  group('MaterialApp integration', () {
    testWidgets('blackout.light applies to MaterialApp', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorThemes.blackout.light,
          home: const Scaffold(body: Text('smoke')),
        ),
      );
      expect(find.text('smoke'), findsOneWidget);
      final app = tester.widget<MaterialApp>(find.byType(MaterialApp));
      expect(app.theme?.brightness, Brightness.light);
    });

    testWidgets('solespark dark applies to MaterialApp', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          darkTheme: VisorThemes.solespark.dark,
          home: const Scaffold(body: Text('smoke')),
        ),
      );
      expect(find.text('smoke'), findsOneWidget);
    });
  });
}
