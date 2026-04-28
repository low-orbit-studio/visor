import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Visor's opacity-scale tokens as a Flutter [ThemeExtension].
///
/// Mirrors the `--opacity-*` CSS custom properties emitted by
/// `@loworbitstudio/visor-core`. Values are raw alpha doubles in `[0, 1]`
/// intended for use as the `alpha:` argument to [Color.withValues] (and
/// equivalent ARGB constructors). The scale is fixed across themes —
/// opacity is a math primitive, not a brand decision (Visor decision D3 on
/// VI-245).
///
/// ```dart
/// final opacity = context.visorOpacity;
/// final overlay = colors.interactivePrimaryBg.withValues(alpha: opacity.alpha12);
/// ```
@immutable
class VisorOpacityData extends ThemeExtension<VisorOpacityData> {
  const VisorOpacityData({
    required this.alpha5,
    required this.alpha10,
    required this.alpha12,
    required this.alpha20,
    required this.alpha40,
    required this.alpha50,
    required this.alpha60,
    required this.alpha80,
  });

  /// 0.05 — barely-there overlays, M3 highlight base.
  final double alpha5;

  /// 0.10 — subtle hover/pressed overlays, M3 splash base.
  final double alpha10;

  /// 0.12 — Material Design state-overlay standard (button/input hover).
  final double alpha12;

  /// 0.20 — emphasized overlays, ghost surfaces.
  final double alpha20;

  /// 0.40 — disabled-state foreground/background blends.
  final double alpha40;

  /// 0.50 — Material `highlightColor` strength, scrim half-tone.
  final double alpha50;

  /// 0.60 — heavy overlay, near-solid scrim.
  final double alpha60;

  /// 0.80 — strong scrim, near-opaque masking.
  final double alpha80;

  @override
  VisorOpacityData copyWith({
    double? alpha5,
    double? alpha10,
    double? alpha12,
    double? alpha20,
    double? alpha40,
    double? alpha50,
    double? alpha60,
    double? alpha80,
  }) {
    return VisorOpacityData(
      alpha5: alpha5 ?? this.alpha5,
      alpha10: alpha10 ?? this.alpha10,
      alpha12: alpha12 ?? this.alpha12,
      alpha20: alpha20 ?? this.alpha20,
      alpha40: alpha40 ?? this.alpha40,
      alpha50: alpha50 ?? this.alpha50,
      alpha60: alpha60 ?? this.alpha60,
      alpha80: alpha80 ?? this.alpha80,
    );
  }

  @override
  VisorOpacityData lerp(
    ThemeExtension<VisorOpacityData>? other,
    double t,
  ) {
    if (other is! VisorOpacityData) return this;
    return VisorOpacityData(
      alpha5: _lerpDouble(alpha5, other.alpha5, t),
      alpha10: _lerpDouble(alpha10, other.alpha10, t),
      alpha12: _lerpDouble(alpha12, other.alpha12, t),
      alpha20: _lerpDouble(alpha20, other.alpha20, t),
      alpha40: _lerpDouble(alpha40, other.alpha40, t),
      alpha50: _lerpDouble(alpha50, other.alpha50, t),
      alpha60: _lerpDouble(alpha60, other.alpha60, t),
      alpha80: _lerpDouble(alpha80, other.alpha80, t),
    );
  }

  static double _lerpDouble(double a, double b, double t) =>
      a + (b - a) * math.min(math.max(t, 0.0), 1.0);
}
