import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A centered empty-state placeholder composed of an icon, a headline,
/// optional body copy, and optional call-to-action widgets.
///
/// Layout adapts automatically to available vertical space: a standard
/// vertical stack is used when height ≥ [_kCompactThreshold] px; a compact
/// horizontal (icon-left / text-right) layout is used below that threshold.
/// The `forceCompact` flag bypasses the adaptive check and always renders
/// the compact layout — useful when the caller knows the container is
/// height-constrained (e.g., `VisorEmptyStateCard`).
///
/// ## Accessibility
///
/// The widget is wrapped in a `Semantics` container so screen readers
/// (TalkBack / VoiceOver) announce the empty state as a single coherent
/// region. By default the container label equals [headline]. Pass
/// [semanticLabel] to override — useful when the headline alone lacks
/// enough context (e.g. `semanticLabel: 'Inbox is empty'`). The
/// headline + body subtree is merged via `MergeSemantics` so they are
/// read as one phrase; action widgets remain independently focusable
/// nodes outside the merge.
///
/// ```dart
/// // Standard vertical layout
/// VisorEmptyState(
///   icon: Icons.inbox_outlined,
///   headline: 'No messages yet',
///   body: "You're all caught up. New messages will appear here.",
///   action: VisorButton(label: 'Refresh', onPressed: _refresh),
/// )
///
/// // Dual-action variant
/// VisorEmptyState(
///   icon: Icons.folder_open,
///   headline: 'No projects',
///   body: 'Create your first project to get started.',
///   action: VisorButton(label: 'Create project', onPressed: _create),
///   secondaryAction: VisorButton(
///     label: 'Import existing',
///     style: VisorButtonStyle.secondary,
///     onPressed: _import,
///   ),
/// )
///
/// // Force compact layout
/// VisorEmptyState(
///   icon: Icons.inbox_outlined,
///   headline: 'No messages',
///   forceCompact: true,
/// )
///
/// // Custom semantic label
/// VisorEmptyState(
///   icon: Icons.inbox_outlined,
///   headline: 'No messages',
///   semanticLabel: 'Inbox is empty',
/// )
/// ```
class VisorEmptyState extends StatelessWidget {
  const VisorEmptyState({
    super.key,
    required this.icon,
    required this.headline,
    this.body,
    this.action,
    this.secondaryAction,
    this.iconSize = 48,
    this.forceCompact = false,
    this.semanticLabel,
  });

  final IconData icon;
  final String headline;
  final String? body;

  /// Primary call-to-action widget, rendered below the text content.
  final Widget? action;

  /// Optional secondary call-to-action widget, rendered beside [action]
  /// in a [Row] when present.
  final Widget? secondaryAction;

  /// Size of the leading icon in logical pixels. Defaults to 48.
  final double iconSize;

  /// When `true`, always renders the compact horizontal (icon-left / text-right)
  /// layout regardless of available height. Useful for `VisorEmptyStateCard`
  /// and other height-constrained containers.
  final bool forceCompact;

  /// Optional override for the Semantics container label announced by screen
  /// readers (TalkBack / VoiceOver). Defaults to [headline] when `null`.
  /// Use this when the headline alone lacks sufficient context, e.g.
  /// `semanticLabel: 'Inbox is empty'`.
  final String? semanticLabel;

  /// Available-height threshold below which the adaptive layout switches to
  /// the compact (horizontal) variant.
  static const double _kCompactThreshold = 400;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      label: semanticLabel ?? headline,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final compact =
              forceCompact || constraints.maxHeight < _kCompactThreshold;
          return compact ? _buildCompact(context) : _buildStandard(context);
        },
      ),
    );
  }

  Widget _buildStandard(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    return Padding(
      padding: EdgeInsets.all(spacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, size: iconSize, color: colors.textTertiary),
          SizedBox(height: spacing.lg),
          MergeSemantics(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
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
              ],
            ),
          ),
          if (action != null) ...[
            SizedBox(height: spacing.xl),
            _buildActions(context),
          ],
        ],
      ),
    );
  }

  Widget _buildCompact(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: spacing.lg,
        vertical: spacing.md,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, size: iconSize * 0.625, color: colors.textTertiary),
          SizedBox(width: spacing.md),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MergeSemantics(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        headline,
                        style: textStyles.titleMedium
                            .copyWith(color: colors.textPrimary),
                      ),
                      if (body != null) ...[
                        SizedBox(height: spacing.xs),
                        Text(
                          body!,
                          style: textStyles.bodySmall
                              .copyWith(color: colors.textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),
                if (action != null) ...[
                  SizedBox(height: spacing.sm),
                  _buildActions(context),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    final spacing = context.visorSpacing;

    if (secondaryAction == null) return action!;

    return Wrap(
      spacing: spacing.sm,
      runSpacing: spacing.sm,
      children: [action!, secondaryAction!],
    );
  }
}
