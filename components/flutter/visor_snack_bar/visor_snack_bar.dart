import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// The visual variant of a [VisorSnackBar].
///
/// - [success] — green background, used for confirmations and positive outcomes.
/// - [error] — red background, used for failures and destructive results.
/// - [standard] — neutral surface, used for informational messages.
enum VisorSnackBarVariant { success, error, standard }

/// A themed, token-driven snack bar for Visor applications.
///
/// Exposes three static helper methods for the most common cases — no
/// constructor call required at the call site:
///
/// ```dart
/// // Show a success toast
/// VisorSnackBar.success(context, 'Profile saved');
///
/// // Show an error toast with a retry action
/// VisorSnackBar.error(
///   context,
///   'Upload failed',
///   actionLabel: 'Retry',
///   onAction: () => retryUpload(),
/// );
///
/// // Show a neutral informational message
/// VisorSnackBar.standard(context, 'Syncing…');
/// ```
///
/// All colours, spacing, and typography come from `context.visor*` token
/// extensions — no hard-coded values, fully theme-agnostic.
///
/// Screen readers are notified via [Semantics.liveRegion] so assistive
/// technology announces the message when it appears (WCAG SC 4.1.3 /
/// ARIA live region equivalent).
class VisorSnackBar extends SnackBar {
  const VisorSnackBar._({
    required super.content,
    super.backgroundColor,
    super.action,
    super.duration,
    super.padding,
    super.behavior,
    super.shape,
  });

  // ---------------------------------------------------------------------------
  // Static helper API
  // ---------------------------------------------------------------------------

  /// Shows a **success** snack bar.
  ///
  /// Uses [VisorColorsData.surfaceSuccessDefault] as the background and
  /// [VisorColorsData.textInverse] as the text colour.
  ///
  /// [actionLabel] and [onAction] are optional; if [actionLabel] is provided
  /// without [onAction] the action button dismisses the bar silently.
  static void success(
    BuildContext context,
    String message, {
    Duration? duration,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    _show(
      context,
      message,
      variant: VisorSnackBarVariant.success,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  /// Shows an **error** snack bar.
  ///
  /// Uses [VisorColorsData.surfaceErrorDefault] as the background and
  /// [VisorColorsData.textInverse] as the text colour.
  ///
  /// [actionLabel] and [onAction] are optional; if [actionLabel] is provided
  /// without [onAction] the action button dismisses the bar silently.
  static void error(
    BuildContext context,
    String message, {
    Duration? duration,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    _show(
      context,
      message,
      variant: VisorSnackBarVariant.error,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  /// Shows a **standard** (neutral) snack bar.
  ///
  /// Uses [VisorColorsData.surfaceCard] as the background and
  /// [VisorColorsData.textPrimary] as the text colour.
  ///
  /// [actionLabel] and [onAction] are optional; if [actionLabel] is provided
  /// without [onAction] the action button dismisses the bar silently.
  static void standard(
    BuildContext context,
    String message, {
    Duration? duration,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    _show(
      context,
      message,
      variant: VisorSnackBarVariant.standard,
      duration: duration,
      actionLabel: actionLabel,
      onAction: onAction,
    );
  }

  // ---------------------------------------------------------------------------
  // Internal builder
  // ---------------------------------------------------------------------------

  static void _show(
    BuildContext context,
    String message, {
    required VisorSnackBarVariant variant,
    Duration? duration,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;

    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;

    final bg = _backgroundColor(colors, variant);
    final fg = _foregroundColor(colors, variant);

    // Apply token-driven shape so the floating snack bar matches the radius
    // scale. SnackBar.shape overrides the theme default.
    messenger.showSnackBar(
      VisorSnackBar._(
        backgroundColor: bg,
        padding: EdgeInsets.symmetric(
          horizontal: spacing.lg,
          vertical: spacing.md,
        ),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius.md),
        ),
        duration: duration ?? const Duration(seconds: 4),
        content: Semantics(
          liveRegion: true,
          child: Text(
            message,
            style: textStyles.bodyMedium.copyWith(color: fg),
          ),
        ),
        action: actionLabel != null
            ? SnackBarAction(
                label: actionLabel,
                textColor: fg,
                onPressed: onAction ?? () {},
              )
            : null,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Token helpers
  // ---------------------------------------------------------------------------

  static Color _backgroundColor(
    VisorColorsData colors,
    VisorSnackBarVariant variant,
  ) {
    switch (variant) {
      case VisorSnackBarVariant.success:
        return colors.surfaceSuccessDefault;
      case VisorSnackBarVariant.error:
        return colors.surfaceErrorDefault;
      case VisorSnackBarVariant.standard:
        return colors.surfaceCard;
    }
  }

  static Color _foregroundColor(
    VisorColorsData colors,
    VisorSnackBarVariant variant,
  ) {
    switch (variant) {
      case VisorSnackBarVariant.success:
      case VisorSnackBarVariant.error:
        return colors.textInverse;
      case VisorSnackBarVariant.standard:
        return colors.textPrimary;
    }
  }
}
