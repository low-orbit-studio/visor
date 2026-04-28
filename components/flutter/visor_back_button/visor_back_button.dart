import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A semantic navigation back button with a consistent icon, tap target,
/// and accessibility label.
///
/// All visual properties are driven by Visor token extensions — no hard-coded
/// colors, radii, or spacing. The back-arrow icon automatically mirrors in
/// RTL locales via [Directionality].
///
/// ## Behaviour
///
/// When tapped:
/// - Calls the provided [onPressed] callback if given.
/// - Otherwise attempts [Navigator.maybePop].
///
/// ## Accessibility
///
/// The widget is labelled "Back" by default. Pass [semanticLabel] to override
/// (e.g. for a localized string). The entire hit area is at least 48×48 dp
/// to satisfy Android and iOS tap-target guidelines.
///
/// ## RTL support
///
/// The caret icon is wrapped in a [Directionality]-aware transform so it
/// automatically flips in RTL locales without any additional configuration.
///
/// ```dart
/// // Default — pops the navigator on tap
/// const VisorBackButton()
///
/// // Custom action
/// VisorBackButton(onPressed: () => context.go('/home'))
///
/// // Custom accessibility label
/// VisorBackButton(semanticLabel: 'Go back to settings')
/// ```
class VisorBackButton extends StatelessWidget {
  const VisorBackButton({
    super.key,
    this.onPressed,
    this.semanticLabel,
  });

  /// Optional callback when the back button is tapped.
  ///
  /// If null, defaults to [Navigator.maybePop].
  final VoidCallback? onPressed;

  /// Overrides the default accessibility label ("Back").
  ///
  /// Use for localized strings or context-specific descriptions.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final radius = context.visorRadius;
    final opacity = context.visorOpacity;

    final effectiveLabel = semanticLabel ?? 'Back';

    // Ensure a 48×48 minimum tap target (Android/iOS guideline).
    // spacing.xxxl = 48dp by default; padding is md (12dp) on each side
    // giving 24dp icon + 24dp padding = 48dp total.
    final padding = EdgeInsets.all(spacing.md);

    return Semantics(
      label: effectiveLabel,
      button: true,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed ?? () => Navigator.of(context).maybePop(),
          borderRadius: BorderRadius.circular(radius.xl),
          hoverColor: colors.interactiveGhostBgHover
              .withValues(alpha: opacity.alpha12),
          splashColor: colors.interactivePrimaryBg
              .withValues(alpha: opacity.alpha10),
          child: Padding(
            padding: padding,
            // Directionality-aware icon: the caret-left automatically
            // mirrors to caret-right in RTL locales.
            child: Directionality.of(context) == TextDirection.rtl
                ? Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: colors.textPrimary,
                    size: spacing.xl, // 24dp
                  )
                : Icon(
                    Icons.arrow_back_ios_new_rounded,
                    color: colors.textPrimary,
                    size: spacing.xl, // 24dp
                  ),
          ),
        ),
      ),
    );
  }
}
