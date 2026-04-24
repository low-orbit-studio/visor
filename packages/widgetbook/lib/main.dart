import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'persistence.dart';
import 'theme/widgetbook_theme.dart';
import 'main.directories.g.dart';

/// Strips a legacy " — Dark" or " — Light" suffix from a persisted label,
/// returning the pair label and the brightness it implied.
({String label, ThemeMode mode}) _migrateLegacyLabel(String raw) {
  if (raw.endsWith(' — Dark')) {
    return (label: raw.substring(0, raw.length - 7), mode: ThemeMode.dark);
  }
  if (raw.endsWith(' — Light')) {
    return (label: raw.substring(0, raw.length - 8), mode: ThemeMode.light);
  }
  return (label: raw, mode: ThemeMode.dark);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  final rawLabel =
      prefs.getString(kVisorWidgetbookThemePrefsKey) ?? kDefaultVisorWidgetbookTheme;
  final migrated = _migrateLegacyLabel(rawLabel);

  final brightnessStr = prefs.getString(kVisorWidgetbookBrightnessPrefsKey);
  final ThemeMode initialBrightness = brightnessStr == 'light'
      ? ThemeMode.light
      : brightnessStr == 'dark'
          ? ThemeMode.dark
          : migrated.mode;

  runApp(VisorWidgetbookApp(
    prefs: prefs,
    initialThemeLabel: migrated.label,
    initialBrightness: initialBrightness,
  ));
}

@widgetbook.App()
class VisorWidgetbookApp extends StatefulWidget {
  const VisorWidgetbookApp({
    super.key,
    required this.prefs,
    required this.initialThemeLabel,
    required this.initialBrightness,
  });

  final SharedPreferences prefs;
  final String initialThemeLabel;
  final ThemeMode initialBrightness;

  @override
  State<VisorWidgetbookApp> createState() => _VisorWidgetbookAppState();
}

class _VisorWidgetbookAppState extends State<VisorWidgetbookApp> {
  late final List<WidgetbookTheme<VisorThemePair>> _pairs;
  late final WidgetbookTheme<VisorThemePair> _initialPair;
  late final VisorThemePersistenceIntegration _persistence;
  late final ValueNotifier<ThemeMode> _brightnessNotifier;

  @override
  void initState() {
    super.initState();
    _pairs = buildVisorThemePairs();
    _initialPair = _pairs.firstWhere(
      (e) => e.name == widget.initialThemeLabel,
      orElse: () => _pairs.first,
    );
    _persistence = VisorThemePersistenceIntegration(
      prefs: widget.prefs,
      initialLabel: _initialPair.name,
    );
    _brightnessNotifier = ValueNotifier<ThemeMode>(widget.initialBrightness);
  }

  @override
  void dispose() {
    _brightnessNotifier.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Widgetbook(
        directories: directories,
        appBuilder: (_, child) => child,
        integrations: [_persistence],
        addons: [
          ThemeAddon<VisorThemePair>(
            themes: _pairs,
            initialTheme: _initialPair,
            themeBuilder: (context, pair, child) =>
                ValueListenableBuilder<ThemeMode>(
              valueListenable: _brightnessNotifier,
              builder: (ctx, mode, _) => MaterialApp(
                debugShowCheckedModeBanner: false,
                theme: pair.light,
                darkTheme: pair.dark,
                themeMode: mode,
                home: Material(
                  child: Stack(
                    children: [
                      Positioned.fill(child: child),
                      Positioned(
                        top: 8,
                        right: 8,
                        child: _BrightnessToggle(
                          notifier: _brightnessNotifier,
                          prefs: widget.prefs,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      );
}

class _BrightnessToggle extends StatelessWidget {
  const _BrightnessToggle({
    required this.notifier,
    required this.prefs,
  });

  final ValueNotifier<ThemeMode> notifier;
  final SharedPreferences prefs;

  void _toggle() {
    final next =
        notifier.value == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifier.value = next;
    unawaited(prefs.setString(
      kVisorWidgetbookBrightnessPrefsKey,
      next == ThemeMode.dark ? 'dark' : 'light',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = notifier.value == ThemeMode.dark;
    return Material(
      color: Colors.transparent,
      child: Tooltip(
        message: isDark ? 'Switch to light mode' : 'Switch to dark mode',
        child: IconButton(
          icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
          onPressed: _toggle,
        ),
      ),
    );
  }
}
