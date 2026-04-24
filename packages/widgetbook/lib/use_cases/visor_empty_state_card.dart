import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_button/visor_button.dart';
import 'package:visor_widgetbook/widgets/visor_empty_state_card/visor_empty_state_card.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Default', type: VisorEmptyStateCard)
Widget defaultUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: context.knobs
            .string(label: 'Headline', initialValue: 'No messages'),
        body: context.knobs.stringOrNull(
          label: 'Body',
          initialValue: "You're all caught up.",
        ),
      ),
    );

@widgetbook.UseCase(name: 'With Action', type: VisorEmptyStateCard)
Widget withActionUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorEmptyStateCard(
        icon: Icons.folder_open,
        headline: context.knobs
            .string(label: 'Headline', initialValue: 'No projects'),
        body: context.knobs.stringOrNull(
          label: 'Body',
          initialValue: 'Create your first project to get started.',
        ),
        action: VisorButton(
          label: 'Create project',
          leadingIcon: const Icon(Icons.add),
          onPressed: _noop,
        ),
      ),
    );

@widgetbook.UseCase(name: 'Dual Action', type: VisorEmptyStateCard)
Widget dualActionUseCase(BuildContext context) => Padding(
      padding: const EdgeInsets.all(16),
      child: VisorEmptyStateCard(
        icon: Icons.folder_open,
        headline: context.knobs
            .string(label: 'Headline', initialValue: 'No projects'),
        body: context.knobs.stringOrNull(
          label: 'Body',
          initialValue: 'Create your first project or import an existing one.',
        ),
        action: VisorButton(
          label: 'Create project',
          leadingIcon: const Icon(Icons.add),
          onPressed: _noop,
        ),
        secondaryAction: VisorButton(
          label: 'Import existing',
          style: VisorButtonStyle.secondary,
          onPressed: _noop,
        ),
      ),
    );
