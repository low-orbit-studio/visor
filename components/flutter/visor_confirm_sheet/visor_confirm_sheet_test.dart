import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_confirm_sheet.dart';

/// Wraps [child] in a [MaterialApp] + [Scaffold] with the test Visor theme.
Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: Center(child: child)),
  );
}

/// Pumps a [VisorConfirmSheet] directly (not via [show]) so we can inspect the
/// widget tree without a route transition.
Widget _sheet({
  String title = 'Confirm action',
  String message = 'Are you sure you want to do this?',
  String confirmLabel = 'Confirm',
  String cancelLabel = 'Cancel',
  VisorConfirmSheetVariant variant = VisorConfirmSheetVariant.standard,
  IconData? icon,
  VoidCallback? onConfirm,
  VoidCallback? onCancel,
}) {
  return _wrap(
    VisorConfirmSheet(
      title: title,
      message: message,
      confirmLabel: confirmLabel,
      cancelLabel: cancelLabel,
      variant: variant,
      icon: icon,
      onConfirm: onConfirm ?? () {},
      onCancel: onCancel,
    ),
  );
}

void main() {
  group('VisorConfirmSheet', () {
    // -----------------------------------------------------------------------
    // Render — basic content
    // -----------------------------------------------------------------------

    testWidgets('renders title and message', (tester) async {
      await tester.pumpWidget(_sheet(
        title: 'Delete item',
        message: 'This cannot be undone.',
      ));

      expect(find.text('Delete item'), findsOneWidget);
      expect(find.text('This cannot be undone.'), findsOneWidget);
    });

    testWidgets('renders confirm and cancel buttons', (tester) async {
      await tester.pumpWidget(_sheet(
        confirmLabel: 'Remove',
        cancelLabel: 'Go back',
      ));

      expect(find.text('Remove'), findsOneWidget);
      expect(find.text('Go back'), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // Callbacks
    // -----------------------------------------------------------------------

    testWidgets('onConfirm fires when confirm button is tapped', (tester) async {
      var confirmCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: VisorConfirmSheet(
              title: 'Confirm',
              message: 'Are you sure?',
              confirmLabel: 'Yes',
              onConfirm: () => confirmCalled = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Yes'));
      await tester.pumpAndSettle();

      expect(confirmCalled, isTrue);
    });

    testWidgets('onCancel fires when cancel button is tapped', (tester) async {
      var cancelCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: VisorConfirmSheet(
              title: 'Confirm',
              message: 'Are you sure?',
              confirmLabel: 'Yes',
              onConfirm: () {},
              onCancel: () => cancelCalled = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();

      expect(cancelCalled, isTrue);
    });

    testWidgets('onCancel is optional — no crash when null', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: VisorConfirmSheet(
              title: 'Confirm',
              message: 'Are you sure?',
              confirmLabel: 'Yes',
              onConfirm: () {},
              // onCancel intentionally omitted
            ),
          ),
        ),
      );

      // Should not throw.
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
    });

    // -----------------------------------------------------------------------
    // Variants
    // -----------------------------------------------------------------------

    testWidgets('standard variant renders without error', (tester) async {
      await tester.pumpWidget(_sheet(
        variant: VisorConfirmSheetVariant.standard,
        confirmLabel: 'Archive',
      ));
      expect(find.text('Archive'), findsOneWidget);
    });

    testWidgets('destructive variant renders without error', (tester) async {
      await tester.pumpWidget(_sheet(
        variant: VisorConfirmSheetVariant.destructive,
        confirmLabel: 'Delete',
      ));
      expect(find.text('Delete'), findsOneWidget);
    });

    testWidgets('custom icon appears on confirm button', (tester) async {
      await tester.pumpWidget(_sheet(
        icon: Icons.warning_amber_rounded,
        confirmLabel: 'Proceed',
      ));
      expect(find.byIcon(Icons.warning_amber_rounded), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // Adaptive presenter — routes by viewport width
    // -----------------------------------------------------------------------

    testWidgets('show() presents a bottom sheet on compact viewport',
        (tester) async {
      // Set a compact screen size (width < 600).
      tester.view.physicalSize = const Size(390 * 3, 844 * 3);
      tester.view.devicePixelRatio = 3.0;
      addTearDown(tester.view.reset);

      var confirmed = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (ctx) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => VisorConfirmSheet.show(
                    context: ctx,
                    title: 'Bottom sheet',
                    message: 'Compact viewport.',
                    confirmLabel: 'OK',
                    onConfirm: () => confirmed = true,
                  ),
                  child: const Text('Open'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();

      // Content should be visible in the bottom sheet.
      expect(find.text('Bottom sheet'), findsOneWidget);
      expect(find.text('Compact viewport.'), findsOneWidget);

      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();

      expect(confirmed, isTrue);
    });

    testWidgets('show() presents a dialog on wide viewport', (tester) async {
      // Set a wide screen size (width >= 600).
      tester.view.physicalSize = const Size(1024 * 3, 768 * 3);
      tester.view.devicePixelRatio = 3.0;
      addTearDown(tester.view.reset);

      var confirmed = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(
            builder: (ctx) => Scaffold(
              body: Center(
                child: ElevatedButton(
                  onPressed: () => VisorConfirmSheet.show(
                    context: ctx,
                    title: 'Dialog title',
                    message: 'Wide viewport.',
                    confirmLabel: 'Confirm',
                    onConfirm: () => confirmed = true,
                  ),
                  child: const Text('Open'),
                ),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open'));
      await tester.pumpAndSettle();

      // Content should be visible in the dialog.
      expect(find.text('Dialog title'), findsOneWidget);
      expect(find.text('Wide viewport.'), findsOneWidget);

      await tester.tap(find.text('Confirm'));
      await tester.pumpAndSettle();

      expect(confirmed, isTrue);
    });

    // -----------------------------------------------------------------------
    // Semantics
    // -----------------------------------------------------------------------

    testWidgets('title text is present in the widget tree for accessibility',
        (tester) async {
      await tester.pumpWidget(_sheet(title: 'Dangerous action'));

      // The title is rendered as a Text widget that screen readers can
      // announce. We verify it's in the tree (semantic accessibility).
      expect(find.text('Dangerous action'), findsOneWidget);
    });
  });
}
