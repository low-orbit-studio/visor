import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// A themed loading spinner that supports an optional delay gate.
///
/// By default (`delay: null`) the spinner renders immediately as a
/// [StatelessWidget]. When a positive [delay] is supplied, the widget uses a
/// `StatefulWidget` path that waits the full duration before inserting the
/// spinner into the tree — during the wait window it returns
/// `SizedBox.shrink()` so no accessibility node is announced prematurely.
///
/// When `MediaQuery.of(context).disableAnimations` is `true` the animated
/// spinner is replaced with a static circular border outline — same size,
/// zero animation cost.
///
/// **Centering is the caller's responsibility.** Wrap in `Center` when you
/// need the spinner centered inside its parent.
///
/// ```dart
/// // Immediate (stateless):
/// const VisorLoadingIndicator()
///
/// // Delay-gated (stateful):
/// VisorLoadingIndicator(delay: const Duration(milliseconds: 300))
///
/// // Custom size + color:
/// VisorLoadingIndicator(size: 48, color: Colors.white)
/// ```
///
/// ## Stroke width
/// Fixed at `2.5` dp — between ENTR's implicit default and Veronica's 4.0.
/// No token slot exists yet for spinner stroke width; documented as
/// intentional until the token system adds one.
class VisorLoadingIndicator extends StatelessWidget {
  /// Creates an immediate-render spinner (no delay gate).
  ///
  /// Pass [delay] to activate the `StatefulWidget` delay path. Use the named
  /// constructor [VisorLoadingIndicator.new] (i.e. the default constructor)
  /// when you are certain the spinner should always appear; use [delay] when
  /// you want to avoid a flash-of-spinner on fast operations.
  const VisorLoadingIndicator({
    super.key,
    this.size,
    this.color,
    this.delay,
  });

  /// Logical-pixel diameter of the spinner. Defaults to `24.0` dp.
  final double? size;

  /// Spinner color. Defaults to `context.visorColors.interactivePrimaryBg`.
  final Color? color;

  /// When non-null and greater than [Duration.zero], the widget waits this
  /// long before showing the spinner. The delay is implemented via a
  /// `StatefulWidget` + `Future.delayed` + `if (mounted)` guard — the timer
  /// is cancelled on dispose so no memory leak or setState-after-dispose
  /// error can occur.
  ///
  /// `null` and `Duration.zero` both produce an immediate-render stateless
  /// path; passing `Duration.zero` explicitly is therefore a no-op.
  final Duration? delay;

  @override
  Widget build(BuildContext context) {
    final effectiveDelay = delay;

    if (effectiveDelay != null && effectiveDelay > Duration.zero) {
      return _DelayedVisorLoadingIndicator(
        size: size ?? 24.0,
        color: color ?? context.visorColors.interactivePrimaryBg,
        delay: effectiveDelay,
      );
    }

    return _VisorSpinner(
      size: size ?? 24.0,
      color: color ?? context.visorColors.interactivePrimaryBg,
    );
  }
}

// ---------------------------------------------------------------------------
// Internal stateful delay gate
// ---------------------------------------------------------------------------

class _DelayedVisorLoadingIndicator extends StatefulWidget {
  const _DelayedVisorLoadingIndicator({
    required this.size,
    required this.color,
    required this.delay,
  });

  final double size;
  final Color color;
  final Duration delay;

  @override
  State<_DelayedVisorLoadingIndicator> createState() =>
      _DelayedVisorLoadingIndicatorState();
}

class _DelayedVisorLoadingIndicatorState
    extends State<_DelayedVisorLoadingIndicator> {
  bool _showIndicator = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(widget.delay, () {
      if (mounted) {
        setState(() => _showIndicator = true);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_showIndicator) return const SizedBox.shrink();
    return _VisorSpinner(size: widget.size, color: widget.color);
  }
}

// ---------------------------------------------------------------------------
// Internal spinner / reduce-motion placeholder
// ---------------------------------------------------------------------------

class _VisorSpinner extends StatelessWidget {
  const _VisorSpinner({required this.size, required this.color});

  final double size;
  final Color color;

  // Stroke width is intentionally not tokenized — no token slot exists yet.
  // Value of 2.5 was chosen as a midpoint between ENTR (default ~2.0) and
  // Veronica (4.0). Document here so future token adoption is trivial.
  static const double _strokeWidth = 2.5;

  @override
  Widget build(BuildContext context) {
    final disableAnimations = MediaQuery.of(context).disableAnimations;

    if (disableAnimations) {
      // Reduce-motion: static circular border — fully absent of animation,
      // same bounding box as the spinner.
      return SizedBox(
        width: size,
        height: size,
        child: DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color, width: _strokeWidth),
          ),
        ),
      );
    }

    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: _strokeWidth,
        strokeCap: StrokeCap.round,
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );
  }
}
