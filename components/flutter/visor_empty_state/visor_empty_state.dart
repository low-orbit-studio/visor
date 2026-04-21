import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A centered empty-state placeholder composed of an icon, a headline,
/// optional body copy, and an optional call-to-action widget.
///
/// ```dart
/// VisorEmptyState(
///   icon: Icons.inbox_outlined,
///   headline: 'No messages yet',
///   body: "You're all caught up. New messages will appear here.",
///   action: VisorButton(label: 'Refresh', onPressed: _refresh),
/// )
/// ```
class VisorEmptyState extends StatelessWidget {
  const VisorEmptyState({
    super.key,
    required this.icon,
    required this.headline,
    this.body,
    this.action,
  });

  final IconData icon;
  final String headline;
  final String? body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    return Padding(
      padding: EdgeInsets.all(spacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: colors.textTertiary),
          SizedBox(height: spacing.lg),
          Text(
            headline,
            textAlign: TextAlign.center,
            style: textStyles.headlineSmall
                .copyWith(color: colors.textPrimary),
          ),
          if (body != null) ...[
            SizedBox(height: spacing.sm),
            Text(
              body!,
              textAlign: TextAlign.center,
              style: textStyles.bodyMedium
                  .copyWith(color: colors.textSecondary),
            ),
          ],
          if (action != null) ...[
            SizedBox(height: spacing.xl),
            action!,
          ],
        ],
      ),
    );
  }
}
