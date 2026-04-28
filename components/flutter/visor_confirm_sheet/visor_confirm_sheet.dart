import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:visor_core/visor_core.dart';

/// The visual variant of a [VisorConfirmSheet].
///
/// - [standard] — default styling; used for non-destructive confirmations.
/// - [destructive] — error-toned styling; used for irreversible or dangerous
///   actions (e.g. delete, remove, revoke).
enum VisorConfirmSheetVariant { standard, destructive }

/// An adaptive confirmation surface that renders as a **bottom sheet** on
/// compact viewports (width < 600 dp) and as a centred **dialog** on wider
/// viewports.
///
/// Combines patterns from ENTR's `ConfirmActionSheet` + `AdaptiveModalForm`
/// and Veronica's `VeronicaAlertDialog` into a single, token-driven widget.
///
/// ## Usage
///
/// Prefer the static [show] helper — it handles the adaptive presentation
/// automatically:
///
/// ```dart
/// // Standard confirmation
/// VisorConfirmSheet.show(
///   context: context,
///   title: 'Archive project',
///   message: 'This project will be archived and hidden from your dashboard.',
///   confirmLabel: 'Archive',
///   onConfirm: () => archiveProject(),
/// );
///
/// // Destructive confirmation (red tones)
/// VisorConfirmSheet.show(
///   context: context,
///   title: 'Delete account',
///   message: 'This action cannot be undone.',
///   confirmLabel: 'Delete account',
///   variant: VisorConfirmSheetVariant.destructive,
///   onConfirm: () => deleteAccount(),
/// );
/// ```
///
/// All colours, spacing, typography, radius, and motion tokens come from
/// `context.visor*` extensions — no hard-coded values, fully theme-agnostic.
///
/// Screen readers announce the dialog title via a `Semantics` container.
class VisorConfirmSheet extends StatelessWidget {
  const VisorConfirmSheet({
    super.key,
    required this.title,
    required this.message,
    required this.confirmLabel,
    required this.onConfirm,
    this.cancelLabel = 'Cancel',
    this.variant = VisorConfirmSheetVariant.standard,
    this.icon,
    this.onCancel,
  });

  /// The heading shown at the top of the sheet / dialog.
  final String title;

  /// Explanatory body text below the heading.
  final String message;

  /// Label for the primary confirm button.
  final String confirmLabel;

  /// Label for the secondary cancel button. Defaults to `'Cancel'`.
  final String cancelLabel;

  /// Visual variant — standard (default) or destructive (red tones).
  final VisorConfirmSheetVariant variant;

  /// Optional leading icon on the confirm button. Defaults to a trash icon
  /// when [variant] is [VisorConfirmSheetVariant.destructive], and a
  /// check-circle when [variant] is [VisorConfirmSheetVariant.standard].
  final IconData? icon;

  /// Fired when the user taps the confirm button. The sheet/dialog is
  /// dismissed automatically before this callback is invoked.
  final VoidCallback onConfirm;

  /// Fired when the user taps the cancel button. Optional — the sheet/dialog
  /// is dismissed automatically; this allows callers to react to cancellation.
  final VoidCallback? onCancel;

  // ---------------------------------------------------------------------------
  // Adaptive presenter
  // ---------------------------------------------------------------------------

  /// The viewport-width breakpoint (dp) below which the widget is shown as a
  /// bottom sheet; at or above this width a dialog is shown.
  static const double _compactBreakpoint = 600.0;

  /// Shows the confirmation surface adaptively.
  ///
  /// On compact viewports (width < 600 dp) a modal bottom sheet is shown.
  /// On wider viewports a centered [Dialog] is shown.
  ///
  /// Returns a [Future] that resolves when the surface is dismissed. The
  /// future value is `true` when the user confirmed, `false` when cancelled
  /// or dismissed.
  static Future<bool?> show({
    required BuildContext context,
    required String title,
    required String message,
    required String confirmLabel,
    required VoidCallback onConfirm,
    String cancelLabel = 'Cancel',
    VisorConfirmSheetVariant variant = VisorConfirmSheetVariant.standard,
    IconData? icon,
    VoidCallback? onCancel,
  }) {
    final sheet = VisorConfirmSheet(
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      variant: variant,
      icon: icon,
      onConfirm: onConfirm,
      onCancel: onCancel,
    );

    final width = MediaQuery.sizeOf(context).width;

    if (width < _compactBreakpoint) {
      return showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        useRootNavigator: true,
        builder: (_) => sheet,
      );
    }

