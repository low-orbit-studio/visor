import 'dart:async';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:widgetbook/widgetbook.dart';

import 'theme/widgetbook_theme.dart';

/// Persists the active Widgetbook theme label to [SharedPreferences] whenever
/// the ThemeAddon selection changes. Runs via [WidgetbookIntegration.onChange],
/// outside the build phase.
class VisorThemePersistenceIntegration extends WidgetbookIntegration {
  VisorThemePersistenceIntegration({
    required this.prefs,
    required String initialLabel,
  }) : _lastPersisted = initialLabel;

  final SharedPreferences prefs;
  String _lastPersisted;

  // slugify('Theme') — matches WidgetbookAddon.groupName for ThemeAddon.
  static const String _themeGroup = 'theme';

  @override
  void onChange(WidgetbookState state) {
    final raw = state.queryParams[_themeGroup];
    if (raw == null) return;
    final group = FieldCodec.decodeQueryGroup(raw);
    final label = group['name'];
    if (label == null || label == _lastPersisted) return;
    _lastPersisted = label;
    unawaited(prefs.setString(kVisorWidgetbookThemePrefsKey, label));
  }
}
