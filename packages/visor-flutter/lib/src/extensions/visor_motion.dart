import 'package:flutter/material.dart';

/// Visor's motion tokens as a Flutter [ThemeExtension].
///
/// Mirrors the `motion.*` section of the `.visor.yaml` interchange format.
/// Use in animation widgets via
/// `Theme.of(context).extension<VisorMotionData>()!.durationNormal`.
@immutable
class VisorMotionData extends ThemeExtension<VisorMotionData> {
  const VisorMotionData({
    required this.durationFast,
    required this.durationNormal,
    required this.durationSlow,
    required this.easing,
  });

  /// Short transitions (hover states, micro-interactions).
  final Duration durationFast;

  /// Default transition duration (most state changes).
  final Duration durationNormal;

  /// Long transitions (page changes, large element reveals).
  final Duration durationSlow;

  /// Default easing curve for transitions.
  final Curve easing;

  @override
  VisorMotionData copyWith({
    Duration? durationFast,
    Duration? durationNormal,
    Duration? durationSlow,
    Curve? easing,
  }) {
    return VisorMotionData(
      durationFast: durationFast ?? this.durationFast,
      durationNormal: durationNormal ?? this.durationNormal,
      durationSlow: durationSlow ?? this.durationSlow,
      easing: easing ?? this.easing,
    );
  }

  @override
  VisorMotionData lerp(ThemeExtension<VisorMotionData>? other, double t) {
    if (other is! VisorMotionData) return this;
    return VisorMotionData(
      durationFast: _lerpDuration(durationFast, other.durationFast, t),
      durationNormal: _lerpDuration(durationNormal, other.durationNormal, t),
      durationSlow: _lerpDuration(durationSlow, other.durationSlow, t),
      // Curves don't lerp — snap at t=0.5.
      easing: t < 0.5 ? easing : other.easing,
    );
  }

  static Duration _lerpDuration(Duration a, Duration b, double t) {
    return Duration(
      microseconds:
          (a.inMicroseconds + (b.inMicroseconds - a.inMicroseconds) * t)
              .round(),
    );
  }
}
