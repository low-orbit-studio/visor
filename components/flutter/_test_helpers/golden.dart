import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';

/// Wraps a widget under test in a Visor [Theme] for use inside `goldenTest`
/// `GoldenTestScenario` children. Alchemist already provides a transparent
/// [Material] root, so no [MaterialApp] is needed here — that would add
/// [Scaffold] chrome alchemist does not expect.
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
    child: Padding(padding: const EdgeInsets.all(16), child: child),
  );
}
