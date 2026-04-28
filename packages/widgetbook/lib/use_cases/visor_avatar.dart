import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_avatar/visor_avatar.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Default (user icon)', type: VisorAvatar)
Widget defaultUseCase(BuildContext context) => _framed(
      VisorAvatar(
        radius: context.knobs.double.input(label: 'Radius', initialValue: 28),
        onTap: context.knobs.boolean(label: 'Tappable', initialValue: false)
            ? _noop
            : null,
      ),
    );

@widgetbook.UseCase(name: 'With Photo URL', type: VisorAvatar)
Widget photoUseCase(BuildContext context) => _framed(
      VisorAvatar(
        photoUrl: context.knobs.string(
          label: 'Photo URL',
          initialValue:
              'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
        ),
        radius: context.knobs.double.input(label: 'Radius', initialValue: 28),
        onTap: context.knobs.boolean(label: 'Tappable', initialValue: true)
            ? _noop
            : null,
      ),
    );

@widgetbook.UseCase(name: 'With Initials', type: VisorAvatar)
Widget initialsUseCase(BuildContext context) => _framed(
      VisorAvatar(
        name: context.knobs.string(label: 'Name', initialValue: 'Jordan Smith'),
        radius: context.knobs.double.input(label: 'Radius', initialValue: 28),
        onTap: context.knobs.boolean(label: 'Tappable', initialValue: false)
            ? _noop
            : null,
      ),
    );

@widgetbook.UseCase(name: 'Loading Overlay', type: VisorAvatar)
Widget loadingUseCase(BuildContext context) => _framed(
      VisorAvatar(
        photoUrl: context.knobs.stringOrNull(
          label: 'Photo URL',
          initialValue:
              'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200',
        ),
        radius: context.knobs.double.input(label: 'Radius', initialValue: 28),
        isLoading: context.knobs.boolean(label: 'isLoading', initialValue: true),
        onTap: _noop,
        semanticLabel: 'Change photo',
      ),
    );

@widgetbook.UseCase(name: 'Size Gallery', type: VisorAvatar)
Widget sizeGalleryUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(24),
      child: Wrap(
        spacing: 16,
        runSpacing: 16,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          const VisorAvatar(radius: 16),
          const VisorAvatar(radius: 22),
          const VisorAvatar(radius: 28),
          const VisorAvatar(radius: 36),
          const VisorAvatar(radius: 48),
          VisorAvatar(radius: 16, name: 'AB'),
          VisorAvatar(radius: 22, name: 'John Doe'),
          VisorAvatar(radius: 28, name: 'Madonna'),
          VisorAvatar(radius: 36, name: 'Tim Cook'),
          VisorAvatar(radius: 48, name: 'John Paul George'),
        ],
      ),
    );

Widget _framed(Widget child) => Padding(
      padding: const EdgeInsets.all(24),
      child: child,
    );
