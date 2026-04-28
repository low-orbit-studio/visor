import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_back_button/visor_back_button.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Default', type: VisorBackButton)
Widget defaultUseCase(BuildContext context) => Center(
      child: VisorBackButton(
        onPressed: () {},
      ),
    );

@widgetbook.UseCase(name: 'With Custom Semantic Label', type: VisorBackButton)
Widget customLabelUseCase(BuildContext context) => Center(
      child: VisorBackButton(
        semanticLabel: context.knobs.string(
          label: 'Semantic label',
          initialValue: 'Go back to settings',
        ),
        onPressed: () {},
      ),
    );

@widgetbook.UseCase(name: 'RTL', type: VisorBackButton)
Widget rtlUseCase(BuildContext context) => Center(
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: VisorBackButton(
          onPressed: () {},
        ),
      ),
    );

@widgetbook.UseCase(name: 'In AppBar', type: VisorBackButton)
Widget inAppBarUseCase(BuildContext context) => Scaffold(
      appBar: AppBar(
        leading: VisorBackButton(onPressed: () {}),
        title: const Text('Screen Title'),
      ),
      body: const Center(child: Text('Back button in AppBar')),
    );
