import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// The button's visual role.
///
/// - [primary] — solid filled button (Material `FilledButton`).
/// - [secondary] — tonal filled button (Material `FilledButton.tonal`).
/// - [ghost] — text-only button (Material `TextButton`).
/// - [destructive] — solid filled button in the error palette.
enum VisorButtonStyle { primary, secondary, ghost, destructive }

/// Size presets map to padding + label text style.
enum VisorButtonSize { sm, md, lg }

/// Hug wraps the label; full expands to the parent's cross-axis width.
enum VisorButtonWidth { hug, full }

/// Visor's primary interactive button.
///
/// Wraps Material 3's button types with Visor's semantic color tokens and
/// spacing scale. All styling reads from `Theme.of(context)` via the
/// `visor_core` BuildContext extensions — no hard-coded colors, radii, or
/// typography.
///
/// ```dart
/// VisorButton(
///   label: 'Save',
///   onPressed: _save,
///   style: VisorButtonStyle.primary,
///   size: VisorButtonSize.md,
///   width: VisorButtonWidth.full,
/// )
/// ```
class VisorButton extends StatelessWidget {
  const VisorButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.style = VisorButtonStyle.primary,
    this.size = VisorButtonSize.md,
    this.width = VisorButtonWidth.hug,
    this.leadingIcon,
    this.trailingIcon,
    this.isLoading = false,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onPressed;
  final VisorButtonStyle style;
  final VisorButtonSize size;
  final VisorButtonWidth width;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final bool isLoading;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final opacity = context.visorOpacity;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final strokeWidths = context.visorStrokeWidths;

    final palette = _palette(colors, opacity, style);
    final padding = _padding(size, spacing);
    final labelStyle = _labelStyle(size, textStyles, palette.foreground);

    final effectiveOnPressed = isLoading ? null : onPressed;
    final child = _buildChild(
      labelStyle,
      palette.foreground,
      strokeWidths.medium,
    );

    final button = _buildButton(
      style: style,
      palette: palette,
      padding: padding,
      onPressed: effectiveOnPressed,
      child: child,
    );

    final sized = width == VisorButtonWidth.full
        ? SizedBox(width: double.infinity, child: button)
        : button;

    return Semantics(
      button: true,
      label: semanticLabel ?? label,
      enabled: effectiveOnPressed != null,
      child: sized,
    );
  }

  Widget _buildChild(
    TextStyle labelStyle,
    Color foreground,
    double loadingStrokeWidth,
  ) {
    if (isLoading) {
      return SizedBox(
        width: 16,
        height: 16,
        child: CircularProgressIndicator(
          strokeWidth: loadingStrokeWidth,
          valueColor: AlwaysStoppedAnimation<Color>(foreground),
        ),
      );
    }
    final text = Text(label, style: labelStyle);
    if (leadingIcon == null && trailingIcon == null) return text;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leadingIcon != null) ...[
          IconTheme.merge(
            data: IconThemeData(color: foreground, size: 18),
            child: leadingIcon!,
          ),
          const SizedBox(width: 8),
        ],
        text,
        if (trailingIcon != null) ...[
          const SizedBox(width: 8),
          IconTheme.merge(
            data: IconThemeData(color: foreground, size: 18),
            child: trailingIcon!,
          ),
        ],
      ],
    );
  }

  Widget _buildButton({
    required VisorButtonStyle style,
    required _ButtonPalette palette,
    required EdgeInsets padding,
    required VoidCallback? onPressed,
    required Widget child,
  }) {
    final shared = ButtonStyle(
      padding: WidgetStatePropertyAll(padding),
      backgroundColor: WidgetStatePropertyAll(palette.background),
      foregroundColor: WidgetStatePropertyAll(palette.foreground),
      overlayColor: WidgetStatePropertyAll(palette.overlay),
    );
    switch (style) {
      case VisorButtonStyle.primary:
      case VisorButtonStyle.destructive:
        return FilledButton(
          onPressed: onPressed,
          style: shared,
          child: child,
        );
      case VisorButtonStyle.secondary:
        return FilledButton.tonal(
          onPressed: onPressed,
          style: shared,
          child: child,
        );
      case VisorButtonStyle.ghost:
        return TextButton(
          onPressed: onPressed,
          style: shared.copyWith(
            backgroundColor: const WidgetStatePropertyAll(Colors.transparent),
          ),
          child: child,
        );
    }
  }

  EdgeInsets _padding(VisorButtonSize size, VisorSpacingData spacing) {
    switch (size) {
      case VisorButtonSize.sm:
        return EdgeInsets.symmetric(
          horizontal: spacing.md,
          vertical: spacing.xs,
        );
      case VisorButtonSize.md:
        return EdgeInsets.symmetric(
          horizontal: spacing.lg,
          vertical: spacing.sm,
        );
      case VisorButtonSize.lg:
        return EdgeInsets.symmetric(
          horizontal: spacing.xl,
          vertical: spacing.md,
        );
    }
  }

  TextStyle _labelStyle(
    VisorButtonSize size,
    VisorTextStylesData textStyles,
    Color foreground,
  ) {
    final base = switch (size) {
      VisorButtonSize.sm => textStyles.labelSmall,
      VisorButtonSize.md => textStyles.labelMedium,
      VisorButtonSize.lg => textStyles.labelLarge,
    };
    return base.copyWith(color: foreground);
  }

  _ButtonPalette _palette(
    VisorColorsData colors,
    VisorOpacityData opacity,
    VisorButtonStyle style,
  ) {
    switch (style) {
      case VisorButtonStyle.primary:
        return _ButtonPalette(
          background: colors.interactivePrimaryBg,
          foreground: colors.interactivePrimaryText,
          overlay: colors.interactivePrimaryBgHover
              .withValues(alpha: opacity.alpha12),
        );
      case VisorButtonStyle.secondary:
        return _ButtonPalette(
          background: colors.interactiveSecondaryBg,
          foreground: colors.interactiveSecondaryText,
          overlay: colors.interactiveSecondaryBgHover
              .withValues(alpha: opacity.alpha12),
        );
      case VisorButtonStyle.ghost:
        return _ButtonPalette(
          background: Colors.transparent,
          foreground: colors.interactivePrimaryBg,
          overlay: colors.interactivePrimaryBg.withValues(alpha: opacity.alpha10),
        );
      case VisorButtonStyle.destructive:
        return _ButtonPalette(
          background: colors.interactiveDestructiveBg,
          foreground: colors.interactiveDestructiveText,
          overlay: colors.interactiveDestructiveBgHover
              .withValues(alpha: opacity.alpha12),
        );
    }
  }
}

class _ButtonPalette {
  const _ButtonPalette({
    required this.background,
    required this.foreground,
    required this.overlay,
  });
  final Color background;
  final Color foreground;
  final Color overlay;
}
