import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A three-dot animated loading indicator that pulses in a staggered wave.
///
/// Each dot cycles through three color steps — subtle, default, and strong
/// accent — in a forward-then-backward color sequence, staggered across the
/// three dots to create a smooth wave effect.
///
/// When `MediaQuery.of(context).disableAnimations` is `true`, the animation
/// halts and all three dots render at the "subtle" resting color — no motion,
/// same bounding box.
///
/// ```dart
/// // Default (primary accent palette):
/// const VisorLoadingDots()
///
/// // Custom dot size:
/// const VisorLoadingDots(dotSize: 12)
///
/// // Custom colors:
/// VisorLoadingDots(
///   colorStart: context.visorColors.surfaceAccentSubtle,
///   colorMid:   context.visorColors.surfaceAccentDefault,
///   colorEnd:   context.visorColors.surfaceAccentStrong,
/// )
///
/// // With accessibility label:
/// const VisorLoadingDots(semanticLabel: 'Loading')
/// ```
///
/// ## Semantics
/// [semanticLabel] is opt-in (default `null`). When provided, the widget is
/// wrapped in a leaf `Semantics` node so TalkBack/VoiceOver can announce the
/// loading state.
///
/// ## Animation
/// The controller runs a repeating 1.5-second cycle. Each dot is staggered
/// by 25% of the total duration so the wave reads left-to-right.
/// Reduce-motion: all dots snap to [colorStart] and the controller is stopped.
class VisorLoadingDots extends StatefulWidget {
  /// Creates a three-dot pulsing loading indicator.
  const VisorLoadingDots({
    super.key,
    this.dotSize,
    this.colorStart,
    this.colorMid,
    this.colorEnd,
    this.semanticLabel,
  });

  /// Diameter of each dot in logical pixels. Defaults to `10.0` dp.
  final double? dotSize;

  /// Starting (lightest) color in the animation cycle.
  /// Defaults to `context.visorColors.surfaceAccentSubtle`.
  final Color? colorStart;

  /// Middle color in the animation cycle.
  /// Defaults to `context.visorColors.surfaceAccentDefault`.
  final Color? colorMid;

  /// End (darkest/strongest) color in the animation cycle.
  /// Defaults to `context.visorColors.surfaceAccentStrong`.
  final Color? colorEnd;

  /// Optional accessibility label announced by TalkBack and VoiceOver.
  ///
  /// When null (the default), no [Semantics] node is added. Provide this at
  /// the top of an async screen — not on every inline indicator.
  final String? semanticLabel;

  @override
  State<VisorLoadingDots> createState() => _VisorLoadingDotsState();
}

class _VisorLoadingDotsState extends State<VisorLoadingDots>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool? _reduceMotion;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      // 1.5 s total cycle so the staggered wave reads naturally at ~0.5 s
      // per dot step — fast enough to feel alive, slow enough to be readable.
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    if (reduceMotion != _reduceMotion) {
      _reduceMotion = reduceMotion;
      if (reduceMotion) {
        _controller
          ..stop()
          ..value = 0;
      } else {
        _controller.repeat();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;

    final effectiveDotSize = widget.dotSize ?? 10.0;
    final colorStart = widget.colorStart ?? colors.surfaceAccentSubtle;
    final colorMid = widget.colorMid ?? colors.surfaceAccentDefault;
    final colorEnd = widget.colorEnd ?? colors.surfaceAccentStrong;

    Widget dots = Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return Padding(
          padding: EdgeInsets.only(right: index < 2 ? spacing.sm : 0),
          child: _AnimatedDot(
            controller: _controller,
            index: index,
            size: effectiveDotSize,
            colorStart: colorStart,
            colorMid: colorMid,
            colorEnd: colorEnd,
          ),
        );
      }),
    );

    if (widget.semanticLabel != null) {
      dots = Semantics(label: widget.semanticLabel, child: dots);
    }

    return dots;
  }
}

// ---------------------------------------------------------------------------
// Internal animated dot
// ---------------------------------------------------------------------------

class _AnimatedDot extends StatelessWidget {
  const _AnimatedDot({
    required this.controller,
    required this.index,
    required this.size,
    required this.colorStart,
    required this.colorMid,
    required this.colorEnd,
  });

  final AnimationController controller;
  final int index;
  final double size;
  final Color colorStart;
  final Color colorMid;
  final Color colorEnd;

  @override
  Widget build(BuildContext context) {
    // Stagger each dot by 25% of the cycle. The interval starts at the delay
    // offset and runs to 1.0 — dots at higher indices have a shorter effective
    // window but wrap naturally because the controller repeats.
    final delay = index * 0.25;

    final colorAnimation = TweenSequence<Color?>(
      [
        // Forward: start → mid → end
        TweenSequenceItem(
          tween: ColorTween(begin: colorStart, end: colorMid)
              .chain(CurveTween(curve: Curves.easeInOut)),
          weight: 1,
        ),
        TweenSequenceItem(
          tween: ColorTween(begin: colorMid, end: colorEnd)
              .chain(CurveTween(curve: Curves.easeInOut)),
          weight: 1,
        ),
        // Backward: end → mid → start
        TweenSequenceItem(
          tween: ColorTween(begin: colorEnd, end: colorMid)
              .chain(CurveTween(curve: Curves.easeInOut)),
          weight: 1,
        ),
        TweenSequenceItem(
          tween: ColorTween(begin: colorMid, end: colorStart)
              .chain(CurveTween(curve: Curves.easeInOut)),
          weight: 1,
        ),
      ],
    ).animate(
      CurvedAnimation(
        parent: controller,
        curve: Interval(delay, 1.0),
      ),
    );

    return AnimatedBuilder(
      animation: controller,
      builder: (context, child) {
        return SizedBox(
          width: size,
          height: size,
          child: DecoratedBox(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: colorAnimation.value ?? colorStart,
            ),
          ),
        );
      },
    );
  }
}
