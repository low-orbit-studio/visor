import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'chrome/visor_chrome.dart';
import 'chrome/visor_header.dart';
import 'chrome/visor_home.dart';
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
  late final ValueNotifier<String> _themeLabel;
  late final ValueNotifier<ThemeMode> _brightness;

  @override
  void initState() {
    super.initState();
    _pairs = buildVisorThemePairs();
    final initial = _pairs.firstWhere(
      (p) => p.name == widget.initialThemeLabel,
      orElse: () => _pairs.first,
    );
    _themeLabel = ValueNotifier<String>(initial.name);
    _brightness = ValueNotifier<ThemeMode>(widget.initialBrightness);

    _themeLabel.addListener(_persistTheme);
    _brightness.addListener(_persistBrightness);
  }

  @override
  void dispose() {
    _themeLabel.removeListener(_persistTheme);
    _brightness.removeListener(_persistBrightness);
    _themeLabel.dispose();
    _brightness.dispose();
    super.dispose();
  }

  void _persistTheme() {
    unawaited(
      widget.prefs.setString(kVisorWidgetbookThemePrefsKey, _themeLabel.value),
    );
  }

  void _persistBrightness() {
    unawaited(widget.prefs.setString(
      kVisorWidgetbookBrightnessPrefsKey,
      _brightness.value == ThemeMode.dark ? 'dark' : 'light',
    ));
  }

  VisorThemePair _activePair() => _pairs
      .firstWhere(
        (p) => p.name == _themeLabel.value,
        orElse: () => _pairs.first,
      )
      .data;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([_themeLabel, _brightness]),
      builder: (ctx, _) {
        final pair = _activePair();
        final mode = _brightness.value;
        // Chrome adapts to the active theme + brightness — sidebar, header,
        // nav tree, and addon panels all reflect the user's selection.
        final chromeBase = mode == ThemeMode.light ? pair.light : pair.dark;
        final chromeTheme = applySatoshi(chromeBase);

        return Widgetbook(
          directories: directories,
          // Widgetbook captures `appBuilder` once in initState, so closing over
          // pair/mode here would freeze the preview theme on the first value.
          // Re-read both notifiers via ValueListenableBuilder so the body
          // tracks the active theme on every change.
          appBuilder: (_, child) => ValueListenableBuilder<String>(
            valueListenable: _themeLabel,
            builder: (_, __, ___) => ValueListenableBuilder<ThemeMode>(
              valueListenable: _brightness,
              builder: (_, currentMode, ____) {
                final livePair = _activePair();
                return MaterialApp(
                  debugShowCheckedModeBanner: false,
                  theme: buildPreviewTheme(livePair.light),
                  darkTheme: buildPreviewTheme(livePair.dark),
                  themeMode: currentMode,
                  home: VisorPreviewShell(child: child),
                );
              },
            ),
          ),
          lightTheme: chromeTheme,
          darkTheme: chromeTheme,
          themeMode: mode,
          header: VisorHeader(
            pairs: _pairs,
            themeLabel: _themeLabel,
            brightness: _brightness,
          ),
          home: const VisorHome(),
        );
      },
    );
  }
}

/// Wraps each preview in a theme-aware [Scaffold] whose backdrop reads the
/// active theme's `VisorColorsData.surfacePage`.
class VisorPreviewShell extends StatelessWidget {
  const VisorPreviewShell({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: resolveBackdrop(context),
      body: child,
    );
  }
}
