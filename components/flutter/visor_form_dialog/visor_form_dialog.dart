import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A dialog frame that constrains and pads an inline form surface.
///
/// Wraps Flutter's [Dialog] with a [ConstrainedBox] capped at [maxWidth] and
/// uniform [EdgeInsets] padding so every form dialog in the app shares the
/// same geometry without hard-coding values at each call site.
///
/// Both [maxWidth] and padding default to Visor spacing tokens — override them
/// only when a specific screen or breakpoint demands a different layout.
///
/// ```dart
/// showDialog(
///   context: context,
///   builder: (_) => VisorFormDialog(
///     child: MyLoginForm(),
///   ),
/// );
/// ```
class VisorFormDialog extends StatelessWidget {
  const VisorFormDialog({
    super.key,
    required this.child,
    this.maxWidth,
    this.padding,
  });

  /// The form (or any widget) to display inside the dialog.
  final Widget child;

  /// Maximum width of the dialog content area.
  ///
  /// Defaults to `480` — roughly the width of the `--spacing-xxxl × 10`
  /// scale that accommodates a two-column form row on most screens.
  /// Override for extra-wide data-entry dialogs.
  final double? maxWidth;

  /// Padding applied inside the dialog surface, surrounding [child].
  ///
  /// Defaults to `EdgeInsets.all(context.visorSpacing.xl)` (24 dp).
  /// Pass an explicit value when the form layout provides its own padding.
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final spacing = context.visorSpacing;

    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth ?? 480),
        child: Padding(
          padding: padding ?? EdgeInsets.all(spacing.xl),
          child: child,
        ),
      ),
    );
  }
}
