import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_button/visor_button.dart';
import 'package:visor_widgetbook/widgets/visor_empty_state/visor_empty_state.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

@widgetbook.UseCase(name: 'Default', type: VisorEmptyState)
Widget defaultUseCase(BuildContext context) => VisorEmptyState(
      icon: Icons.inbox_outlined,
      headline:
          context.knobs.string(label: 'Headline', initialValue: 'No messages'),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: "You're all caught up. New messages will appear here.",
      ),
    );

@widgetbook.UseCase(name: 'Headline Only', type: VisorEmptyState)
Widget headlineOnlyUseCase(BuildContext context) => VisorEmptyState(
      icon: Icons.search_off,
      headline: context.knobs
          .string(label: 'Headline', initialValue: 'No results found'),
    );

@widgetbook.UseCase(name: 'With Action', type: VisorEmptyState)
Widget withActionUseCase(BuildContext context) => VisorEmptyState(
      icon: Icons.folder_open,
      headline:
          context.knobs.string(label: 'Headline', initialValue: 'No projects'),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: 'Create your first project to get started.',
      ),
      action: VisorButton(
        label: 'Create project',
        leadingIcon: const Icon(Icons.add),
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Long Copy', type: VisorEmptyState)
Widget longCopyUseCase(BuildContext context) => const VisorEmptyState(
      icon: Icons.wifi_off,
      headline: 'Lost connection',
      body:
          "We couldn't reach the server. Check your internet connection and try again. If the problem persists, contact support with the error code VSR-NET-001.",
    );

@widgetbook.UseCase(name: 'Compact Layout', type: VisorEmptyState)
Widget compactUseCase(BuildContext context) => VisorEmptyState(
      icon: Icons.inbox_outlined,
      headline:
          context.knobs.string(label: 'Headline', initialValue: 'No messages'),
      body: context.knobs.stringOrNull(
        label: 'Body',
        initialValue: "You're all caught up.",
      ),
      forceCompact: true,
    );

@widgetbook.UseCase(name: 'Dual Action', type: VisorEmptyState)
Widget dualActionUseCase(BuildContext context) => VisorEmptyState(
      icon: Icons.folder_open,
      headline:
          context.knobs.string(label: 'Headline', initialValue: 'No projects'),
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
    );
