import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Visor's spacing tokens as a Flutter [ThemeExtension].
///
/// Mirrors Visor's 4px-grid `--spacing-N` scale. Consumers reference
/// named sizes rather than literal doubles, so spacing stays consistent
/// across a theme.
///
/// ```dart
/// final spacing = Theme.of(context).extension<VisorSpacingData>()!;
/// Padding(
///   padding: EdgeInsets.all(spacing.md),
///   child: ...,
/// );
/// ```
@immutable
class VisorSpacingData extends ThemeExtension<VisorSpacingData> {
  const VisorSpacingData({
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
    required this.xxl,
    required this.xxxl,
  });

  /// 1× base unit (default 4).
  final double xs;

  /// 2× base unit (default 8).
  final double sm;

  /// 3× base unit (default 12).
  final double md;

  /// 4× base unit (default 16).
  final double lg;

  /// 6× base unit (default 24).
  final double xl;

  /// 8× base unit (default 32).
  final double xxl;

  /// 12× base unit (default 48).
  final double xxxl;

  @override
  VisorSpacingData copyWith({
    double? xs,
    double? sm,
    double? md,
    double? lg,
    double? xl,
    double? xxl,
    double? xxxl,
  }) {
    return VisorSpacingData(
      xs: xs ?? this.xs,
      sm: sm ?? this.sm,
      md: md ?? this.md,
      lg: lg ?? this.lg,
      xl: xl ?? this.xl,
      xxl: xxl ?? this.xxl,
      xxxl: xxxl ?? this.xxxl,
    );
  }

  @override
  VisorSpacingData lerp(ThemeExtension<VisorSpacingData>? other, double t) {
    if (other is! VisorSpacingData) return this;
    return VisorSpacingData(
      xs: _lerpDouble(xs, other.xs, t),
      sm: _lerpDouble(sm, other.sm, t),
      md: _lerpDouble(md, other.md, t),
      lg: _lerpDouble(lg, other.lg, t),
      xl: _lerpDouble(xl, other.xl, t),
      xxl: _lerpDouble(xxl, other.xxl, t),
      xxxl: _lerpDouble(xxxl, other.xxxl, t),
    );
  }

  static double _lerpDouble(double a, double b, double t) =>
      a + (b - a) * math.min(math.max(t, 0.0), 1.0);
}
