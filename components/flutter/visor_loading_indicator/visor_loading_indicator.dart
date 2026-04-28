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
///
/// // With accessibility label (screen-level, not inline):
/// VisorLoadingIndicator(semanticLabel: 'Loading')
/// ```
///
/// ## Semantics
/// [semanticLabel] is opt-in (default `null`). When provided, the spinner is
/// wrapped in a leaf `Semantics` node so TalkBack/VoiceOver can announce the
/// loading state. Set this at the *top* of an async screen — not on every
/// inline spinner — to avoid repeated "Loading… Loading…" announcements when
/// multiple spinners are on screen simultaneously.
///
/// ## Stroke width
/// Reads `context.visorStrokeWidths.thick` (`2.5` dp on the default scale).
/// Themes may override stroke widths in their `.visor.yaml` to tune density.
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
    this.semanticLabel,
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

  /// Optional accessibility label announced by TalkBack and VoiceOver.
  ///
  /// When non-null, the spinner is wrapped in a leaf [Semantics] node with
  /// this label. When `null` (the default), no [Semantics] node is added —
  /// this avoids "Loading… Loading…" announcement loops when multiple
  /// spinners are visible or when the caller does not need a screen-reader
  /// announcement.
  ///
  /// **Guidance:** set this at the top of an async screen (e.g. the primary
  /// full-screen loader), not on every small inline spinner. Use the
  /// localized equivalent of `'Loading'` rather than a hard-coded string.
  final String? semanticLabel;

  Widget _wrapSemantics(Widget child) {
    if (semanticLabel == null) return child;
    return Semantics(label: semanticLabel, child: child);
  }

  @override
  Widget build(BuildContext context) {
    final effectiveDelay = delay;

    if (effectiveDelay != null && effectiveDelay > Duration.zero) {
      return _DelayedVisorLoadingIndicator(
        size: size ?? 24.0,
        color: color ?? context.visorColors.interactivePrimaryBg,
        delay: effectiveDelay,
        semanticLabel: semanticLabel,
      );
    }

    return _wrapSemantics(
      _VisorSpinner(
        size: size ?? 24.0,
        color: color ?? context.visorColors.interactivePrimaryBg,
      ),
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
    this.semanticLabel,
  });

  final double size;
  final Color color;
  final Duration delay;
  final String? semanticLabel;

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
    final spinner = _VisorSpinner(size: widget.size, color: widget.color);
    if (widget.semanticLabel == null) return spinner;
    return Semantics(label: widget.semanticLabel, child: spinner);
  }
}

// ---------------------------------------------------------------------------
// Internal spinner / reduce-motion placeholder
// ---------------------------------------------------------------------------

class _VisorSpinner extends StatelessWidget {
  const _VisorSpinner({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final disableAnimations = MediaQuery.of(context).disableAnimations;
    final strokeWidth = context.visorStrokeWidths.thick;

    if (disableAnimations) {
      // Reduce-motion: static circular border — fully absent of animation,
      // same bounding box as the spinner.
      return SizedBox(
        width: size,
        height: size,
        child: DecoratedBox(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: color, width: strokeWidth),
          ),
        ),
      );
    }

    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        strokeCap: StrokeCap.round,
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );
  }
}
