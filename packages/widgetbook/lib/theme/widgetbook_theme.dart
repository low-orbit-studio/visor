import 'package:flutter/material.dart';
import 'package:visor_themes/visor_themes.dart';

/// Demo [ThemeData] used by the Widgetbook preview app.
///
/// Sourced from the Visor-generated SoleSpark theme in the `visor_themes`
/// package (`packages/visor_themes/`), which aggregates all 11 Visor themes.
/// Uses SoleSpark because it carries a complete, tested token set that matches
/// the existing widget use-cases. Future: expose a theme-switcher addon that
/// lets the reviewer pick any VisorThemes getter.
sealed class VisorDemoTheme {
  static ThemeData get light => VisorThemes.solespark.light;
  static ThemeData get dark => VisorThemes.solespark.dark;
}
