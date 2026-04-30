import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_form_dialog.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Directionality(
      textDirection: textDirection,
      child: Scaffold(body: child),
    ),
  );
}

/// Pumps a [VisorFormDialog] via [showDialog] and settles the animation.
Future<void> _showDialog(WidgetTester tester, VisorFormDialog dialog) async {
  await tester.pumpWidget(_wrap(Builder(
    builder: (context) {
      return TextButton(
        onPressed: () => showDialog<void>(
          context: context,
          builder: (_) => dialog,
        ),
        child: const Text('open'),
      );
    },
  )));
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

/// Finds all [ConstrainedBox] widgets that are direct children of [Dialog]
/// by locating the Dialog in the tree and inspecting its child hierarchy.
List<ConstrainedBox> _constrainedBoxesUnderDialog(WidgetTester tester) {
  return tester
      .widgetList<ConstrainedBox>(
        find.descendant(
          of: find.byType(Dialog),
          matching: find.byType(ConstrainedBox),
        ),
      )
      .toList();
}

void main() {
  group('VisorFormDialog', () {
    testWidgets('renders child widget', (tester) async {
      await _showDialog(
        tester,
        const VisorFormDialog(child: Text('Form content')),
      );
      expect(find.text('Form content'), findsOneWidget);
    });

    testWidgets('applies default maxWidth constraint', (tester) async {
      await _showDialog(
        tester,
        const VisorFormDialog(child: Text('Form content')),
      );

      // The ConstrainedBox we insert is the first direct child of Dialog;
      // find all ConstrainedBoxes under Dialog and filter for the one capped
      // at 480 (the Dialog internals use Infinity as maxWidth).
      final boxes = _constrainedBoxesUnderDialog(tester);
      final capped = boxes.where((b) => b.constraints.maxWidth == 480.0);
      expect(capped, isNotEmpty,
          reason: 'Expected a ConstrainedBox with maxWidth 480 inside Dialog');
    });

    testWidgets('respects custom maxWidth', (tester) async {
      await _showDialog(
        tester,
        const VisorFormDialog(maxWidth: 320, child: Text('Narrow form')),
      );

      final boxes = _constrainedBoxesUnderDialog(tester);
      final capped = boxes.where((b) => b.constraints.maxWidth == 320.0);
      expect(capped, isNotEmpty,
          reason: 'Expected a ConstrainedBox with maxWidth 320 inside Dialog');
    });

    testWidgets('applies default padding from spacing token', (tester) async {
      await _showDialog(
        tester,
        const VisorFormDialog(child: Text('Padded form')),
      );

      // Find the Padding widget that is a direct child of our ConstrainedBox.
      // We locate our ConstrainedBox (maxWidth 480) then traverse to its child.
      final boxes = _constrainedBoxesUnderDialog(tester);
      final ourBox =
          boxes.firstWhere((b) => b.constraints.maxWidth == 480.0);

      // The immediate child of our ConstrainedBox must be a Padding.
      expect(
        ourBox.child,
        isA<Padding>(),
        reason: 'ConstrainedBox child should be a Padding widget',
      );
      final padding = ourBox.child! as Padding;

      // Default padding is spacing.xl = 24.0.
      expect(padding.padding, const EdgeInsets.all(24.0));
    });

    testWidgets('respects custom padding override', (tester) async {
      const customPadding = EdgeInsets.symmetric(horizontal: 32, vertical: 16);
      await _showDialog(
        tester,
        const VisorFormDialog(
          padding: customPadding,
          child: Text('Custom padded form'),
        ),
      );

      final boxes = _constrainedBoxesUnderDialog(tester);
      // With custom maxWidth not set, it defaults to 480.
      final ourBox =
          boxes.firstWhere((b) => b.constraints.maxWidth == 480.0);

      expect(ourBox.child, isA<Padding>());
      final padding = ourBox.child! as Padding;
      expect(padding.padding, customPadding);
    });

    testWidgets('wraps content in a Dialog', (tester) async {
      await _showDialog(
        tester,
        const VisorFormDialog(child: Text('Dialog content')),
      );
      expect(find.byType(Dialog), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // R9 — Directionality respect
    // -------------------------------------------------------------------------

    testWidgets('renders without overflow or exception under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          Builder(
            builder: (context) => TextButton(
              onPressed: () => showDialog<void>(
                context: context,
                builder: (_) =>
                    const VisorFormDialog(child: Text('RTL content')),
              ),
              child: const Text('open'),
            ),
          ),
          textDirection: TextDirection.rtl,
        ),
      );
      await tester.tap(find.text('open'));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorFormDialog), findsOneWidget);
    });
  });
}
