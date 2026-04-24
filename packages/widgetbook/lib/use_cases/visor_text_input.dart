import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_text_input/visor_text_input.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

// ---------------------------------------------------------------------------
// Default state
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Default', type: VisorTextInput)
Widget defaultUseCase(BuildContext context) => _framed(
      VisorTextInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Email address',
        ),
      ),
    );

// ---------------------------------------------------------------------------
// Focused state — achieved by autofocus in widgetbook preview
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Focused', type: VisorTextInput)
Widget focusedUseCase(BuildContext context) => _framed(
      VisorTextInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Email address',
        ),
        autofocus: true,
      ),
    );

// ---------------------------------------------------------------------------
// With prefix icon
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'With Prefix Icon', type: VisorTextInput)
Widget prefixIconUseCase(BuildContext context) => _framed(
      VisorTextInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Search',
        ),
        prefixIcon: const Icon(Icons.search),
      ),
    );

// ---------------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Error', type: VisorTextInput)
Widget errorUseCase(BuildContext context) => _framed(
      VisorTextInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Email address',
        ),
        errorText: context.knobs.string(
          label: 'Error text',
          initialValue: 'Please enter a valid email address',
        ),
      ),
    );

// ---------------------------------------------------------------------------
// Valid state — validator always passes when field has content
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Valid', type: VisorTextInput)
Widget validUseCase(BuildContext context) {
  final controller = TextEditingController(text: 'hello@example.com');
  return _framed(
    VisorTextInput(
      labelText: context.knobs.string(
        label: 'Label',
        initialValue: 'Email address',
      ),
      controller: controller,
      validator: (v) =>
          v != null && v.contains('@') ? null : 'Invalid email',
    ),
  );
}

// ---------------------------------------------------------------------------
// Valid — explicit isValid override (async scenario)
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Valid (isValid override)', type: VisorTextInput)
Widget isValidOverrideUseCase(BuildContext context) {
  final controller =
      TextEditingController(text: 'uniqueuser42');
  return _framed(
    VisorTextInput(
      labelText: context.knobs.string(
        label: 'Label',
        initialValue: 'Username',
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

@widgetbook.UseCase(name: 'Disabled', type: VisorTextInput)
Widget disabledUseCase(BuildContext context) => _framed(
      VisorTextInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Email address',
        ),
        enabled: false,
      ),
    );

// ---------------------------------------------------------------------------
// Disabled with content
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Disabled With Content', type: VisorTextInput)
Widget disabledWithContentUseCase(BuildContext context) {
  final controller =
      TextEditingController(text: 'readonly@example.com');
  return _framed(
    VisorTextInput(
      labelText: context.knobs.string(
        label: 'Label',
        initialValue: 'Email address',
      ),
      controller: controller,
      enabled: false,
    ),
  );
}

// ---------------------------------------------------------------------------
// Full form integration demo
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Form Integration', type: VisorTextInput)
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
  String _result = '';

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
              VisorTextInput(
                labelText: 'Email',
                keyboardType: TextInputType.emailAddress,
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: (v) =>
                    v != null && v.contains('@')
                        ? null
                        : 'Enter a valid email',
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
