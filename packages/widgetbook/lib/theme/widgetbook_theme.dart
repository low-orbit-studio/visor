import 'package:flutter/material.dart';
import 'package:ui/ui.dart' as demo;

/// Demo [ThemeData] used by the Widgetbook preview app.
///
/// Sourced from the Visor-generated SoleSpark example (`examples/flutter/
/// solespark-ui/`) because that package already carries a full, tested
/// `VisorColorsData` / `VisorTextStylesData` / etc. token set. Re-using it
/// here avoids ~200 lines of hand-maintained token boilerplate for a dev
/// preview app that doesn't need its own brand.
///
/// When Visor supports live theme switching (future Widgetbook addon), this
/// file will change to load arbitrary `.visor.yaml` token sets at runtime.
sealed class VisorDemoTheme {
  static ThemeData get light => demo.VisorAppTheme.light;
  static ThemeData get dark => demo.VisorAppTheme.dark;
}
