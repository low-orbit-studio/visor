import 'package:flutter/material.dart';
import 'package:visor_widgetbook/widgets/visor_chip_search_input/visor_chip_search_input.dart';
import 'package:widgetbook/widgetbook.dart';
import 'package:widgetbook_annotation/widgetbook_annotation.dart' as widgetbook;

// ---------------------------------------------------------------------------
// Demo item type
// ---------------------------------------------------------------------------

class _Tag {
  const _Tag(this.id, this.label);
  final String id;
  final String label;
}

const _allTags = [
  _Tag('modern', 'Modern'),
  _Tag('minimal', 'Minimal'),
  _Tag('bold', 'Bold'),
  _Tag('classic', 'Classic'),
  _Tag('eclectic', 'Eclectic'),
];

// ---------------------------------------------------------------------------
// Empty state — no chips
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Empty', type: VisorChipSearchInput)
Widget emptyUseCase(BuildContext context) => _framed(
      VisorChipSearchInput<_Tag>(
        selectedItems: const [],
        labelBuilder: (tag) => tag.label,
        hintText: context.knobs.string(
          label: 'Hint text',
          initialValue: 'Search styles...',
        ),
        onQueryChanged: (_) {},
        onItemRemoved: (_) {},
      ),
    );

// ---------------------------------------------------------------------------
// With chips
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'With chips', type: VisorChipSearchInput)
Widget withChipsUseCase(BuildContext context) => _framed(
      VisorChipSearchInput<_Tag>(
        selectedItems: const [
          _Tag('modern', 'Modern'),
          _Tag('minimal', 'Minimal'),
        ],
        labelBuilder: (tag) => tag.label,
        hintText: 'Search styles...',
        onQueryChanged: (_) {},
        onItemRemoved: (_) {},
      ),
    );

// ---------------------------------------------------------------------------
// Many chips
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Many chips', type: VisorChipSearchInput)
Widget manyChipsUseCase(BuildContext context) => _framed(
      VisorChipSearchInput<_Tag>(
        selectedItems: _allTags,
        labelBuilder: (tag) => tag.label,
        hintText: 'Search styles...',
        onQueryChanged: (_) {},
        onItemRemoved: (_) {},
      ),
    );

// ---------------------------------------------------------------------------
// Disabled
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Disabled', type: VisorChipSearchInput)
Widget disabledUseCase(BuildContext context) => _framed(
      VisorChipSearchInput<_Tag>(
        selectedItems: const [_Tag('modern', 'Modern')],
        labelBuilder: (tag) => tag.label,
        hintText: 'Search styles...',
        onQueryChanged: (_) {},
        onItemRemoved: (_) {},
        enabled: false,
      ),
    );

// ---------------------------------------------------------------------------
// Interactive demo — add and remove chips
// ---------------------------------------------------------------------------

@widgetbook.UseCase(name: 'Interactive', type: VisorChipSearchInput)
Widget interactiveUseCase(BuildContext context) => const _InteractiveDemo();

class _InteractiveDemo extends StatefulWidget {
  const _InteractiveDemo();

  @override
  State<_InteractiveDemo> createState() => _InteractiveDemoState();
}

class _InteractiveDemoState extends State<_InteractiveDemo> {
  final List<_Tag> _selected = [];
  String _query = '';

  List<_Tag> get _suggestions => _allTags
      .where(
        (t) =>
            !_selected.any((s) => s.id == t.id) &&
            t.label.toLowerCase().contains(_query.toLowerCase()),
      )
      .toList();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 360,
            child: VisorChipSearchInput<_Tag>(
              selectedItems: _selected,
              labelBuilder: (tag) => tag.label,
              hintText: 'Search styles...',
              onQueryChanged: (q) => setState(() => _query = q),
              onItemRemoved: (tag) =>
                  setState(() => _selected.removeWhere((t) => t.id == tag.id)),
            ),
          ),
          if (_suggestions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _suggestions
                  .map(
                    (tag) => ActionChip(
                      label: Text(tag.label),
                      onPressed: () =>
                          setState(() => _selected.add(tag)),
                    ),
                  )
                  .toList(),
            ),
          ],
        ],
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
