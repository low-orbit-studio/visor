import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_snack_bar/visor_snack_bar.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Success', type: VisorSnackBar)
Widget successUseCase(BuildContext context) {
  final message = context.knobs.string(
    label: 'Message',
    initialValue: 'Changes saved successfully',
  );
  final actionLabel = context.knobs.stringOrNull(
    label: 'Action label',
    initialValue: null,
  );

  return _Trigger(
    label: 'Show success snack bar',
    onTap: (ctx) => VisorSnackBar.success(
      ctx,
      message,
      actionLabel: actionLabel,
    ),
  );
}

@widgetbook.UseCase(name: 'Error', type: VisorSnackBar)
Widget errorUseCase(BuildContext context) {
  final message = context.knobs.string(
    label: 'Message',
    initialValue: 'Upload failed — please try again',
  );
  final actionLabel = context.knobs.stringOrNull(
    label: 'Action label',
    initialValue: 'Retry',
  );

  return _Trigger(
    label: 'Show error snack bar',
    onTap: (ctx) => VisorSnackBar.error(
      ctx,
      message,
      actionLabel: actionLabel,
    ),
  );
}

@widgetbook.UseCase(name: 'Standard', type: VisorSnackBar)
Widget standardUseCase(BuildContext context) {
  final message = context.knobs.string(
    label: 'Message',
    initialValue: 'Syncing your data…',
  );
  final actionLabel = context.knobs.stringOrNull(
    label: 'Action label',
    initialValue: null,
  );

  return _Trigger(
    label: 'Show standard snack bar',
    onTap: (ctx) => VisorSnackBar.standard(
      ctx,
      message,
      actionLabel: actionLabel,
    ),
  );
}

/// A full-screen scaffold shell with a centred trigger button.
///
/// [VisorSnackBar]'s static helpers require a [ScaffoldMessenger] in scope —
/// this widget provides one via the [Scaffold] it wraps the button in.
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
