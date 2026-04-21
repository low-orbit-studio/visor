import 'package:flutter/material.dart';

import '../extensions/visor_colors.dart';
import '../extensions/visor_motion.dart';
import '../extensions/visor_radius.dart';
import '../extensions/visor_shadows.dart';
import '../extensions/visor_spacing.dart';

/// Builds a Material 3 [ThemeData] from Visor tokens.
///
/// Pairs CLI-generated token data (color/typography/spacing/etc.) with a
/// complete Material 3 configuration so consumers don't hand-maintain the
/// hundreds of slot configurations that a polished [ThemeData] requires.
///
/// ## Usage
///
/// In your generated `ui_theme.dart`:
///
/// ```dart
/// sealed class VisorAppTheme {
///   static ThemeData get light => VisorTheme.build(
///         colors: VisorColors.light,
///         brightness: Brightness.light,
///         fontFamily: 'Inter',
///       );
///   static ThemeData get dark => VisorTheme.build(
///         colors: VisorColors.dark,
///         brightness: Brightness.dark,
///         fontFamily: 'Inter',
///       );
/// }
/// ```
sealed class VisorTheme {
  /// Assemble a Material 3 [ThemeData] from Visor tokens.
  ///
  /// Only [colors] and [brightness] are required. Token categories not yet
  /// emitted by your generator fall back to sensible defaults, so you can
  /// adopt Visor incrementally.
  static ThemeData build({
    required VisorColors colors,
    required Brightness brightness,
    VisorMotion? motion,
    VisorRadius? radius,
    VisorShadows? shadows,
    VisorSpacing? spacing,
    String? fontFamily,
    String? fontFamilyPackage,
  }) {
    final resolvedMotion = motion ?? _defaultMotion;
    final resolvedRadius = radius ?? _defaultRadius;
    final resolvedShadows = shadows ?? _defaultShadows;
    final resolvedSpacing = spacing ?? _defaultSpacing;

    final colorScheme = _colorSchemeFrom(colors, brightness);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colors.surfacePage,
      canvasColor: colors.surfacePage,
      dividerColor: colors.borderMuted,
      fontFamily: fontFamily,
      fontFamilyFallback: fontFamilyPackage == null
          ? null
          : <String>[fontFamily ?? ''],
      extensions: <ThemeExtension<dynamic>>[
        colors,
        resolvedMotion,
        resolvedRadius,
        resolvedShadows,
        resolvedSpacing,
      ],
    );
  }

  /// Map a [VisorColors] instance into a Material 3 [ColorScheme].
  ///
  /// Callers rarely need this directly — [build] does it internally — but
  /// it's exposed for consumers who want to customize [ThemeData] beyond
  /// what [build] provides.
  static ColorScheme colorSchemeFrom(
    VisorColors colors,
    Brightness brightness,
  ) {
    return _colorSchemeFrom(colors, brightness);
  }
}

ColorScheme _colorSchemeFrom(VisorColors c, Brightness brightness) {
  return ColorScheme(
    brightness: brightness,
    // Primary
    primary: c.interactivePrimaryBg,
    onPrimary: c.interactivePrimaryText,
    primaryContainer: c.surfaceAccentSubtle,
    onPrimaryContainer: c.textPrimary,
    // Secondary (Visor's "secondary" semantic maps to interactive.secondary)
    secondary: c.interactiveSecondaryBg,
    onSecondary: c.interactiveSecondaryText,
    secondaryContainer: c.surfaceSubtle,
    onSecondaryContainer: c.textPrimary,
    // Tertiary (Visor has no distinct tertiary — reuse accent)
    tertiary: c.surfaceAccentDefault,
    onTertiary: c.interactivePrimaryText,
    tertiaryContainer: c.surfaceAccentSubtle,
    onTertiaryContainer: c.textPrimary,
    // Error / destructive
    error: c.interactiveDestructiveBg,
    onError: c.interactiveDestructiveText,
    errorContainer: c.surfaceErrorSubtle,
    onErrorContainer: c.textError,
    // Surfaces
    surface: c.surfacePage,
    onSurface: c.textPrimary,
    surfaceContainerLowest: c.surfacePage,
    surfaceContainerLow: c.surfaceSubtle,
    surfaceContainer: c.surfaceCard,
    surfaceContainerHigh: c.surfaceMuted,
    surfaceContainerHighest: c.surfaceMuted,
    onSurfaceVariant: c.textSecondary,
    // Outlines
    outline: c.borderDefault,
    outlineVariant: c.borderMuted,
    // Inverse (used for snackbars, tooltips)
    inverseSurface: c.surfaceOverlay,
    onInverseSurface: c.textInverse,
    inversePrimary: c.interactivePrimaryBgHover,
    // Shadows / scrims
    shadow: const Color(0xFF000000),
    scrim: const Color(0x99000000),
  );
}

const VisorMotion _defaultMotion = VisorMotion(
  durationFast: Duration(milliseconds: 100),
  durationNormal: Duration(milliseconds: 200),
  durationSlow: Duration(milliseconds: 400),
  easing: Curves.easeInOut,
);

const VisorRadius _defaultRadius = VisorRadius(
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
);

const VisorShadows _defaultShadows = VisorShadows(
  xs: <BoxShadow>[
    BoxShadow(color: Color(0x0A000000), blurRadius: 1, offset: Offset(0, 1)),
  ],
  sm: <BoxShadow>[
    BoxShadow(color: Color(0x0D000000), blurRadius: 2, offset: Offset(0, 1)),
  ],
  md: <BoxShadow>[
    BoxShadow(color: Color(0x1A000000), blurRadius: 6, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x0D000000), blurRadius: 4, offset: Offset(0, 2)),
  ],
  lg: <BoxShadow>[
    BoxShadow(color: Color(0x1A000000), blurRadius: 15, offset: Offset(0, 10)),
    BoxShadow(color: Color(0x0D000000), blurRadius: 6, offset: Offset(0, 4)),
  ],
  xl: <BoxShadow>[
    BoxShadow(color: Color(0x26000000), blurRadius: 25, offset: Offset(0, 20)),
    BoxShadow(color: Color(0x14000000), blurRadius: 10, offset: Offset(0, 8)),
  ],
);

const VisorSpacing _defaultSpacing = VisorSpacing(
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
);