    return showDialog<bool>(
      context: context,
      useRootNavigator: true,
      builder: (_) => Dialog(child: sheet),
    );
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;
    final opacity = context.visorOpacity;

    final isDestructive = variant == VisorConfirmSheetVariant.destructive;

    final titleColor =
        isDestructive ? colors.textError : colors.textPrimary;
    final confirmBg = isDestructive
        ? colors.surfaceErrorSubtle
        : colors.surfaceAccentSubtle;
    final confirmBgOpacity = isDestructive ? opacity.alpha20 : opacity.alpha20;
    final confirmTextColor =
        isDestructive ? colors.interactiveDestructiveBg : colors.interactivePrimaryBg;
    final confirmIconData = icon ??
        (isDestructive
            ? PhosphorIconsBold.trashSimple
            : PhosphorIconsBold.checkCircle);

    return SafeArea(
      top: false,
      child: Semantics(
        container: true,
        label: title,
        child: Padding(
          padding: EdgeInsets.all(spacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Title
              Text(
                title,
                style: textStyles.headlineSmall.copyWith(color: titleColor),
              ),
              SizedBox(height: spacing.sm),
              // Message
              Text(
                message,
                style:
                    textStyles.bodyMedium.copyWith(color: colors.textSecondary),
              ),
              SizedBox(height: spacing.xxl),
              // Cancel button
              _CancelButton(
                label: cancelLabel,
                spacing: spacing,
                textStyles: textStyles,
                colors: colors,
                radius: radius,
                onTap: () {
                  Navigator.of(context).pop(false);
                  onCancel?.call();
                },
              ),
              SizedBox(height: spacing.sm),
              // Confirm button
              _ConfirmButton(
                label: confirmLabel,
                iconData: confirmIconData,
                bg: confirmBg,
                bgOpacity: confirmBgOpacity,
                textColor: confirmTextColor,
                spacing: spacing,
                textStyles: textStyles,
                radius: radius,
                onTap: () {
                  Navigator.of(context).pop(true);
                  onConfirm();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Private sub-widgets
// ---------------------------------------------------------------------------

class _CancelButton extends StatelessWidget {
  const _CancelButton({
    required this.label,
    required this.spacing,
    required this.textStyles,
    required this.colors,
    required this.radius,
    required this.onTap,
  });

  final String label;
  final VisorSpacingData spacing;
  final VisorTextStylesData textStyles;
  final VisorColorsData colors;
  final VisorRadiusData radius;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(radius.md),
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: spacing.lg,
          horizontal: spacing.xl,
        ),
        decoration: BoxDecoration(
          color: colors.surfaceInteractiveDefault,
          borderRadius: BorderRadius.circular(radius.md),
          border: Border.all(
            color: colors.borderDefault,
            width: context.visorStrokeWidths.thin,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              PhosphorIconsBold.x,
              size: 18,
              color: colors.textSecondary,
            ),
            SizedBox(width: spacing.sm),
            Text(
              label,
              style: textStyles.bodyLarge.copyWith(color: colors.textPrimary),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConfirmButton extends StatelessWidget {
  const _ConfirmButton({
    required this.label,
    required this.iconData,
    required this.bg,
    required this.bgOpacity,
    required this.textColor,
    required this.spacing,
    required this.textStyles,
    required this.radius,
    required this.onTap,
  });

  final String label;
  final IconData iconData;
  final Color bg;
  final double bgOpacity;
  final Color textColor;
  final VisorSpacingData spacing;
  final VisorTextStylesData textStyles;
  final VisorRadiusData radius;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(radius.md),
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: spacing.lg,
          horizontal: spacing.xl,
        ),
        decoration: BoxDecoration(
          color: bg.withValues(alpha: bgOpacity),
          borderRadius: BorderRadius.circular(radius.md),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(iconData, size: 18, color: textColor),
            SizedBox(width: spacing.sm),
            Text(
              label,
              style: textStyles.bodyLarge.copyWith(color: textColor),
            ),
          ],
        ),
      ),
    );
  }
}
