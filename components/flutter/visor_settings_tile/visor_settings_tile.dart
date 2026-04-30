import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A list-tile navigation primitive for settings screens and sidebar navigation.
///
/// Provides a leading icon, label, optional subtitle, flexible trailing widget
/// (defaults to a chevron caret), destructive variant, and selected state.
/// All styling reads from `Theme.of(context)` via the `visor_core`
/// BuildContext extensions — no hard-coded colors or spacing.
///
/// ```dart
/// VisorSettingsTile(
///   icon: Icons.person_outline,
///   label: 'Account',
///   subtitle: 'Manage your profile',
///   onTap: _openAccount,
/// )
///
/// // Destructive action
/// VisorSettingsTile(
///   icon: Icons.logout,
///   label: 'Sign out',
///   destructive: true,
///   onTap: _signOut,
/// )
///
/// // With custom trailing
/// VisorSettingsTile(
///   icon: Icons.notifications_outlined,
///   label: 'Push notifications',
///   trailing: Switch(value: _enabled, onChanged: _toggle),
///   onTap: null,
/// )
/// ```
class VisorSettingsTile extends StatelessWidget {
  const VisorSettingsTile({
    super.key,
    required this.icon,
    required this.label,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.destructive = false,
    this.selected = false,
    this.semanticLabel,
  });

  /// The leading icon displayed to the left of the label.
  final IconData icon;

  /// The primary text label of the tile.
  final String label;

  /// Optional secondary text shown below the label.
  final String? subtitle;

  /// Optional trailing widget. Defaults to a chevron-right caret when null.
  /// Pass any widget (e.g. [Switch], [Text], [Icon]) to replace the default.
  final Widget? trailing;

  /// Called when the tile is tapped. Pass null to disable tap behaviour.
  final VoidCallback? onTap;

  /// When true, renders the icon and label in the error/destructive palette.
  final bool destructive;

  /// When true, highlights the tile background with `surfaceSelected`.
  final bool selected;

  /// Overrides the accessibility label. Defaults to [label] when null.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    final Color foreground =
        destructive ? colors.textError : colors.textPrimary;
    final Color subtitleColor = colors.textSecondary;
    final Color? background = selected ? colors.surfaceSelected : null;

    final Widget defaultTrailing = Icon(
      Icons.chevron_right,
      size: 20,
      color: colors.textTertiary,
    );

    return Semantics(
      button: true,
      label: semanticLabel ?? label,
      excludeSemantics: semanticLabel != null,
      child: InkWell(
        onTap: onTap,
        child: Container(
          color: background,
          padding: EdgeInsets.symmetric(
            vertical: spacing.lg,
            horizontal: spacing.lg,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(icon, size: 20, color: foreground),
              SizedBox(width: spacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: textStyles.labelLarge.copyWith(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: foreground,
                      ),
                    ),
                    if (subtitle != null) ...[
                      SizedBox(height: spacing.xs),
                      Text(
                        subtitle!,
                        style: textStyles.bodySmall
                            .copyWith(color: subtitleColor),
                      ),
                    ],
                  ],
                ),
              ),
              SizedBox(width: spacing.sm),
              trailing ?? defaultTrailing,
            ],
          ),
        ),
      ),
    );
  }
}
