import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_phone_input/visor_phone_input.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

// ---------------------------------------------------------------------------
// Default (US)
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Default', type: VisorPhoneInput)
Widget defaultUseCase(BuildContext context) => _framed(
      VisorPhoneInput(
        labelText: context.knobs.string(
          label: 'Label',
          initialValue: 'Phone number',
        ),
      ),
    );

// ---------------------------------------------------------------------------
// United Kingdom
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'United Kingdom', type: VisorPhoneInput)
Widget unitedKingdomUseCase(BuildContext context) => _framed(
      const VisorPhoneInput(
        labelText: 'Phone number',
        initialCountryCode: 'GB',
      ),
    );

// ---------------------------------------------------------------------------
// Focused (autofocus)
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Focused', type: VisorPhoneInput)
Widget focusedUseCase(BuildContext context) => _framed(
      const VisorPhoneInput(
        labelText: 'Phone number',
        autofocus: true,
      ),
    );

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Error', type: VisorPhoneInput)
Widget errorUseCase(BuildContext context) => _framed(
      VisorPhoneInput(
        labelText: 'Phone number',
        errorText: context.knobs.string(
          label: 'Error text',
          initialValue: 'Please enter a valid phone number',
        ),
      ),
    );

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Disabled', type: VisorPhoneInput)
Widget disabledUseCase(BuildContext context) => _framed(
      const VisorPhoneInput(
        labelText: 'Phone number',
        enabled: false,
      ),
    );

// ---------------------------------------------------------------------------
// Disabled with content
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Disabled With Content', type: VisorPhoneInput)
Widget disabledWithContentUseCase(BuildContext context) =>
    const _DisabledWithContentDemo();

class _DisabledWithContentDemo extends StatefulWidget {
  const _DisabledWithContentDemo();

  @override
  State<_DisabledWithContentDemo> createState() =>
      _DisabledWithContentDemoState();
}

class _DisabledWithContentDemoState extends State<_DisabledWithContentDemo> {
  late final TextEditingController _controller =
      TextEditingController(text: '5551234567');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _framed(
      VisorPhoneInput(
        labelText: 'Phone number',
        controller: _controller,
        enabled: false,
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Form integration
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Form Integration', type: VisorPhoneInput)
Widget formIntegrationUseCase(BuildContext context) => const _FormDemo();

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
        width: 360,
        child: Form(
          key: _key,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              VisorPhoneInput(
                labelText: 'Phone number',
                autovalidateMode: AutovalidateMode.onUserInteraction,
                validator: (v) =>
                    v != null && v.isNotEmpty ? null : 'Required',
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
      child: SizedBox(width: 360, child: child),
    );
