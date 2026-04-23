import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'theme/widgetbook_theme.dart';
import 'main.directories.g.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  final initialLabel = prefs.getString(kVisorWidgetbookThemePrefsKey) ??
      kDefaultVisorWidgetbookTheme;
  runApp(VisorWidgetbookApp(
    prefs: prefs,
    initialThemeLabel: initialLabel,
  ));
}

@widgetbook.App()
class VisorWidgetbookApp extends StatefulWidget {
  const VisorWidgetbookApp({
    super.key,
    required this.prefs,
    required this.initialThemeLabel,
  });

  final SharedPreferences prefs;
  final String initialThemeLabel;

  @override
  State<VisorWidgetbookApp> createState() => _VisorWidgetbookAppState();
}

class _VisorWidgetbookAppState extends State<VisorWidgetbookApp> {
  late final List<WidgetbookTheme<ThemeData>> _entries;
  String? _lastPersisted;

  @override
  void initState() {
    super.initState();
    _entries = reorderForInitial(
      buildVisorThemeEntries(),
      widget.initialThemeLabel,
    );
    _lastPersisted = widget.initialThemeLabel;
  }

  @override
  Widget build(BuildContext context) => Widgetbook.material(
        directories: directories,
        addons: [
          ThemeAddon<ThemeData>(
            themes: _entries,
            themeBuilder: (context, theme, child) {
              _persistActiveTheme(theme);
              return Theme(data: theme, child: child);
            },
          ),
        ],
      );

  void _persistActiveTheme(ThemeData active) {
    // Match by value equality: ThemeData overrides `==`, and identity is fragile
    // if any VisorThemes getter returns a fresh instance per call.
    final match = _entries.firstWhere(
      (entry) => entry.data == active,
      orElse: () => _entries.first,
    );
    if (match.name == _lastPersisted) return;
    _lastPersisted = match.name;
    unawaited(
      widget.prefs.setString(kVisorWidgetbookThemePrefsKey, match.name),
    );
  }
}
