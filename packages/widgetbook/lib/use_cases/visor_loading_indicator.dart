import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_loading_indicator/visor_loading_indicator.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Immediate', type: VisorLoadingIndicator)
Widget immediateUseCase(BuildContext context) => Center(
      child: VisorLoadingIndicator(
        size: context.knobs.double.slider(
          label: 'Size',
          initialValue: 24.0,
          min: 16.0,
          max: 64.0,
        ),
      ),
    );

@widgetbook.UseCase(name: 'Delayed', type: VisorLoadingIndicator)
Widget delayedUseCase(BuildContext context) {
  final delayMs = context.knobs.double.slider(
    label: 'Delay (ms)',
    initialValue: 300.0,
    min: 0.0,
    max: 2000.0,
  );
  return Center(
    child: VisorLoadingIndicator(
      delay: Duration(milliseconds: delayMs.toInt()),
    ),
  );
}

@widgetbook.UseCase(name: 'Sized', type: VisorLoadingIndicator)
Widget sizedUseCase(BuildContext context) => Center(
      child: VisorLoadingIndicator(
        size: context.knobs.double.slider(
          label: 'Size',
          initialValue: 48.0,
          min: 16.0,
          max: 96.0,
        ),
      ),
    );

@widgetbook.UseCase(name: 'Custom Color', type: VisorLoadingIndicator)
Widget customColorUseCase(BuildContext context) => Center(
      child: VisorLoadingIndicator(
        size: 32.0,
        color: context.knobs.color(
          label: 'Color',
          initialValue: const Color(0xFFEF4444),
        ),
      ),
    );

@widgetbook.UseCase(name: 'Reduce Motion (static)', type: VisorLoadingIndicator)
Widget reduceMotionUseCase(BuildContext context) => Center(
      child: MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: true),
        child: const VisorLoadingIndicator(size: 32.0),
      ),
    );
