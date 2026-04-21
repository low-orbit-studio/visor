import 'package:flutter/material.dart';

/// Visor's elevation/shadow tokens as a Flutter [ThemeExtension].
///
/// Mirrors the `shadows.*` section of the `.visor.yaml` interchange format.
/// Each shadow is a list of [BoxShadow] (since CSS allows multi-layer
/// shadows, e.g. `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`).
@immutable
class VisorShadows extends ThemeExtension<VisorShadows> {
  const VisorShadows({
    required this.xs,
    required this.sm,
    required this.md,
    required this.lg,
    required this.xl,
  });

  final List<BoxShadow> xs;
  final List<BoxShadow> sm;
  final List<BoxShadow> md;
  final List<BoxShadow> lg;
  final List<BoxShadow> xl;

  @override
  VisorShadows copyWith({
    List<BoxShadow>? xs,
    List<BoxShadow>? sm,
    List<BoxShadow>? md,
    List<BoxShadow>? lg,
    List<BoxShadow>? xl,
  }) {
    return VisorShadows(
      xs: xs ?? this.xs,
      sm: sm ?? this.sm,
      md: md ?? this.md,
      lg: lg ?? this.lg,
      xl: xl ?? this.xl,
    );
  }

  @override
  VisorShadows lerp(ThemeExtension<VisorShadows>? other, double t) {
    if (other is! VisorShadows) return this;
    return VisorShadows(
      xs: _lerpShadows(xs, other.xs, t),
      sm: _lerpShadows(sm, other.sm, t),
      md: _lerpShadows(md, other.md, t),
      lg: _lerpShadows(lg, other.lg, t),
      xl: _lerpShadows(xl, other.xl, t),
    );
  }

  static List<BoxShadow> _lerpShadows(
    List<BoxShadow> a,
    List<BoxShadow> b,
    double t,
  ) {
    if (a.length != b.length) return t < 0.5 ? a : b;
    return <BoxShadow>[
      for (var i = 0; i < a.length; i++) BoxShadow.lerp(a[i], b[i], t)!,
    ];
  }
}
