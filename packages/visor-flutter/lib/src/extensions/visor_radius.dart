import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Visor's border-radius tokens as a Flutter [ThemeExtension].
///
/// Mirrors the `radius.*` section of the `.visor.yaml` interchange format.
/// Values are raw pixel amounts — wrap with [BorderRadius.circular] or
/// [BorderRadius.only] at call sites for flexibility.
///
/// ```dart
/// final radius = Theme.of(context).extension<VisorRadiusData>()!;
/// Container(
///   decoration: BoxDecoration(
///     borderRadius: BorderRadius.circular(radius.md),
///   ),
/// );
/// ```
@immutable
class VisorRadiusData extends ThemeExtension<VisorRadiusData> {
  const VisorRadiusData({
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
    required this.pill,
  });

  /// Small radius (e.g., badges, compact chips).
  final double sm;

  /// Medium radius (default for most elements).
  final double md;

  /// Large radius (cards, prominent surfaces).
  final double lg;

  /// Extra large radius (hero elements, dialogs).
  final double xl;

  /// Pill/full-rounded radius (typically 9999 — use for circular elements).
  final double pill;

  @override
  VisorRadiusData copyWith({
    double? sm,
    double? md,
    double? lg,
    double? xl,
    double? pill,
  }) {
    return VisorRadiusData(
      sm: sm ?? this.sm,
      md: md ?? this.md,
      lg: lg ?? this.lg,
      xl: xl ?? this.xl,
      pill: pill ?? this.pill,
    );
  }

  @override
  VisorRadiusData lerp(ThemeExtension<VisorRadiusData>? other, double t) {
    if (other is! VisorRadiusData) return this;
    return VisorRadiusData(
      sm: _lerpDouble(sm, other.sm, t),
      md: _lerpDouble(md, other.md, t),
      lg: _lerpDouble(lg, other.lg, t),
      xl: _lerpDouble(xl, other.xl, t),
      pill: _lerpDouble(pill, other.pill, t),
    );
  }

  static double _lerpDouble(double a, double b, double t) =>
      a + (b - a) * math.min(math.max(t, 0.0), 1.0);
}
