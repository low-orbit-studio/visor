import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_chip_search_input.dart';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/// A simple test item type — validates the generic `<T>` type parameter works
/// with any consumer-defined model.
class _TestItem {
  const _TestItem({required this.id, required this.label});
  final String id;
  final String label;
}

const _item1 = _TestItem(id: 'a', label: 'Flutter');
const _item2 = _TestItem(id: 'b', label: 'Dart');
const _item3 = _TestItem(id: 'c', label: 'Visor');

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: Center(child: child)),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('VisorChipSearchInput', () {
    // -----------------------------------------------------------------------
    // Smoke render
    // -----------------------------------------------------------------------

    testWidgets('renders with no selected items', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      expect(find.byType(VisorChipSearchInput<_TestItem>), findsOneWidget);
      expect(find.text('Search...'), findsOneWidget);
    });

    testWidgets('renders chips for each selected item', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1, _item2],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      expect(find.text('Flutter'), findsOneWidget);
      expect(find.text('Dart'), findsOneWidget);
    });

    testWidgets('hides hint when chips are present', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      final tf = tester.widget<TextField>(find.byType(TextField));
      expect(tf.decoration?.hintText, isEmpty);
    });

    // -----------------------------------------------------------------------
    // Generic type parameter
    // -----------------------------------------------------------------------

    testWidgets('works with a String type parameter', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<String>(
            selectedItems: const ['one', 'two'],
            labelBuilder: (s) => s,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      expect(find.text('one'), findsOneWidget);
      expect(find.text('two'), findsOneWidget);
    });

    testWidgets('works with an int type parameter', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<int>(
            selectedItems: const [42, 7],
            labelBuilder: (n) => '#$n',
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      expect(find.text('#42'), findsOneWidget);
      expect(find.text('#7'), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // Text input behaviour
    // -----------------------------------------------------------------------

    testWidgets('calls onQueryChanged when text is entered', (tester) async {
      String? captured;
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (q) => captured = q,
            onItemRemoved: (_) {},
          ),
        ),
      );
      await tester.enterText(find.byType(TextField), 'flutter');
      await tester.pump();
      expect(captured, 'flutter');
    });

    testWidgets('clear button appears after text is entered', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );

      await tester.enterText(find.byType(TextField), 'dart');
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.widgetWithIcon(IconButton, Icons.close), findsOneWidget);
    });

    testWidgets('clear button clears text and calls onQueryChanged', (tester) async {
      String? captured;

      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (q) => captured = q,
            onItemRemoved: (_) {},
          ),
        ),
      );

      await tester.enterText(find.byType(TextField), 'dart');
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      await tester.tap(find.widgetWithIcon(IconButton, Icons.close));
      await tester.pump();

      expect(captured, '');
      final tf = tester.widget<TextField>(find.byType(TextField));
      expect(tf.controller?.text, isEmpty);
    });

    // -----------------------------------------------------------------------
    // Chip removal
    // -----------------------------------------------------------------------

    testWidgets('calls onItemRemoved when chip remove button is tapped',
        (tester) async {
      _TestItem? removed;

      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (item) => removed = item,
          ),
        ),
      );

      // Semantics button for "Remove Flutter"
      final removeBtn = find.byWidgetPredicate(
        (w) =>
            w is Semantics &&
            (w.properties.button ?? false) &&
            (w.properties.label?.contains('Remove Flutter') ?? false),
      );
      expect(removeBtn, findsOneWidget);
      await tester.tap(removeBtn);
      await tester.pump();
      expect(removed, _item1);
    });

    testWidgets('backspace on empty field removes the last chip', (tester) async {
      _TestItem? removed;
      final controller = TextEditingController();

      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1, _item2],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            controller: controller,
            onQueryChanged: (_) {},
            onItemRemoved: (item) => removed = item,
          ),
        ),
      );

      await tester.tap(find.byType(TextField));
      await tester.pumpAndSettle();
      await tester.sendKeyEvent(LogicalKeyboardKey.backspace);
      await tester.pumpAndSettle();

      expect(removed, _item2);
      controller.dispose();
    });

    testWidgets('backspace with text in field does NOT remove a chip',
        (tester) async {
      _TestItem? removed;
      final controller = TextEditingController(text: 'hello');

      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            controller: controller,
            onQueryChanged: (_) {},
            onItemRemoved: (item) => removed = item,
          ),
        ),
      );

      await tester.tap(find.byType(TextField));
      await tester.pumpAndSettle();
      await tester.sendKeyEvent(LogicalKeyboardKey.backspace);
      await tester.pumpAndSettle();

      expect(removed, isNull);
      controller.dispose();
    });

    testWidgets('backspace on empty field with no chips is a no-op',
        (tester) async {
      var called = false;
      final controller = TextEditingController();

      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            controller: controller,
            onQueryChanged: (_) {},
            onItemRemoved: (_) => called = true,
          ),
        ),
      );

      await tester.tap(find.byType(TextField));
      await tester.pumpAndSettle();
      await tester.sendKeyEvent(LogicalKeyboardKey.backspace);
      await tester.pumpAndSettle();

      expect(called, isFalse);
      controller.dispose();
    });

    // -----------------------------------------------------------------------
    // Auto-clear on chip add (didUpdateWidget)
    // -----------------------------------------------------------------------

    testWidgets('clears text when a new chip is added', (tester) async {
      final controller = TextEditingController(text: 'flutt');

      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            controller: controller,
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );

      expect(controller.text, 'flutt');

      // Simulate the parent adding a chip
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            controller: controller,
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      await tester.pump();

      expect(controller.text, isEmpty);
      controller.dispose();
    });

    // -----------------------------------------------------------------------
    // Disabled state
    // -----------------------------------------------------------------------

    testWidgets('text field is disabled when enabled is false', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
            enabled: false,
          ),
        ),
      );
      final tf = tester.widget<TextField>(find.byType(TextField));
      expect(tf.enabled, isFalse);
    });

    // -----------------------------------------------------------------------
    // Focus
    // -----------------------------------------------------------------------

    testWidgets('calls onFocusChanged when focus changes', (tester) async {
      bool? focused;
      final focusNode = FocusNode();

      await tester.pumpWidget(
        _wrap(
          Column(
            children: [
              VisorChipSearchInput<_TestItem>(
                selectedItems: const [],
                labelBuilder: (item) => item.label,
                hintText: 'Search...',
                focusNode: focusNode,
                onQueryChanged: (_) {},
                onItemRemoved: (_) {},
                onFocusChanged: (f) => focused = f,
              ),
              const TextField(key: Key('other')),
            ],
          ),
        ),
      );

      await tester.tap(find.byType(TextField).first);
      await tester.pumpAndSettle();
      expect(focused, isTrue);

      await tester.tap(find.byKey(const Key('other')));
      await tester.pumpAndSettle();
      expect(focused, isFalse);

      focusNode.dispose();
    });

    // -----------------------------------------------------------------------
    // Accessibility
    // -----------------------------------------------------------------------

    testWidgets('chip has Semantics button + remove label', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );

      final btn = find.byWidgetPredicate(
        (w) =>
            w is Semantics &&
            (w.properties.button ?? false) &&
            (w.properties.label?.contains('Remove Flutter') ?? false),
      );
      expect(btn, findsOneWidget);
    });

    testWidgets('multiple chips each have unique remove labels', (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1, _item2, _item3],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );

      for (final label in ['Remove Flutter', 'Remove Dart', 'Remove Visor']) {
        expect(
          find.byWidgetPredicate(
            (w) =>
                w is Semantics &&
                (w.properties.button ?? false) &&
                (w.properties.label == label),
          ),
          findsOneWidget,
          reason: '$label not found',
        );
      }
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('empty state renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('with selected chips renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(
          VisorChipSearchInput<_TestItem>(
            selectedItems: const [_item1, _item2],
            labelBuilder: (item) => item.label,
            hintText: 'Search...',
            onQueryChanged: (_) {},
            onItemRemoved: (_) {},
          ),
        ),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });
  });
}
