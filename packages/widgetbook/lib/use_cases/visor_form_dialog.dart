import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_form_dialog/visor_form_dialog.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Default', type: VisorFormDialog)
Widget defaultUseCase(BuildContext context) {
  return _showDialogFrame(
    context,
    VisorFormDialog(
      child: _DemoForm(
        title: context.knobs.string(
          label: 'Title',
          initialValue: 'Edit profile',
        ),
      ),
    ),
  );
}

@widgetbook.UseCase(name: 'Custom Max Width', type: VisorFormDialog)
Widget customMaxWidthUseCase(BuildContext context) {
  final maxWidth = context.knobs.double.input(
    label: 'Max Width',
    initialValue: 360,
  );
  return _showDialogFrame(
    context,
    VisorFormDialog(
      maxWidth: maxWidth,
      child: const _DemoForm(title: 'Narrow dialog'),
    ),
  );
}

@widgetbook.UseCase(name: 'Custom Padding', type: VisorFormDialog)
Widget customPaddingUseCase(BuildContext context) {
  return _showDialogFrame(
    context,
    const VisorFormDialog(
      padding: EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: _DemoForm(title: 'Custom padding'),
    ),
  );
}

/// Opens the dialog so widgetbook renders it over a neutral backdrop.
Widget _showDialogFrame(BuildContext context, VisorFormDialog dialog) {
  return Scaffold(
    body: Center(
      child: Builder(
        builder: (ctx) => FilledButton(
          onPressed: () => showDialog<void>(
            context: ctx,
            builder: (_) => dialog,
          ),
          child: const Text('Open form dialog'),
        ),
      ),
    ),
  );
}

/// Minimal placeholder form used across all use cases.
class _DemoForm extends StatelessWidget {
  const _DemoForm({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 16),
        const TextField(
          decoration: InputDecoration(labelText: 'Name'),
        ),
        const SizedBox(height: 12),
        const TextField(
          decoration: InputDecoration(labelText: 'Email'),
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () {},
          child: const Text('Save'),
        ),
      ],
    );
  }
}
