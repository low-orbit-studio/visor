import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

void main() {
  group('VisorTheme.build', () {
    test('produces a ThemeData with ColorScheme derived from VisorColorsData', () {
      final colors = _testColors();
      final theme =
          VisorTheme.build(colors: colors, brightness: Brightness.light);

      expect(theme.useMaterial3, isTrue);
      expect(theme.brightness, Brightness.light);
      expect(theme.colorScheme.primary, colors.interactivePrimaryBg);
      expect(theme.colorScheme.onPrimary, colors.interactivePrimaryText);
      expect(theme.colorScheme.surface, colors.surfacePage);
      expect(theme.scaffoldBackgroundColor, colors.surfacePage);
    });

    test('registers VisorColorsData as a ThemeExtension', () {
      final colors = _testColors();
      final theme =
          VisorTheme.build(colors: colors, brightness: Brightness.light);

      final resolved = theme.extension<VisorColorsData>();
      expect(resolved, isNotNull);
      expect(resolved!.textPrimary, colors.textPrimary);
    });

    test('falls back to defaults for motion/radius/shadows/spacing', () {
      final theme = VisorTheme.build(
        colors: _testColors(),
        brightness: Brightness.light,
      );

      expect(theme.extension<VisorMotionData>(), isNotNull);
      expect(theme.extension<VisorRadiusData>(), isNotNull);
      expect(theme.extension<VisorShadowsData>(), isNotNull);
      expect(theme.extension<VisorSpacingData>(), isNotNull);
    });

    test('honors supplied motion/radius when provided', () {
      const customRadius = VisorRadiusData(sm: 2, md: 4, lg: 8, xl: 12, pill: 999);
      final theme = VisorTheme.build(
        colors: _testColors(),
        brightness: Brightness.light,
        radius: customRadius,
      );

      expect(theme.extension<VisorRadiusData>()!.md, 4.0);
    });
  });

  group('VisorColorsData lerp', () {
    test('interpolates colors between two instances', () {
      final a = _testColors();
      final b = _testColors(textPrimaryValue: 0xFFFFFFFF);

      final mid = a.lerp(b, 0.5);
      // Midpoint of black-ish (0x11) and white (0xFF) on each channel.
      expect(mid.textPrimary.a, greaterThan(0.0));
    });

    test('returns self when other is not VisorColorsData', () {
      final a = _testColors();
      expect(a.lerp(null, 0.5), same(a));
    });
  });
}

VisorColorsData _testColors({int textPrimaryValue = 0xFF111111}) {
  return VisorColorsData(
    textPrimary: Color(textPrimaryValue),
    textSecondary: const Color(0xFF555555),
    textTertiary: const Color(0xFF888888),
    textDisabled: const Color(0xFFCCCCCC),
    textInverse: const Color(0xFFFFFFFF),
    textInverseSecondary: const Color(0xFFE5E5E5),
    textLink: const Color(0xFF2563EB),
    textLinkHover: const Color(0xFF1D4ED8),
    textSuccess: const Color(0xFF15803D),
    textWarning: const Color(0xFFB45309),
    textError: const Color(0xFFB91C1C),
    textInfo: const Color(0xFF0369A1),
    surfacePage: const Color(0xFFFFFFFF),
    surfaceCard: const Color(0xFFFFFFFF),
    surfaceSubtle: const Color(0xFFF9FAFB),
    surfaceMuted: const Color(0xFFF3F4F6),
    surfaceOverlay: const Color(0xFF111827),
    surfaceInteractiveDefault: const Color(0xFFFFFFFF),
    surfaceInteractiveHover: const Color(0xFFF9FAFB),
    surfaceInteractiveActive: const Color(0xFFF3F4F6),
    surfaceInteractiveDisabled: const Color(0xFFF9FAFB),
    surfaceAccentSubtle: const Color(0xFFEFF6FF),
    surfaceAccentDefault: const Color(0xFF3B82F6),
    surfaceAccentStrong: const Color(0xFF2563EB),
    surfaceSuccessSubtle: const Color(0xFFF0FDF4),
    surfaceSuccessDefault: const Color(0xFF22C55E),
    surfaceWarningSubtle: const Color(0xFFFFFBEB),
    surfaceWarningDefault: const Color(0xFFF59E0B),
    surfaceErrorSubtle: const Color(0xFFFEF2F2),
    surfaceErrorDefault: const Color(0xFFEF4444),
    surfaceInfoSubtle: const Color(0xFFF0F9FF),
    surfaceInfoDefault: const Color(0xFF0EA5E9),
    borderDefault: const Color(0xFFE5E7EB),
    borderMuted: const Color(0xFFF3F4F6),
    borderStrong: const Color(0xFFD1D5DB),
    borderFocus: const Color(0xFF3B82F6),
    borderDisabled: const Color(0xFFF3F4F6),
    borderSuccess: const Color(0xFF22C55E),
    borderWarning: const Color(0xFFF59E0B),
    borderError: const Color(0xFFEF4444),
    borderInfo: const Color(0xFF0EA5E9),
    interactivePrimaryBg: const Color(0xFF2563EB),
    interactivePrimaryBgHover: const Color(0xFF1D4ED8),
    interactivePrimaryBgActive: const Color(0xFF1E40AF),
    interactivePrimaryText: const Color(0xFFFFFFFF),
    interactiveSecondaryBg: const Color(0xFFFFFFFF),
    interactiveSecondaryBgHover: const Color(0xFFF9FAFB),
    interactiveSecondaryBgActive: const Color(0xFFF3F4F6),
    interactiveSecondaryText: const Color(0xFF111827),
    interactiveSecondaryBorder: const Color(0xFFD1D5DB),
    interactiveDestructiveBg: const Color(0xFFDC2626),
    interactiveDestructiveBgHover: const Color(0xFFB91C1C),
    interactiveDestructiveText: const Color(0xFFFFFFFF),
    interactiveGhostBg: const Color(0xFFFFFFFF),
    interactiveGhostBgHover: const Color(0xFFF3F4F6),
  );
}
