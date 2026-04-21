import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

enum VisorDeltaDirection { up, down, flat }

/// A rectangular card displaying a single metric: a title, a large value,
/// an optional change indicator, and an optional leading icon.
///
/// ```dart
/// VisorStatCard(
///   title: 'Revenue',
///   value: '\$12,430',
///   delta: '+8.2%',
///   deltaDirection: VisorDeltaDirection.up,
///   icon: Icons.trending_up,
/// )
/// ```
class VisorStatCard extends StatelessWidget {
  const VisorStatCard({
    super.key,
    required this.title,
    required this.value,
    this.delta,
    this.deltaDirection,
    this.icon,
  });

  final String title;
  final String value;
  final String? delta;
  final VisorDeltaDirection? deltaDirection;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;

    final deltaColor = _deltaColor(colors, deltaDirection);

    return Container(
      padding: EdgeInsets.all(spacing.lg),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(radius.md),
        border: Border.all(color: colors.borderDefault),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 20, color: colors.textSecondary),
                SizedBox(width: spacing.sm),
              ],
              Expanded(
                child: Text(
                  title,
                  style: textStyles.titleMedium
                      .copyWith(color: colors.textSecondary),
                ),
              ),
            ],
          ),
          SizedBox(height: spacing.sm),
          Text(
            value,
            style: textStyles.displaySmall
                .copyWith(color: colors.textPrimary),
          ),
          if (delta != null) ...[
            SizedBox(height: spacing.xs),
            Row(
              children: [
                Icon(
                  _deltaIcon(deltaDirection),
                  size: 16,
                  color: deltaColor,
                ),
                SizedBox(width: spacing.xs),
                Text(
                  delta!,
                  style: textStyles.labelMedium.copyWith(color: deltaColor),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Color _deltaColor(VisorColorsData colors, VisorDeltaDirection? direction) {
    switch (direction) {
      case VisorDeltaDirection.up:
        return colors.textSuccess;
      case VisorDeltaDirection.down:
        return colors.textError;
      case VisorDeltaDirection.flat:
      case null:
        return colors.textTertiary;
    }
  }

  IconData _deltaIcon(VisorDeltaDirection? direction) {
    switch (direction) {
      case VisorDeltaDirection.up:
        return Icons.arrow_upward;
      case VisorDeltaDirection.down:
        return Icons.arrow_downward;
      case VisorDeltaDirection.flat:
      case null:
        return Icons.horizontal_rule;
    }
  }
}
