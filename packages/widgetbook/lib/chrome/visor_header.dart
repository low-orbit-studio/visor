import 'dart:async';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:visor_themes/visor_themes.dart';
import 'package:widgetbook/widgetbook.dart';

import '../theme/widgetbook_theme.dart';

/// Branded sidebar header — logo, "Visor." wordmark, theme dropdown, and
/// brightness toggle. Surfaces the theme switcher as first-class chrome
/// instead of leaving it buried in the Addons tab.
///
/// Mirrors the docs site sidebar treatment: logo+wordmark up top, theme
/// selector immediately below, brightness toggle inline.
class VisorHeader extends StatelessWidget {
  const VisorHeader({
    super.key,
    required this.pairs,
    required this.brightnessNotifier,
    required this.prefs,
  });

  /// All available theme pairs — drives the dropdown contents.
  final List<WidgetbookTheme<VisorThemePair>> pairs;

  /// Brightness toggle state — light/dark/system.
  final ValueNotifier<ThemeMode> brightnessNotifier;

  /// SharedPreferences for persisting brightness changes.
  final SharedPreferences prefs;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<VisorColorsData>();
    final borderColor = colors?.borderDefault ?? const Color(0x14FFFFFF);

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(color: borderColor, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const _Wordmark(),
          const SizedBox(height: 16),
          _ThemeRow(
            pairs: pairs,
            brightnessNotifier: brightnessNotifier,
            prefs: prefs,
          ),
        ],
      ),
    );
  }
}

/// Logo + "Visor." wordmark stacked horizontally.
class _Wordmark extends StatelessWidget {
  const _Wordmark();

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<VisorColorsData>();
    final textColor = colors?.textPrimary ?? Colors.white;

    return Row(
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

/// Row containing the theme dropdown (left, fills) and brightness toggle (right).
class _ThemeRow extends StatelessWidget {
  const _ThemeRow({
    required this.pairs,
    required this.brightnessNotifier,
    required this.prefs,
  });

  final List<WidgetbookTheme<VisorThemePair>> pairs;
  final ValueNotifier<ThemeMode> brightnessNotifier;
  final SharedPreferences prefs;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _ThemeDropdown(pairs: pairs)),
        const SizedBox(width: 8),
        _BrightnessToggle(
          notifier: brightnessNotifier,
          prefs: prefs,
        ),
      ],
    );
  }
}

/// Dropdown that drives the [ThemeAddon] via [WidgetbookState.updateQueryField].
///
/// Single source of truth is `WidgetbookState.queryParams['theme']`, decoded
/// via [FieldCodec]. Listening through [ListenableBuilder] keeps the dropdown
/// in sync regardless of which surface (this dropdown, the Addons tab, or
/// persistence restoration) drove the change.
class _ThemeDropdown extends StatelessWidget {
  const _ThemeDropdown({required this.pairs});

  final List<WidgetbookTheme<VisorThemePair>> pairs;

  String _currentLabel(WidgetbookState state) {
    final raw = state.queryParams['theme'];
    if (raw == null) return pairs.first.name;
    final group = FieldCodec.decodeQueryGroup(raw);
    return group['name'] ?? pairs.first.name;
  }

  @override
  Widget build(BuildContext context) {
    final state = WidgetbookState.of(context);
    final colors = Theme.of(context).extension<VisorColorsData>();
    final textColor = colors?.textPrimary ?? Colors.white;
    final tertiaryColor = colors?.textTertiary ?? Colors.white60;
    final fillColor = colors?.surfaceCard ?? Colors.white10;
    final borderColor = colors?.borderDefault ?? Colors.white12;

    return ListenableBuilder(
      listenable: state,
      builder: (ctx, _) {
        final current = _currentLabel(state);
        return Container(
          height: 36,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: fillColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor, width: 1),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: pairs.any((p) => p.name == current) ? current : pairs.first.name,
              isExpanded: true,
              isDense: true,
              icon: Icon(Icons.expand_more, size: 18, color: tertiaryColor),
              dropdownColor: colors?.surfaceOverlay ?? Colors.black,
              style: TextStyle(
                fontFamily: 'Satoshi',
                fontSize: 14,
                color: textColor,
              ),
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

  /// Builds dropdown items grouped by Visor / Custom with subtle group headers.
  List<DropdownMenuItem<String>> _buildItems(Color text, Color tertiary) {
    final items = <DropdownMenuItem<String>>[];
    String? lastGroup;
    for (final pair in pairs) {
      final group = pair.name.startsWith('Visor / ') ? 'Visor' : 'Custom';
      final display = pair.name.split(' / ').last;
      if (group != lastGroup) {
        lastGroup = group;
      }
      items.add(DropdownMenuItem<String>(
        value: pair.name,
        child: Row(
          children: [
            SizedBox(
              width: 56,
              child: Text(
                group,
                style: TextStyle(
                  fontFamily: 'Satoshi',
                  fontSize: 11,
                  color: tertiary,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            Expanded(
              child: Text(
                display,
                style: TextStyle(
                  fontFamily: 'Satoshi',
                  fontSize: 14,
                  color: text,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ));
    }
    return items;
  }
}

/// Sun/moon pill — same control that previously lived bottom-left, now inline
/// with the theme dropdown so all chrome controls cluster in the header.
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
    final fillColor = colors?.surfaceCard ?? Colors.white10;
    final borderColor = colors?.borderDefault ?? Colors.white12;

    return ValueListenableBuilder<ThemeMode>(
      valueListenable: notifier,
      builder: (ctx, mode, _) {
        final isLight = mode == ThemeMode.light;
        return Container(
          height: 36,
          decoration: BoxDecoration(
            color: fillColor,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor, width: 1),
          ),
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
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
        padding: EdgeInsets.zero,
        onPressed: onPressed,
      ),
    );
  }
}
