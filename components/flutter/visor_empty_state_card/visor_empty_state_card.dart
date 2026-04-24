import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

import '../visor_empty_state/visor_empty_state.dart';

/// A card-surface wrapper around [VisorEmptyState] for drop-in use inside
/// lists, panels, and other slotted containers.
///
/// Renders a bordered card surface ([surfaceCard] + [borderDefault]) with
/// [VisorEmptyState] pinned to compact (horizontal) layout and internal
/// horizontal padding neutralized so the card's own padding governs spacing.
///
/// ```dart
/// VisorEmptyStateCard(
///   icon: Icons.inbox_outlined,
///   headline: 'No messages',
///   body: "You're all caught up.",
///   action: VisorButton(label: 'Refresh', onPressed: _refresh),
/// )
/// ```
class VisorEmptyStateCard extends StatelessWidget {
  const VisorEmptyStateCard({
    super.key,
    required this.icon,
    required this.headline,
    this.body,
    this.action,
    this.secondaryAction,
    this.iconSize = 48,
  });

  final IconData icon;
  final String headline;
  final String? body;
  final Widget? action;
  final Widget? secondaryAction;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final radius = context.visorRadius;

    return Container(
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(radius.md),
        border: Border.all(color: colors.borderDefault),
      ),
      // Outer card padding on all sides; the inner VisorEmptyState removes
      // its own horizontal padding via forceCompact to avoid double-padding.
      padding: EdgeInsets.symmetric(
        horizontal: spacing.lg,
        vertical: spacing.md,
      ),
      child: VisorEmptyState(
        icon: icon,
        headline: headline,
        body: body,
        action: action,
        secondaryAction: secondaryAction,
        iconSize: iconSize,
        forceCompact: true,
      ),
    );
  }
}
