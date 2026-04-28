import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_password_input/visor_password_input.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Default', type: VisorPasswordInput)
Widget defaultUseCase(BuildContext context) => _framed(
      VisorPasswordInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Password',
        ),
      ),
    );

// ---------------------------------------------------------------------------
// Focused state — achieved by autofocus in widgetbook preview
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Focused', type: VisorPasswordInput)
Widget focusedUseCase(BuildContext context) => _framed(
      VisorPasswordInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Password',
        ),
        autofocus: true,
      ),
    );

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Error', type: VisorPasswordInput)
Widget errorUseCase(BuildContext context) => _framed(
      VisorPasswordInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Password',
        ),
        errorText: context.knobs.string(
          label: 'Error text',
          initialValue: 'Password must be at least 8 characters',
        ),
      ),
    );

// ---------------------------------------------------------------------------
// Valid state — validator always passes when field has content
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Valid', type: VisorPasswordInput)
Widget validUseCase(BuildContext context) {
  final controller = TextEditingController(text: 'S3cur3P@ssw0rd');
  return _framed(
    VisorPasswordInput(
      labelText: context.knobs.string(
        label: 'Label',
        initialValue: 'Password',
      ),
      controller: controller,
      validator: (v) =>
          v != null && v.length >= 8 ? null : 'Minimum 8 characters',
    ),
  );
}

// ---------------------------------------------------------------------------
// Valid — explicit isValid override (async scenario)
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Valid (isValid override)', type: VisorPasswordInput)
Widget isValidOverrideUseCase(BuildContext context) {
  final controller = TextEditingController(text: 'hunter2');
  return _framed(
    VisorPasswordInput(
      labelText: context.knobs.string(
        label: 'Label',
        initialValue: 'Password',
      ),
      controller: controller,
      isValid: context.knobs.boolean(
        label: 'isValid',
        initialValue: true,
      ),
      validator: (_) => null,
    ),
  );
}

// ---------------------------------------------------------------------------
// Disabled state
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Disabled', type: VisorPasswordInput)
Widget disabledUseCase(BuildContext context) => _framed(
      VisorPasswordInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Password',
        ),
        enabled: false,
      ),
    );

// ---------------------------------------------------------------------------
// Disabled with content
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Disabled With Content', type: VisorPasswordInput)
Widget disabledWithContentUseCase(BuildContext context) {
  final controller = TextEditingController(text: 'hunter2');
  return _framed(
    VisorPasswordInput(
      labelText: context.knobs.string(
        label: 'Label',
        initialValue: 'Password',
      ),
      controller: controller,
      enabled: false,
    ),
  );
}

// ---------------------------------------------------------------------------
// Full form integration demo
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Form Integration', type: VisorPasswordInput)
Widget formIntegrationUseCase(BuildContext context) {
  return const _FormDemo();
}

class _FormDemo extends StatefulWidget {
  const _FormDemo();

  @override
  State<_FormDemo> createState() => _FormDemoState();
}

class _FormDemoState extends State<_FormDemo> {
  final _key = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  String _result = '';

  @override
  void dispose() {
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: SizedBox(
        width: 320,
        child: Form(
          key: _key,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              VisorPasswordInput(
                labelText: 'Password',
                controller: _passwordController,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: (v) =>
                    v != null && v.length >= 8
                        ? null
                        : 'Minimum 8 characters',
              ),
              const SizedBox(height: 16),
              VisorPasswordInput(
                labelText: 'Confirm password',
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: (v) =>
                    v == _passwordController.text
                        ? null
                        : 'Passwords must match',
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  final valid = _key.currentState!.validate();
                  setState(() => _result = valid ? 'Valid!' : 'Invalid');
                },
                child: const Text('Submit'),
              ),
              if (_result.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(_result),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

Widget _framed(Widget child) => Padding(
      padding: const EdgeInsets.all(24),
      child: SizedBox(width: 320, child: child),
    );
