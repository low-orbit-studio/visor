import 'package:flutter/material.dart';

import '../extensions/visor_colors.dart';
import '../extensions/visor_motion.dart';
import '../extensions/visor_radius.dart';
import '../extensions/visor_shadows.dart';
import '../extensions/visor_spacing.dart';
import '../extensions/visor_stroke_widths.dart';
import '../extensions/visor_text_styles.dart';

/// Builds a Material 3 [ThemeData] from Visor tokens.
///
/// Pairs CLI-generated token data (color/typography/spacing/etc.) with a
/// complete Material 3 configuration so consumers don't hand-maintain the
/// hundreds of slot configurations that a polished [ThemeData] requires.
///
/// ## Usage
///
/// In your generated `visor_theme.dart`, `VisorColors` is the sealed
/// wrapper that exposes `.light` / `.dark` getters returning
/// [VisorColorsData] instances:
///
/// ```dart
/// sealed class VisorAppTheme {
///   static ThemeData get light => VisorTheme.build(
///         colors: VisorColors.light,
///         brightness: Brightness.light,
///         textStyles: VisorTextStyles.instance,
///         spacing: VisorSpacing.instance,
///         radius: VisorRadius.instance,
///         shadows: VisorShadows.instance,
///         motion: VisorMotion.instance,
///       );
///   static ThemeData get dark => VisorTheme.build(
///         colors: VisorColors.dark,
///         brightness: Brightness.dark,
///         // ...same token instances
///       );
/// }
/// ```
sealed class VisorTheme {
  /// Assemble a Material 3 [ThemeData] from Visor tokens.
  ///
  /// Only [colors] and [brightness] are required. Any omitted token
  /// category falls back to a built-in default so early adopters can
  /// use the builder before emitting every category.
  static ThemeData build({
    required VisorColorsData colors,
    required Brightness brightness,
    VisorMotionData? motion,
    VisorRadiusData? radius,
    VisorShadowsData? shadows,
    VisorSpacingData? spacing,
    VisorStrokeWidthsData? strokeWidths,
    VisorTextStylesData? textStyles,
    String? fontFamily,
    String? fontFamilyPackage,
  }) {
    final resolvedMotion = motion ?? _defaultMotion;
    final resolvedRadius = radius ?? _defaultRadius;
    final resolvedShadows = shadows ?? _defaultShadows;
    final resolvedSpacing = spacing ?? _defaultSpacing;
    final resolvedStrokeWidths = strokeWidths ?? _defaultStrokeWidths;
    final resolvedTextStyles = textStyles ?? VisorTextStylesData.defaults;

    final colorScheme = _colorSchemeFrom(colors, brightness);

    // Apply font family + base text colors to the TextTheme up front so
    // every per-slot TextStyle reused below (AppBar, Dialog, ListTile, etc.)
    // inherits them via textTheme.xxx!.copyWith(...).
    final baseTextTheme = resolvedTextStyles.toTextTheme().apply(
          bodyColor: colors.textPrimary,
          displayColor: colors.textPrimary,
          fontFamily: fontFamily,
          fontFamilyFallback: fontFamilyPackage == null
              ? null
              : <String>[fontFamily ?? ''],
        );

    // Derived spacing-driven edge insets.
    final buttonPadding = EdgeInsets.symmetric(
      horizontal: resolvedSpacing.lg,
      vertical: resolvedSpacing.md,
    );
    final chipPadding = EdgeInsets.symmetric(
      horizontal: resolvedSpacing.md,
      vertical: resolvedSpacing.sm,
    );
    final iconButtonPadding = EdgeInsets.all(resolvedSpacing.sm);

    // Derived radius-driven shapes.
    final buttonShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.sm),
    );
    final cardShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.md),
    );
    final inputBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.md),
      borderSide: BorderSide.none,
    );
    final inputFocusedBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.md),
      borderSide: BorderSide(color: colors.borderFocus),
    );
    final inputErrorBorder = OutlineInputBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.md),
      borderSide: BorderSide(color: colors.borderError),
    );
    final dialogShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.lg),
    );
    final bottomSheetShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.only(
        topLeft: Radius.circular(resolvedRadius.xl),
        topRight: Radius.circular(resolvedRadius.xl),
      ),
    );
    final pillShape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(resolvedRadius.pill),
    );

    // Opacity variants of the primary bg — indicators, overlays, tracks.
    // `.withValues` is acceptable here: this is ThemeData construction,
    // not widget-build hot path.
    final primary20 = colors.interactivePrimaryBg.withValues(alpha: 0.2);
    final primary50 = colors.interactivePrimaryBg.withValues(alpha: 0.5);

    // Splash/highlight feedback — surface-on-surface, brightness-agnostic.
    final splashColor = colors.textPrimary.withValues(alpha: 0.1);
    final highlightColor = colors.textPrimary.withValues(alpha: 0.05);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      textTheme: baseTextTheme,
      scaffoldBackgroundColor: colors.surfacePage,
      canvasColor: colors.surfacePage,
      dividerColor: colors.borderMuted,
      fontFamily: fontFamily,
      fontFamilyFallback: fontFamilyPackage == null
          ? null
          : <String>[fontFamily ?? ''],
      splashColor: splashColor,
      highlightColor: highlightColor,

      appBarTheme: AppBarTheme(
        backgroundColor: colors.surfacePage,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        titleTextStyle: baseTextTheme.titleLarge?.copyWith(
          color: colors.textPrimary,
        ),
      ),

      cardTheme: CardThemeData(
        color: colors.surfaceCard,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: cardShape,
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colors.interactivePrimaryBg,
          foregroundColor: colors.interactivePrimaryText,
          elevation: 0,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: baseTextTheme.labelMedium,
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: colors.interactivePrimaryBg,
          foregroundColor: colors.interactivePrimaryText,
          padding: buttonPadding,
          shape: buttonShape,
          textStyle: baseTextTheme.labelMedium,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colors.textPrimary,
          padding: buttonPadding,
          shape: buttonShape,
          side: BorderSide(color: colors.borderDefault),
          textStyle: baseTextTheme.labelMedium,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: colors.interactivePrimaryBg,
          padding: buttonPadding,
          shape: pillShape,
          textStyle: baseTextTheme.labelMedium,
        ),
      ),
      iconButtonTheme: IconButtonThemeData(
        style: IconButton.styleFrom(
          foregroundColor: colors.textPrimary,
          padding: iconButtonPadding,
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: colors.surfaceInteractiveDefault,
        contentPadding: buttonPadding,
        hintStyle: baseTextTheme.bodyLarge?.copyWith(color: colors.textTertiary),
        labelStyle: baseTextTheme.bodyLarge?.copyWith(color: colors.textTertiary),
        floatingLabelStyle:
            baseTextTheme.bodySmall?.copyWith(color: colors.textTertiary),
        border: inputBorder,
        enabledBorder: inputBorder,
        focusedBorder: inputFocusedBorder,
        errorBorder: inputErrorBorder,
        focusedErrorBorder: inputErrorBorder,
        errorStyle: baseTextTheme.bodySmall?.copyWith(color: colors.textError),
      ),

      chipTheme: ChipThemeData(
        backgroundColor: colors.surfaceCard,
        selectedColor: primary20,
        labelStyle: baseTextTheme.labelSmall,
        padding: chipPadding,
        shape: pillShape,
        side: BorderSide(color: colors.borderDefault),
      ),

      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: colors.surfaceCard,
        modalBackgroundColor: colors.surfaceCard,
        shape: bottomSheetShape,
        showDragHandle: true,
        dragHandleColor: colors.borderDefault,
      ),

      dialogTheme: DialogThemeData(
        backgroundColor: colors.surfaceCard,
        shape: dialogShape,
        titleTextStyle: baseTextTheme.headlineSmall?.copyWith(
          color: colors.textPrimary,
        ),
        contentTextStyle: baseTextTheme.bodyMedium?.copyWith(
          color: colors.textPrimary,
        ),
      ),

      snackBarTheme: SnackBarThemeData(
        backgroundColor: colors.interactivePrimaryBg,
        contentTextStyle: baseTextTheme.bodyMedium?.copyWith(
          color: colors.interactivePrimaryText,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(resolvedRadius.md),
        ),
        behavior: SnackBarBehavior.floating,
      ),

      dividerTheme: DividerThemeData(
        color: colors.borderMuted,
        thickness: 1,
        space: 1,
      ),

      listTileTheme: ListTileThemeData(
        contentPadding: buttonPadding,
        titleTextStyle: baseTextTheme.titleMedium?.copyWith(
          color: colors.textPrimary,
        ),
        subtitleTextStyle: baseTextTheme.bodySmall?.copyWith(
          color: colors.textTertiary,
        ),
        iconColor: colors.textPrimary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(resolvedRadius.md),
        ),
      ),

      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: colors.surfacePage,
        indicatorColor: primary20,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return baseTextTheme.labelSmall?.copyWith(
              color: colors.interactivePrimaryBg,
            );
          }
          return baseTextTheme.labelSmall?.copyWith(
            color: colors.textTertiary,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return IconThemeData(color: colors.interactivePrimaryBg);
          }
          return IconThemeData(color: colors.textTertiary);
        }),
      ),

      tabBarTheme: TabBarThemeData(
        labelColor: colors.interactivePrimaryBg,
        unselectedLabelColor: colors.textTertiary,
        labelStyle: baseTextTheme.labelMedium,
        unselectedLabelStyle: baseTextTheme.labelMedium,
        indicatorColor: colors.interactivePrimaryBg,
        indicatorSize: TabBarIndicatorSize.label,
        dividerColor: Colors.transparent,
      ),

      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: colors.interactivePrimaryBg,
        linearTrackColor: colors.surfaceInteractiveDefault,
        circularTrackColor: colors.surfaceInteractiveDefault,
      ),

      sliderTheme: SliderThemeData(
        activeTrackColor: colors.interactivePrimaryBg,
        inactiveTrackColor: colors.surfaceInteractiveDefault,
        thumbColor: colors.interactivePrimaryBg,
        overlayColor: primary20,
        trackHeight: resolvedSpacing.xs,
      ),

      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? colors.interactivePrimaryBg
              : colors.textTertiary;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? primary50
              : colors.surfaceInteractiveDefault;
        }),
        trackOutlineColor: WidgetStateProperty.all(Colors.transparent),
      ),

      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? colors.interactivePrimaryBg
              : Colors.transparent;
        }),
        checkColor: WidgetStateProperty.all(colors.interactivePrimaryText),
        side: BorderSide(color: colors.borderDefault, width: 2),
        shape: buttonShape,
      ),

      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          return states.contains(WidgetState.selected)
              ? colors.interactivePrimaryBg
              : colors.textTertiary;
        }),
      ),

      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: colors.interactivePrimaryBg,
        foregroundColor: colors.interactivePrimaryText,
        elevation: 4,
        shape: dialogShape,
      ),

      tooltipTheme: TooltipThemeData(
        decoration: BoxDecoration(
          color: colors.surfaceMuted,
          borderRadius: BorderRadius.circular(resolvedRadius.md),
        ),
        textStyle: baseTextTheme.bodySmall?.copyWith(color: colors.textPrimary),
      ),

      iconTheme: IconThemeData(color: colors.textPrimary, size: 24),
      primaryIconTheme: IconThemeData(color: colors.textPrimary, size: 24),

      extensions: <ThemeExtension<dynamic>>[
        colors,
        resolvedMotion,
        resolvedRadius,
        resolvedShadows,
        resolvedSpacing,
        resolvedStrokeWidths,
        resolvedTextStyles,
      ],
    );
  }

  /// Map a [VisorColorsData] instance into a Material 3 [ColorScheme].
  ///
  /// Callers rarely need this directly — [build] does it internally — but
  /// it's exposed for consumers who want to customize [ThemeData] beyond
  /// what [build] provides.
  static ColorScheme colorSchemeFrom(
    VisorColorsData colors,
    Brightness brightness,
  ) {
    return _colorSchemeFrom(colors, brightness);
  }
}

ColorScheme _colorSchemeFrom(VisorColorsData c, Brightness brightness) {
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
    // Shadows / scrims — hardcoded system defaults; not tokenized yet.
    shadow: const Color(0xFF000000),
    scrim: const Color(0x99000000),
  );
}

const VisorMotionData _defaultMotion = VisorMotionData(
  durationFast: Duration(milliseconds: 100),
  durationNormal: Duration(milliseconds: 200),
  durationSlow: Duration(milliseconds: 400),
  easing: Curves.easeInOut,
);

const VisorRadiusData _defaultRadius = VisorRadiusData(
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 9999,
);

const VisorShadowsData _defaultShadows = VisorShadowsData(
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

const VisorSpacingData _defaultSpacing = VisorSpacingData(
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
);

const VisorStrokeWidthsData _defaultStrokeWidths = VisorStrokeWidthsData(
  thin: 1,
  regular: 1.5,
  medium: 2,
  thick: 2.5,
);
