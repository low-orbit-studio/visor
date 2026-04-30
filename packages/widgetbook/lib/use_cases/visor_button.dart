import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_button/visor_button.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Primary', type: VisorButton)
Widget primaryUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: context.knobs.string(label: 'Label', initialValue: 'Continue'),
        size: _sizeKnob(context),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Secondary', type: VisorButton)
Widget secondaryUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: context.knobs.string(label: 'Label', initialValue: 'Cancel'),
        style: VisorButtonStyle.secondary,
        size: _sizeKnob(context),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Ghost', type: VisorButton)
Widget ghostUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: context.knobs.string(label: 'Label', initialValue: 'Learn more'),
        style: VisorButtonStyle.ghost,
        size: _sizeKnob(context),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Destructive', type: VisorButton)
Widget destructiveUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: context.knobs
            .string(label: 'Label', initialValue: 'Delete account'),
        style: VisorButtonStyle.destructive,
        size: _sizeKnob(context),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Loading', type: VisorButton)
Widget loadingUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: 'Saving…',
        isLoading: context.knobs.boolean(label: 'isLoading', initialValue: true),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'With Leading Icon', type: VisorButton)
Widget leadingIconUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: context.knobs.string(label: 'Label', initialValue: 'Add item'),
        leadingIcon: const Icon(Icons.add),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'With Trailing Icon', type: VisorButton)
Widget trailingIconUseCase(BuildContext context) => Center(
      child: VisorButton(
        label: context.knobs.string(label: 'Label', initialValue: 'Continue'),
        trailingIcon: const Icon(Icons.arrow_forward),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Full Width', type: VisorButton)
Widget fullWidthUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(24),
      child: VisorButton(
        label: context.knobs.string(label: 'Label', initialValue: 'Submit'),
        width: VisorButtonWidth.full,
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Disabled', type: VisorButton)
Widget disabledUseCase(BuildContext context) => const Center(
      child: VisorButton(
        label: 'Disabled',
        onPressed: null,
      ),
    );

VisorButtonSize _sizeKnob(BuildContext context) => context.knobs.object.dropdown(
      label: 'Size',
      options: VisorButtonSize.values,
      initialOption: VisorButtonSize.md,
      labelBuilder: (s) => s.name,
    );
