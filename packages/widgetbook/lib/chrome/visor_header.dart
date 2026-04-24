import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';

import '../theme/widgetbook_theme.dart';

/// Branded sidebar header — logo + wordmark + brightness toggle stacked
/// above a full-width theme dropdown. Surfaces the theme switcher as
/// first-class chrome instead of leaving it buried in the Addons tab.
class VisorHeader extends StatelessWidget {
  const VisorHeader({
    super.key,
    required this.pairs,
    required this.brightnessNotifier,
    required this.prefs,
  });

  final List<WidgetbookTheme<VisorThemePair>> pairs;
  final ValueNotifier<ThemeMode> brightnessNotifier;
  final SharedPreferences prefs;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<VisorColorsData>();
    final borderColor = colors?.borderDefault ?? const Color(0x14FFFFFF);

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              const Expanded(child: _Wordmark()),
              _BrightnessToggle(
                notifier: brightnessNotifier,
                prefs: prefs,
              ),
            ],
          ),
          const SizedBox(height: 18),
          _ThemeDropdown(pairs: pairs),
        ],
      ),
    );
  }
}

/// Logo + "Visor." wordmark.
class _Wordmark extends StatelessWidget {
  const _Wordmark();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<VisorColorsData>();
    final textColor = colors?.textPrimary ?? Colors.white;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/visor-logo.png',
          width: 28,
          height: 28,
          filterQuality: FilterQuality.medium,
        ),
        const SizedBox(width: 10),
        Text(
          'Visor.',
          style: TextStyle(
            fontFamily: 'Satoshi',
            fontWeight: FontWeight.w700,
            fontSize: 20,
            letterSpacing: -0.5,
            color: textColor,
          ),
        ),
      ],
    );
  }
}

/// Full-width dropdown that drives the [ThemeAddon] via
/// [WidgetbookState.updateQueryField]. Items grouped by Visor stock vs
/// Custom themes with disabled section headers.
class _ThemeDropdown extends StatelessWidget {
  const _ThemeDropdown({required this.pairs});

  final List<WidgetbookTheme<VisorThemePair>> pairs;

  String _currentLabel(WidgetbookState state) {
    final raw = state.queryParams['theme'];
    if (raw == null) return pairs.first.name;
    final group = FieldCodec.decodeQueryGroup(raw);
    return group['name'] ?? pairs.first.name;
  }

  /// Strips "Visor / " or "Custom / " prefix to get the display name.
  String _displayName(String fullName) => fullName.split(' / ').last;

  @override
  Widget build(BuildContext context) {
    final state = WidgetbookState.of(context);
    final colors = Theme.of(context).extension<VisorColorsData>();
    final textColor = colors?.textPrimary ?? Colors.white;
    final tertiaryColor = colors?.textTertiary ?? Colors.white60;
    final fillColor = colors?.surfaceCard ?? Colors.white10;
    final borderColor = colors?.borderDefault ?? Colors.white12;
    final overlayColor = colors?.surfaceOverlay ?? Colors.black;

    return ListenableBuilder(
      listenable: state,
      builder: (ctx, _) {
        final current = _currentLabel(state);
        final selected = pairs.any((p) => p.name == current)
            ? current
            : pairs.first.name;

        return Container(
          height: 40,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: fillColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor, width: 1),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: selected,
              isExpanded: true,
              isDense: true,
              icon: Icon(Icons.expand_more, size: 18, color: tertiaryColor),
              dropdownColor: overlayColor,
              borderRadius: BorderRadius.circular(8),
              menuMaxHeight: 480,
              style: TextStyle(
                fontFamily: 'Satoshi',
                fontSize: 14,
                color: textColor,
              ),
              // Closed-state rendering: show only the display name. The
              // groupless presentation reads cleanly in a narrow sidebar
              // and keeps long names from being clipped by a prefix column.
              selectedItemBuilder: (ctx) => pairs
                  .map((p) => Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          _displayName(p.name),
                          style: TextStyle(
                            fontFamily: 'Satoshi',
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: textColor,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ))
                  .toList(),
              items: _buildItems(textColor, tertiaryColor),
              onChanged: (value) {
                if (value == null) return;
                state.updateQueryField(
                  group: 'theme',
                  field: 'name',
                  value: value,
                );
              },
            ),
          ),
        );
      },
    );
  }

  /// Builds dropdown items with disabled section headers between Visor
  /// stock and Custom themes — modeled on the docs site sidebar grouping.
  List<DropdownMenuItem<String>> _buildItems(Color text, Color tertiary) {
    final visorPairs = pairs.where((p) => p.name.startsWith('Visor / ')).toList();
    final customPairs = pairs.where((p) => p.name.startsWith('Custom / ')).toList();

    DropdownMenuItem<String> sectionHeader(String label) =>
        DropdownMenuItem<String>(
          enabled: false,
          child: Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 4),
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Satoshi',
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.2,
                color: tertiary,
              ),
            ),
          ),
        );

    DropdownMenuItem<String> themeItem(WidgetbookTheme<VisorThemePair> p) =>
        DropdownMenuItem<String>(
          value: p.name,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Text(
              _displayName(p.name),
              style: TextStyle(
                fontFamily: 'Satoshi',
                fontSize: 14,
                color: text,
              ),
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ),
        );

    return [
      if (visorPairs.isNotEmpty) sectionHeader('VISOR'),
      ...visorPairs.map(themeItem),
      if (customPairs.isNotEmpty) sectionHeader('CUSTOM'),
      ...customPairs.map(themeItem),
    ];
  }
}

/// Sun + moon ghost icons, separated by a small gap. No surrounding pill —
/// keeps visual weight low so the wordmark stays the focal point.
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

    return ValueListenableBuilder<ThemeMode>(
      valueListenable: notifier,
      builder: (ctx, mode, _) {
        final isLight = mode == ThemeMode.light;
        return Row(
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
            const SizedBox(width: 4),
            _ToggleIcon(
              icon: Icons.dark_mode_outlined,
              tooltip: 'Dark mode',
              active: !isLight,
              activeColor: activeColor,
              inactiveColor: inactiveColor,
              onPressed: () => _setMode(ThemeMode.dark),
            ),
          ],
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
      child: SizedBox(
        width: 32,
        height: 32,
        child: IconButton(
          icon: Icon(icon, size: 18),
          color: active ? activeColor : inactiveColor,
          padding: EdgeInsets.zero,
          splashRadius: 18,
          hoverColor: active ? Colors.transparent : null,
          onPressed: onPressed,
        ),
      ),
    );
  }
}
