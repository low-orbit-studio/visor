import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_settings_tile/visor_settings_tile.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Default', type: VisorSettingsTile)
Widget defaultUseCase(BuildContext context) => _framed(
      VisorSettingsTile(
        icon: Icons.person_outline,
        label: context.knobs.string(label: 'Label', initialValue: 'Account'),
        onTap: _noop,
      ),
    );

@widgetbook.UseCase(name: 'With Subtitle', type: VisorSettingsTile)
Widget withSubtitleUseCase(BuildContext context) => _framed(
      VisorSettingsTile(
        icon: Icons.notifications_outlined,
        label:
            context.knobs.string(label: 'Label', initialValue: 'Notifications'),
        subtitle: context.knobs.string(
          label: 'Subtitle',
          initialValue: 'Manage alerts and push notifications',
        ),
        onTap: _noop,
      ),
    );

@widgetbook.UseCase(name: 'With Switch Trailing', type: VisorSettingsTile)
Widget withSwitchTrailingUseCase(BuildContext context) {
  final enabled =
      context.knobs.boolean(label: 'Switch enabled', initialValue: true);
  return _framed(
    VisorSettingsTile(
      icon: Icons.dark_mode_outlined,
      label: 'Dark mode',
      trailing: Switch(value: enabled, onChanged: (_) {}),
      onTap: null,
    ),
  );
}

@widgetbook.UseCase(name: 'Destructive', type: VisorSettingsTile)
Widget destructiveUseCase(BuildContext context) => _framed(
      VisorSettingsTile(
        icon: Icons.logout,
        label:
            context.knobs.string(label: 'Label', initialValue: 'Sign out'),
        destructive: true,
        onTap: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Selected', type: VisorSettingsTile)
Widget selectedUseCase(BuildContext context) => _framed(
      VisorSettingsTile(
        icon: Icons.person_outline,
        label: context.knobs.string(label: 'Label', initialValue: 'Account'),
        subtitle: context.knobs.stringOrNull(
          label: 'Subtitle',
          initialValue: 'Currently viewing',
        ),
        selected: true,
        onTap: _noop,
      ),
    );

Widget _framed(Widget child) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
      child: child,
    );
