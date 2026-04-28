import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';

/// Wraps a widget under test in a Visor [Theme] for use inside `goldenTest`
/// `GoldenTestScenario` children. Alchemist already provides a transparent
/// [Material] root and outer padding via `GoldenTestTheme.padding`, so no
/// [MaterialApp], [Scaffold], or [Padding] is needed here.
///
/// Defaults to the light fixture; pass `Brightness.dark` to render against
/// [testColorsDark].
Widget goldenWrap(
  Widget child, {
  Brightness brightness = Brightness.light,
}) {
  final colors = brightness == Brightness.dark ? testColorsDark() : testColors();
  return Theme(
    data: VisorTheme.build(colors: colors, brightness: brightness),
    child: child,
  );
}
