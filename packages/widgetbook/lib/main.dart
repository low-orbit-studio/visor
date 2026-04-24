import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

import 'chrome/visor_chrome.dart';
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
                home: VisorPreviewShell(
                  brightnessNotifier: _brightnessNotifier,
                  prefs: widget.prefs,
                  child: child,
                ),
              ),
            ),
          ),
        ],
      );
}

/// Wraps each preview in a theme-aware [Scaffold] whose backdrop reads the
/// active theme's `VisorColorsData.surfacePage`, with a low-key brightness
/// toggle anchored bottom-left to mirror the docs site's mode switcher.
class VisorPreviewShell extends StatelessWidget {
  const VisorPreviewShell({
    super.key,
    required this.brightnessNotifier,
    required this.prefs,
    required this.child,
  });

  final ValueNotifier<ThemeMode> brightnessNotifier;
  final SharedPreferences prefs;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: resolveBackdrop(context),
      body: Stack(
        children: [
          Positioned.fill(child: child),
          Positioned(
            left: 16,
            bottom: 16,
            child: _BrightnessToggle(
              notifier: brightnessNotifier,
              prefs: prefs,
            ),
          ),
        ],
      ),
    );
  }
}

/// Sun/moon pair anchored bottom-left, matching the docs site's mode toggle
/// position and visual weight. Both icons render at the same time; the
/// inactive one fades to a tertiary text color so the active mode reads.
class _BrightnessToggle extends StatelessWidget {
  const _BrightnessToggle({
    required this.notifier,
    required this.prefs,
  });

  final ValueNotifier<ThemeMode> notifier;
  final SharedPreferences prefs;

  void _setMode(ThemeMode next) {
    if (notifier.value == next) return;
    notifier.value = next;
    unawaited(prefs.setString(
      kVisorWidgetbookBrightnessPrefsKey,
      next == ThemeMode.dark ? 'dark' : 'light',
    ));
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<VisorColorsData>();
    final activeColor = colors?.textPrimary ?? Colors.white;
    final inactiveColor = colors?.textTertiary ?? Colors.white54;
    final surface = colors?.surfaceCard ?? Colors.white10;
    final border = colors?.borderDefault ?? Colors.white12;

    return ValueListenableBuilder<ThemeMode>(
      valueListenable: notifier,
      builder: (ctx, mode, _) {
        final isLight = mode == ThemeMode.light;
        return Material(
          color: surface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
            side: BorderSide(color: border, width: 1),
          ),
          child: Padding(
            padding: const EdgeInsets.all(2),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _ToggleIcon(
                  icon: Icons.light_mode_outlined,
                  tooltip: 'Light mode',
                  active: isLight,
                  activeColor: activeColor,
                  inactiveColor: inactiveColor,
                  onPressed: () => _setMode(ThemeMode.light),
                ),
                _ToggleIcon(
                  icon: Icons.dark_mode_outlined,
                  tooltip: 'Dark mode',
                  active: !isLight,
                  activeColor: activeColor,
                  inactiveColor: inactiveColor,
                  onPressed: () => _setMode(ThemeMode.dark),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ToggleIcon extends StatelessWidget {
  const _ToggleIcon({
    required this.icon,
    required this.tooltip,
    required this.active,
    required this.activeColor,
    required this.inactiveColor,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final bool active;
  final Color activeColor;
  final Color inactiveColor;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: IconButton(
        icon: Icon(icon, size: 16),
        color: active ? activeColor : inactiveColor,
        visualDensity: VisualDensity.compact,
        constraints: const BoxConstraints(minWidth: 28, minHeight: 28),
        padding: EdgeInsets.zero,
        onPressed: onPressed,
      ),
    );
  }
}
