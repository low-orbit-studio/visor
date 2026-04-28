import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Visor's stroke-width tokens as a Flutter [ThemeExtension].
///
/// Mirrors the `strokeWidths.*` section of the `.visor.yaml` interchange
/// format. Values are raw pixel amounts intended for use as
/// [BorderSide.width], [CircularProgressIndicator.strokeWidth],
/// [Border.all] `width:`, divider thickness, and similar stroke-style
/// properties.
///
/// ```dart
/// final strokes = Theme.of(context).extension<VisorStrokeWidthsData>()!;
/// CircularProgressIndicator(
///   strokeWidth: strokes.thick,
/// );
/// ```
@immutable
class VisorStrokeWidthsData extends ThemeExtension<VisorStrokeWidthsData> {
  const VisorStrokeWidthsData({
    required this.thin,
    required this.regular,
    required this.medium,
    required this.thick,
  });

  /// 1px — hairline borders, dividers.
  final double thin;

  /// 1.5px — default emphasized borders.
  final double regular;

  /// 2px — focus rings, button progress indicators.
  final double medium;

  /// 2.5px — large progress spinners, prominent outlines.
  final double thick;

  @override
  VisorStrokeWidthsData copyWith({
    double? thin,
    double? regular,
    double? medium,
    double? thick,
  }) {
    return VisorStrokeWidthsData(
      thin: thin ?? this.thin,
      regular: regular ?? this.regular,
      medium: medium ?? this.medium,
      thick: thick ?? this.thick,
    );
  }

  @override
  VisorStrokeWidthsData lerp(
    ThemeExtension<VisorStrokeWidthsData>? other,
    double t,
  ) {
    if (other is! VisorStrokeWidthsData) return this;
    return VisorStrokeWidthsData(
      thin: _lerpDouble(thin, other.thin, t),
      regular: _lerpDouble(regular, other.regular, t),
      medium: _lerpDouble(medium, other.medium, t),
      thick: _lerpDouble(thick, other.thick, t),
    );
  }

  static double _lerpDouble(double a, double b, double t) =>
      a + (b - a) * math.min(math.max(t, 0.0), 1.0);
}
