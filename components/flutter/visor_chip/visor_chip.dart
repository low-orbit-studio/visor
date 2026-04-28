import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// Visual style variant of the chip.
///
/// - [suggestion] — Pill-shaped chip for suggestion/tag/filter patterns.
///   Unselected state shows a rounded rectangle with a subtle border;
///   selected state collapses to a full pill with a filled primary background.
/// - [filter] — Rectangular chip with consistent border and background
///   treatment across states. Background fill changes on selection; border
///   color remains constant. Suited for filter rows and category pickers.
enum VisorChipVariant { suggestion, filter }

/// Size presets that control padding and text style.
///
/// - [sm] — Compact chip for dense layouts (e.g. search autocomplete rows).
/// - [md] — Default chip size for most use-cases.
enum VisorChipSize { sm, md }

/// A selectable chip primitive with selected/unselected states and size
/// variants.
///
/// Maps to React `ToggleGroup` in the web registry. Use [VisorChipVariant] to
/// choose the visual treatment:
///
/// - `suggestion` — pill shape; primary fill when selected (replaces
///   `SuggestionChip` in Veronica).
/// - `filter` — rectangular with token border; background fill when selected
///   (replaces `StyleChip` in Veronica).
///
/// ```dart
/// VisorChip(
///   label: 'Modern',
///   isSelected: true,
///   onPressed: () => setState(() => _selected = !_selected),
///   variant: VisorChipVariant.suggestion,
///   size: VisorChipSize.md,
/// )
/// ```
class VisorChip extends StatelessWidget {
  const VisorChip({
    super.key,
    required this.label,
    required this.onPressed,
    this.isSelected = false,
    this.variant = VisorChipVariant.suggestion,
    this.size = VisorChipSize.md,
    this.semanticLabel,
  });

  /// Text label rendered inside the chip.
  final String label;

  /// Called when the chip is tapped. Pass `null` to disable interaction.
  final VoidCallback? onPressed;

  /// Whether the chip is in the selected state. Defaults to `false`.
  final bool isSelected;

  /// Visual style variant. Defaults to [VisorChipVariant.suggestion].
  final VisorChipVariant variant;

  /// Size preset controlling padding and typography. Defaults to
  /// [VisorChipSize.md].
  final VisorChipSize size;

  /// Overrides the accessibility label announced by screen readers. When
  /// `null` the [label] text is used instead.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;
    final opacity = context.visorOpacity;
    final strokeWidths = context.visorStrokeWidths;
    final motion = context.visorMotion;

    final palette = _palette(colors, opacity, variant, isSelected);
    final padding = _padding(size, spacing);
    final textStyle = _textStyle(size, textStyles, palette.foreground);
    final borderRadius = _borderRadius(variant, size, radius, isSelected);

    // Wrap in a 48dp minimum-height box so the chip always meets Material 3's
    // touch-target floor (R7) even when the visual chip is compact.
    // The SizedBox constrains width to intrinsic so the chip still hugs its
    // label horizontally.
    return Semantics(
      button: true,
      selected: isSelected,
      enabled: onPressed != null,
      label: semanticLabel ?? label,
      child: SizedBox(
        height: 48,
        child: Center(
          widthFactor: 1.0,
          child: GestureDetector(
            onTap: onPressed,
            child: AnimatedContainer(
              duration: motion.durationFast,
              curve: motion.easing,
              padding: padding,
              decoration: BoxDecoration(
                color: palette.background,
                border: Border.all(
                  color: palette.borderColor,
                  width: strokeWidths.thin,
                ),
                borderRadius: borderRadius,
              ),
              // ExcludeSemantics prevents the Text from generating a
              // duplicate label alongside the Semantics.label set above.
              child: ExcludeSemantics(
                child: Text(
                  label,
                  style: textStyle,
                  textHeightBehavior: const TextHeightBehavior(
                    applyHeightToFirstAscent: false,
                    applyHeightToLastDescent: false,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  EdgeInsets _padding(VisorChipSize size, VisorSpacingData spacing) {
    return switch (size) {
      VisorChipSize.sm => EdgeInsets.symmetric(
          horizontal: spacing.sm,
          vertical: spacing.xs,
        ),
      VisorChipSize.md => EdgeInsets.symmetric(
          horizontal: spacing.md,
          vertical: spacing.sm,
        ),
    };
  }

  TextStyle _textStyle(
    VisorChipSize size,
    VisorTextStylesData textStyles,
    Color foreground,
  ) {
    final base = switch (size) {
      VisorChipSize.sm => textStyles.labelSmall,
      VisorChipSize.md => textStyles.labelLarge,
    };
    return base.copyWith(
      color: foreground,
      height: 1,
      leadingDistribution: TextLeadingDistribution.even,
    );
  }

  BorderRadius _borderRadius(
    VisorChipVariant variant,
    VisorChipSize size,
    VisorRadiusData radius,
    bool isSelected,
  ) {
    return switch (variant) {
      VisorChipVariant.suggestion => BorderRadius.circular(
          isSelected ? radius.pill : radius.xl,
        ),
      VisorChipVariant.filter => BorderRadius.circular(
          size == VisorChipSize.sm ? radius.sm : radius.md,
        ),
    };
  }

  _ChipPalette _palette(
    VisorColorsData colors,
    VisorOpacityData opacity,
    VisorChipVariant variant,
    bool isSelected,
  ) {
    return switch (variant) {
      VisorChipVariant.suggestion => isSelected
          ? _ChipPalette(
              background: colors.interactivePrimaryBg,
              foreground: colors.interactivePrimaryText,
              borderColor: Colors.transparent,
            )
          : _ChipPalette(
              background: colors.surfaceCard,
              foreground: colors.textPrimary,
              borderColor: colors.textPrimary
                  .withValues(alpha: opacity.alpha20),
            ),
      VisorChipVariant.filter => isSelected
          ? _ChipPalette(
              background: colors.surfaceSelected,
              foreground: colors.textPrimary,
              borderColor: colors.borderDefault,
            )
          : _ChipPalette(
              background: colors.surfaceCard,
              foreground: colors.textPrimary,
              borderColor: colors.borderDefault,
            ),
    };
  }
}

class _ChipPalette {
  const _ChipPalette({
    required this.background,
    required this.foreground,
    required this.borderColor,
  });

  final Color background;
  final Color foreground;
  final Color borderColor;
}
