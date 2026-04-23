import 'package:flutter/material.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';

/// SharedPreferences key for the persisted widgetbook theme selection.
const String kVisorWidgetbookThemePrefsKey = 'visor-widgetbook-theme';

/// Default theme label used on first load and when a persisted label
/// no longer exists in the current entry list.
const String kDefaultVisorWidgetbookTheme = 'Visor / Blackout — Dark';

/// Theme slugs classified as "stock" (shipped with Visor core).
/// Mirrors STOCK_THEMES in packages/tokens/src/generate/generate-css.ts.
/// Keep in sync when new stock themes ship.
const List<String> _stockThemeSlugs = <String>[
  'blackout',
  'modern-minimal',
  'neutral',
  'space',
];

/// Pretty display names for every theme exported by `visor_themes`.
/// Maps slug → (VisorThemePair, displayName).
final Map<String, _ThemeMeta> _allThemes = <String, _ThemeMeta>{
  'blackout': _ThemeMeta(VisorThemes.blackout, 'Blackout'),
  'modern-minimal': _ThemeMeta(VisorThemes.modernMinimal, 'Modern Minimal'),
  'neutral': _ThemeMeta(VisorThemes.neutral, 'Neutral'),
  'space': _ThemeMeta(VisorThemes.space, 'Space'),
  'blacklight': _ThemeMeta(VisorThemes.blacklight, 'Blacklight'),
  'blacklight-underground':
      _ThemeMeta(VisorThemes.blacklightUnderground, 'Blacklight Underground'),
  'entr': _ThemeMeta(VisorThemes.entr, 'Entr'),
  'kaiah': _ThemeMeta(VisorThemes.kaiah, 'Kaiah'),
  'reference-app': _ThemeMeta(VisorThemes.referenceApp, 'Reference App'),
  'solespark': _ThemeMeta(VisorThemes.solespark, 'SoleSpark'),
  'veronica': _ThemeMeta(VisorThemes.veronica, 'Veronica'),
};

class _ThemeMeta {
  final VisorThemePair pair;
  final String displayName;
  const _ThemeMeta(this.pair, this.displayName);
}

/// Builds the full 22-entry theme list for the widgetbook addon.
///
/// Ordering:
///   1. Stock themes (group "Visor") before custom themes (group "Custom")
///   2. Alphabetical by display name within each group
///   3. Dark before Light within each theme (alphabetical)
///
/// Labels follow the format `"{Group} / {DisplayName} — {Mode}"`, e.g.
/// `"Visor / Blackout — Dark"` or `"Custom / Veronica — Light"`.
List<WidgetbookTheme<ThemeData>> buildVisorThemeEntries() {
  final List<_ThemeRow> rows = <_ThemeRow>[];
  _allThemes.forEach((slug, meta) {
    final bool isStock = _stockThemeSlugs.contains(slug);
    rows.add(_ThemeRow(
      group: isStock ? 'Visor' : 'Custom',
      isStock: isStock,
      displayName: meta.displayName,
      pair: meta.pair,
    ));
  });

  rows.sort((a, b) {
    if (a.isStock != b.isStock) return a.isStock ? -1 : 1;
    return a.displayName.compareTo(b.displayName);
  });

  final List<WidgetbookTheme<ThemeData>> entries =
      <WidgetbookTheme<ThemeData>>[];
  for (final row in rows) {
    entries.add(WidgetbookTheme<ThemeData>(
      name: '${row.group} / ${row.displayName} — Dark',
      data: row.pair.dark,
    ));
    entries.add(WidgetbookTheme<ThemeData>(
      name: '${row.group} / ${row.displayName} — Light',
      data: row.pair.light,
    ));
  }
  return entries;
}

/// Returns a copy of [entries] with the entry matching [label] moved to index 0,
/// so Widgetbook's default index-0 selection restores the persisted choice.
/// If no entry matches, returns the list unchanged.
List<WidgetbookTheme<ThemeData>> reorderForInitial(
  List<WidgetbookTheme<ThemeData>> entries,
  String label,
) {
  final int idx = entries.indexWhere((e) => e.name == label);
  if (idx <= 0) return List<WidgetbookTheme<ThemeData>>.of(entries);
  final reordered = List<WidgetbookTheme<ThemeData>>.of(entries);
  final picked = reordered.removeAt(idx);
  reordered.insert(0, picked);
  return reordered;
}

class _ThemeRow {
  final String group;
  final bool isStock;
  final String displayName;
  final VisorThemePair pair;
  const _ThemeRow({
    required this.group,
    required this.isStock,
    required this.displayName,
    required this.pair,
  });
}
