import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_loading_dots/visor_loading_dots.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Default', type: VisorLoadingDots)
Widget defaultUseCase(BuildContext context) => Center(
      child: const VisorLoadingDots(),
    );

@widgetbook.UseCase(name: 'Large Dots', type: VisorLoadingDots)
Widget largeDotUseCase(BuildContext context) => Center(
      child: VisorLoadingDots(
        dotSize: context.knobs.double.slider(
          label: 'Dot Size',
          initialValue: 16.0,
          min: 6.0,
          max: 32.0,
        ),
      ),
    );

@widgetbook.UseCase(name: 'Small Dots', type: VisorLoadingDots)
Widget smallDotUseCase(BuildContext context) => const Center(
      child: VisorLoadingDots(dotSize: 6.0),
    );

@widgetbook.UseCase(name: 'Custom Colors', type: VisorLoadingDots)
Widget customColorsUseCase(BuildContext context) => Center(
      child: VisorLoadingDots(
        colorStart: context.knobs.color(
          label: 'Color Start',
          initialValue: const Color(0xFFBFDBFE),
        ),
        colorMid: context.knobs.color(
          label: 'Color Mid',
          initialValue: const Color(0xFF3B82F6),
        ),
        colorEnd: context.knobs.color(
          label: 'Color End',
          initialValue: const Color(0xFF1D4ED8),
        ),
      ),
    );

@widgetbook.UseCase(name: 'Reduce Motion (static)', type: VisorLoadingDots)
Widget reduceMotionUseCase(BuildContext context) => Center(
      child: MediaQuery(
        data: MediaQuery.of(context).copyWith(disableAnimations: true),
        child: const VisorLoadingDots(),
      ),
    );

@widgetbook.UseCase(name: 'With Semantic Label', type: VisorLoadingDots)
Widget semanticLabelUseCase(BuildContext context) => const Center(
      child: VisorLoadingDots(semanticLabel: 'Loading'),
    );
