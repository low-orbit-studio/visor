import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_stat_card/visor_stat_card.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

@widgetbook.UseCase(name: 'Default', type: VisorStatCard)
Widget defaultUseCase(BuildContext context) => _framed(
      VisorStatCard(
        title: context.knobs.string(label: 'Title', initialValue: 'Revenue'),
        value: context.knobs.string(label: 'Value', initialValue: r'$12,430'),
      ),
    );

@widgetbook.UseCase(name: 'With Delta Up', type: VisorStatCard)
Widget deltaUpUseCase(BuildContext context) => _framed(
      VisorStatCard(
        title: context.knobs
            .string(label: 'Title', initialValue: 'Weekly active users'),
        value: context.knobs.string(label: 'Value', initialValue: '3,284'),
        delta: context.knobs.string(label: 'Delta', initialValue: '+12.4%'),
        deltaDirection: VisorDeltaDirection.up,
      ),
    );

@widgetbook.UseCase(name: 'With Delta Down', type: VisorStatCard)
Widget deltaDownUseCase(BuildContext context) => _framed(
      VisorStatCard(
        title: context.knobs.string(label: 'Title', initialValue: 'Churn rate'),
        value: context.knobs.string(label: 'Value', initialValue: '4.1%'),
        delta: context.knobs.string(label: 'Delta', initialValue: '-0.3 pp'),
        deltaDirection: VisorDeltaDirection.down,
      ),
    );

@widgetbook.UseCase(name: 'With Delta Flat', type: VisorStatCard)
Widget deltaFlatUseCase(BuildContext context) => _framed(
      VisorStatCard(
        title: context.knobs
            .string(label: 'Title', initialValue: 'Signups this week'),
        value: context.knobs.string(label: 'Value', initialValue: '0'),
        delta: context.knobs.string(label: 'Delta', initialValue: '±0'),
        deltaDirection: VisorDeltaDirection.flat,
      ),
    );

@widgetbook.UseCase(name: 'With Icon', type: VisorStatCard)
Widget iconUseCase(BuildContext context) => _framed(
      VisorStatCard(
        title: context.knobs
            .string(label: 'Title', initialValue: 'Orders today'),
        value: context.knobs.string(label: 'Value', initialValue: '42'),
        delta: '+6.5%',
        deltaDirection: VisorDeltaDirection.up,
        icon: Icons.shopping_bag_outlined,
      ),
    );

Widget _framed(Widget child) => Padding(
      padding: const EdgeInsets.all(24),
      child: SizedBox(width: 280, child: child),
    );
