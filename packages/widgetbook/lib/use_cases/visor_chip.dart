import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_chip/visor_chip.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

void _noop() {}

VisorChipSize _sizeKnob(BuildContext context) =>
    context.knobs.object.dropdown(
      label: 'Size',
      options: VisorChipSize.values,
      initialOption: VisorChipSize.md,
      labelBuilder: (s) => s.name,
    );

@widgetbook.UseCase(name: 'Suggestion — Unselected', type: VisorChip)
Widget suggestionUnselectedUseCase(BuildContext context) => Center(
      child: VisorChip(
        label: context.knobs.string(label: 'Label', initialValue: 'Modern'),
        variant: VisorChipVariant.suggestion,
        size: _sizeKnob(context),
        isSelected: false,
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Suggestion — Selected', type: VisorChip)
Widget suggestionSelectedUseCase(BuildContext context) => Center(
      child: VisorChip(
        label: context.knobs.string(label: 'Label', initialValue: 'Modern'),
        variant: VisorChipVariant.suggestion,
        size: _sizeKnob(context),
        isSelected: true,
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Filter — Unselected', type: VisorChip)
Widget filterUnselectedUseCase(BuildContext context) => Center(
      child: VisorChip(
        label:
            context.knobs.string(label: 'Label', initialValue: 'Minimalist'),
        variant: VisorChipVariant.filter,
        size: _sizeKnob(context),
        isSelected: false,
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Filter — Selected', type: VisorChip)
Widget filterSelectedUseCase(BuildContext context) => Center(
      child: VisorChip(
        label:
            context.knobs.string(label: 'Label', initialValue: 'Minimalist'),
        variant: VisorChipVariant.filter,
        size: _sizeKnob(context),
        isSelected: true,
        onPressed: _noop,
      ),
    );

@widgetbook.UseCase(name: 'Suggestion Group', type: VisorChip)
Widget suggestionGroupUseCase(BuildContext context) {
  final labels = ['Modern', 'Classic', 'Minimal', 'Bold', 'Eclectic'];
  final selectedLabel =
      context.knobs.object.dropdown<String>(
    label: 'Selected',
    options: labels,
    initialOption: 'Modern',
    labelBuilder: (s) => s,
  );
  return Center(
    child: Wrap(
      spacing: 8,
      runSpacing: 8,
      children: labels
          .map(
            (l) => VisorChip(
              label: l,
              variant: VisorChipVariant.suggestion,
              isSelected: l == selectedLabel,
              onPressed: _noop,
            ),
          )
          .toList(),
    ),
  );
}

@widgetbook.UseCase(name: 'Filter Group', type: VisorChip)
Widget filterGroupUseCase(BuildContext context) {
  final labels = ['All', 'Tops', 'Bottoms', 'Shoes', 'Accessories'];
  final selectedLabel =
      context.knobs.object.dropdown<String>(
    label: 'Selected',
    options: labels,
    initialOption: 'All',
    labelBuilder: (s) => s,
  );
  return Center(
    child: Wrap(
      spacing: 8,
      runSpacing: 8,
      children: labels
          .map(
            (l) => VisorChip(
              label: l,
              variant: VisorChipVariant.filter,
              isSelected: l == selectedLabel,
              onPressed: _noop,
            ),
          )
          .toList(),
    ),
  );
}

@widgetbook.UseCase(name: 'Disabled', type: VisorChip)
Widget disabledUseCase(BuildContext context) => Center(
      child: VisorChip(
        label: context.knobs.string(label: 'Label', initialValue: 'Unavailable'),
        onPressed: null,
      ),
    );
