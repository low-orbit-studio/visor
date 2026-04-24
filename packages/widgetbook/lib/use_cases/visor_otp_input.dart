import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_otp_input/visor_otp_input.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Default', type: VisorOtpInput)
Widget defaultUseCase(BuildContext context) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: VisorOtpInput(
          digitCount: context.knobs.object.dropdown(
            label: 'Digit Count',
            options: const [4, 6],
            initialOption: 6,
            labelBuilder: (n) => '$n digits',
          ),
          onCodeComplete: (_) {},
          onCodeChanged: (_) {},
        ),
      ),
    );

@widgetbook.UseCase(name: 'Disabled', type: VisorOtpInput)
Widget disabledUseCase(BuildContext context) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: VisorOtpInput(
          digitCount: 6,
          enabled: false,
          onCodeComplete: (_) {},
        ),
      ),
    );

@widgetbook.UseCase(name: '4 Digits', type: VisorOtpInput)
Widget fourDigitUseCase(BuildContext context) => Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: VisorOtpInput(
          digitCount: 4,
          onCodeComplete: (_) {},
          onCodeChanged: (_) {},
        ),
      ),
    );
