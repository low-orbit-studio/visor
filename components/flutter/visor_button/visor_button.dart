import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// Which brand palette the button draws from.
///
/// Most apps use a single brand — leave this at [primary]. Apps that ship
/// with dual brands (e.g. user-facing vs. operator-facing personas) can set
/// [secondary] to route through the `surfaceAccent*` token slots.
enum VisorButtonBrand { primary, secondary }

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
    this.brand = VisorButtonBrand.primary,
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
  final VisorButtonBrand brand;
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
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    final palette = _palette(colors, style, brand);
    final padding = _padding(size, spacing);
    final labelStyle = _labelStyle(size, textStyles, palette.foreground);

    final effectiveOnPressed = isLoading ? null : onPressed;
    final child = _buildChild(labelStyle, palette.foreground);

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

  Widget _buildChild(TextStyle labelStyle, Color foreground) {
    if (isLoading) {
      return SizedBox(
        width: 16,
        height: 16,
        child: CircularProgressIndicator(
          strokeWidth: 2,
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
    VisorButtonStyle style,
    VisorButtonBrand brand,
  ) {
    // Pick the brand palette first, then apply the style role on top.
    final bg = brand == VisorButtonBrand.primary
        ? colors.interactivePrimaryBg
        : colors.surfaceAccentStrong;
    final bgHover = brand == VisorButtonBrand.primary
        ? colors.interactivePrimaryBgHover
        : colors.surfaceAccentDefault;
    final onBg = brand == VisorButtonBrand.primary
        ? colors.interactivePrimaryText
        : colors.textInverse;

    switch (style) {
      case VisorButtonStyle.primary:
        return _ButtonPalette(
          background: bg,
          foreground: onBg,
          overlay: bgHover.withValues(alpha: 0.12),
        );
      case VisorButtonStyle.secondary:
        return _ButtonPalette(
          background: brand == VisorButtonBrand.primary
              ? colors.interactiveSecondaryBg
              : colors.surfaceAccentSubtle,
          foreground: brand == VisorButtonBrand.primary
              ? colors.interactiveSecondaryText
              : colors.surfaceAccentStrong,
          overlay: (brand == VisorButtonBrand.primary
                  ? colors.interactiveSecondaryBgHover
                  : colors.surfaceAccentDefault)
              .withValues(alpha: 0.12),
        );
      case VisorButtonStyle.ghost:
        return _ButtonPalette(
          background: Colors.transparent,
          foreground: brand == VisorButtonBrand.primary
              ? colors.interactivePrimaryBg
              : colors.surfaceAccentStrong,
          overlay: bg.withValues(alpha: 0.08),
        );
      case VisorButtonStyle.destructive:
        return _ButtonPalette(
          background: colors.interactiveDestructiveBg,
          foreground: colors.interactiveDestructiveText,
          overlay: colors.interactiveDestructiveBgHover.withValues(alpha: 0.12),
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
