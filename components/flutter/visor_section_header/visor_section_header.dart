import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// Section heading with a title, optional subtitle, and optional trailing
/// slot (e.g. a "View all" link, filter button, or count badge).
///
/// ```dart
/// VisorSectionHeader(
///   title: 'Recent activity',
///   subtitle: 'Last 30 days',
///   trailing: TextButton(onPressed: _viewAll, child: Text('View all')),
/// )
/// ```
class VisorSectionHeader extends StatelessWidget {
  const VisorSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    return Padding(
      padding: EdgeInsets.symmetric(vertical: spacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: textStyles.titleLarge
                      .copyWith(color: colors.textPrimary),
                ),
                if (subtitle != null) ...[
                  SizedBox(height: spacing.xs),
                  Text(
                    subtitle!,
                    style: textStyles.bodySmall
                        .copyWith(color: colors.textSecondary),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[
            SizedBox(width: spacing.md),
            trailing!,
          ],
        ],
      ),
    );
  }
}
