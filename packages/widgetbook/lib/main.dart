import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'persistence.dart';
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
  late final WidgetbookTheme<ThemeData> _initialEntry;
  late final VisorThemePersistenceIntegration _persistence;

  @override
  void initState() {
    super.initState();
    _entries = buildVisorThemeEntries();
    _initialEntry = _entries.firstWhere(
      (e) => e.name == widget.initialThemeLabel,
      orElse: () => _entries.first,
    );
    _persistence = VisorThemePersistenceIntegration(
      prefs: widget.prefs,
      initialLabel: _initialEntry.name,
    );
  }

  @override
  Widget build(BuildContext context) => Widgetbook(
        directories: directories,
        appBuilder: (_, child) => child,
        integrations: [_persistence],
        addons: [
          ThemeAddon<ThemeData>(
            themes: _entries,
            initialTheme: _initialEntry,
            themeBuilder: (context, theme, child) => MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: theme,
              home: Material(child: child),
            ),
          ),
        ],
      );
}

