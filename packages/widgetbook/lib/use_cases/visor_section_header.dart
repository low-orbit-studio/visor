import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_section_header/visor_section_header.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Default', type: VisorSectionHeader)
Widget defaultUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorSectionHeader(
        title: context.knobs
            .string(label: 'Title', initialValue: 'Recent activity'),
      ),
    );

@widgetbook.UseCase(name: 'With Subtitle', type: VisorSectionHeader)
Widget withSubtitleUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorSectionHeader(
        title:
            context.knobs.string(label: 'Title', initialValue: 'Team members'),
        subtitle: context.knobs
            .stringOrNull(label: 'Subtitle', initialValue: '12 people'),
      ),
    );

@widgetbook.UseCase(name: 'With Trailing', type: VisorSectionHeader)
Widget withTrailingUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorSectionHeader(
        title:
            context.knobs.string(label: 'Title', initialValue: 'Latest orders'),
        subtitle: context.knobs
            .stringOrNull(label: 'Subtitle', initialValue: 'Updated just now'),
        trailing: TextButton(
          onPressed: _noop,
          child: const Text('View all'),
        ),
      ),
    );

@widgetbook.UseCase(name: 'With Badge', type: VisorSectionHeader)
Widget withBadgeUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorSectionHeader(
        title: 'Notifications',
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.error,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Text(
            '3',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onError,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
