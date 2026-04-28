import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_confirm_sheet/visor_confirm_sheet.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Standard', type: VisorConfirmSheet)
Widget standardUseCase(BuildContext context) {
  final title = context.knobs.string(
    label: 'Title',
    initialValue: 'Archive project',
  );
  final message = context.knobs.string(
    label: 'Message',
    initialValue:
        'This project will be archived and hidden from your dashboard.',
  );
  final confirmLabel = context.knobs.string(
    label: 'Confirm label',
    initialValue: 'Archive',
  );
  final cancelLabel = context.knobs.string(
    label: 'Cancel label',
    initialValue: 'Cancel',
  );

  return _Trigger(
    label: 'Show standard sheet',
    onTap: (ctx) => VisorConfirmSheet.show(
      context: ctx,
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      variant: VisorConfirmSheetVariant.standard,
      onConfirm: () {},
    ),
  );
}

@widgetbook.UseCase(name: 'Destructive', type: VisorConfirmSheet)
Widget destructiveUseCase(BuildContext context) {
  final title = context.knobs.string(
    label: 'Title',
    initialValue: 'Delete account',
  );
  final message = context.knobs.string(
    label: 'Message',
    initialValue: 'This action is permanent and cannot be undone.',
  );
  final confirmLabel = context.knobs.string(
    label: 'Confirm label',
    initialValue: 'Delete account',
  );

  return _Trigger(
    label: 'Show destructive sheet',
    onTap: (ctx) => VisorConfirmSheet.show(
      context: ctx,
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      variant: VisorConfirmSheetVariant.destructive,
      onConfirm: () {},
    ),
  );
}

@widgetbook.UseCase(name: 'Inline (no presenter)', type: VisorConfirmSheet)
Widget inlineUseCase(BuildContext context) {
  final variant = context.knobs.object.dropdown<VisorConfirmSheetVariant>(
    label: 'Variant',
    options: VisorConfirmSheetVariant.values,
    initialOption: VisorConfirmSheetVariant.standard,
    labelBuilder: (v) => v.name,
  );
  final title = context.knobs.string(
    label: 'Title',
    initialValue: 'Confirm action',
  );
  final message = context.knobs.string(
    label: 'Message',
    initialValue: 'Are you sure you want to proceed?',
  );
  final confirmLabel = context.knobs.string(
    label: 'Confirm label',
    initialValue: 'Confirm',
  );
  final cancelLabel = context.knobs.string(
    label: 'Cancel label',
    initialValue: 'Cancel',
  );

  return _framed(
    VisorConfirmSheet(
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      variant: variant,
      onConfirm: () {},
    ),
  );
}

/// A full-screen scaffold shell with a centred trigger button.
///
/// [VisorConfirmSheet.show] requires a [Navigator] in scope — this widget
/// provides one via the [Scaffold] + [MaterialApp] wrapper supplied by
/// Widgetbook itself. We just need a [Builder] to obtain a child [BuildContext]
/// below the [Navigator].
class _Trigger extends StatelessWidget {
  const _Trigger({required this.label, required this.onTap});

  final String label;
  final void Function(BuildContext ctx) onTap;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ElevatedButton(
          onPressed: () => onTap(context),
          child: Text(label),
        ),
      ),
    );
  }
}

Widget _framed(Widget child) => Padding(
      padding: const EdgeInsets.all(24),
      child: SizedBox(width: 360, child: child),
    );
