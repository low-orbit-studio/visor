import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'chrome/visor_chrome.dart';
import 'chrome/visor_header.dart';
import 'chrome/visor_home.dart';
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
  late final ThemeData _chromeTheme;

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
    _chromeTheme = buildChromeTheme();
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
        // Chrome stays Blackout-dark regardless of preview theme — the nav
        // surface is the constant the user navigates against.
        lightTheme: _chromeTheme,
        darkTheme: _chromeTheme,
        themeMode: ThemeMode.dark,
        // Branded sidebar header — surfaces theme switcher + brightness toggle
        // as first-class chrome instead of burying them in the Addons tab.
        header: VisorHeader(
          pairs: _pairs,
          brightnessNotifier: _brightnessNotifier,
          prefs: widget.prefs,
        ),
        // Intro screen for the empty-state view (no use case selected).
        home: const VisorHome(),
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
                theme: buildPreviewTheme(pair.light),
                darkTheme: buildPreviewTheme(pair.dark),
                themeMode: mode,
                home: VisorPreviewShell(child: child),
              ),
            ),
          ),
        ],
      );
}

/// Wraps each preview in a theme-aware [Scaffold] whose backdrop reads the
/// active theme's `VisorColorsData.surfacePage`. Chrome controls (theme
/// dropdown, brightness toggle) live in [VisorHeader], so this shell stays
/// focused on the preview canvas.
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
