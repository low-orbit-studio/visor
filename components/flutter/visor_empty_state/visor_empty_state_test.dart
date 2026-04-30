import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_empty_state.dart';

Widget _wrap(Widget child, {Size surfaceSize = const Size(400, 800), TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Directionality(
      textDirection: textDirection,
      child: Scaffold(
        body: Center(
          child: SizedBox(
            width: surfaceSize.width,
            height: surfaceSize.height,
            child: child,
          ),
        ),
      ),
    ),
  );
}

void main() {
  group('VisorEmptyState', () {
    // ──────────────────────────────────────────────────────────────────────
    // Baseline / backwards-compatibility
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('renders icon and headline', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));
      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
      expect(find.text('No messages'), findsOneWidget);
    });

    testWidgets('renders body when provided', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        body: 'You are all caught up.',
      )));
      expect(find.text('You are all caught up.'), findsOneWidget);
    });

    testWidgets('omits body when null', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));
      // Only one Text widget (the headline) is shown.
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders action widget when provided', (tester) async {
      await tester.pumpWidget(_wrap(VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        action: FilledButton(
          onPressed: () {},
          child: const Text('Refresh'),
        ),
      )));
      expect(find.byType(FilledButton), findsOneWidget);
      expect(find.text('Refresh'), findsOneWidget);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Secondary action slot
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('renders secondary action when both action and secondaryAction provided',
        (tester) async {
      await tester.pumpWidget(_wrap(VisorEmptyState(
        icon: Icons.folder_open,
        headline: 'No projects',
        action: FilledButton(
          onPressed: () {},
          child: const Text('Create new'),
        ),
        secondaryAction: OutlinedButton(
          onPressed: () {},
          child: const Text('Import existing'),
        ),
      )));
      expect(find.text('Create new'), findsOneWidget);
      expect(find.text('Import existing'), findsOneWidget);
    });

    testWidgets('omits secondary action when not provided', (tester) async {
      await tester.pumpWidget(_wrap(VisorEmptyState(
        icon: Icons.folder_open,
        headline: 'No projects',
        action: FilledButton(
          onPressed: () {},
          child: const Text('Create new'),
        ),
      )));
      expect(find.text('Create new'), findsOneWidget);
      expect(find.byType(Wrap), findsNothing);
    });

    testWidgets('wraps dual actions in a Wrap widget', (tester) async {
      await tester.pumpWidget(_wrap(VisorEmptyState(
        icon: Icons.folder_open,
        headline: 'No projects',
        action: FilledButton(
          onPressed: () {},
          child: const Text('Create new'),
        ),
        secondaryAction: OutlinedButton(
          onPressed: () {},
          child: const Text('Import existing'),
        ),
      )));
      expect(find.byType(Wrap), findsOneWidget);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Compact layout — forceCompact override
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('forceCompact renders Row layout', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        body: 'Nothing here.',
        forceCompact: true,
      )));
      // The compact layout uses a top-level Row; standard uses Column.
      expect(find.byType(Row), findsAtLeastNWidgets(1));
    });

    testWidgets('standard layout uses Column (not forceCompact)', (tester) async {
      // Surface height is 800 — well above the 400 px threshold.
      await tester.pumpWidget(_wrap(
        const VisorEmptyState(
          icon: Icons.inbox_outlined,
          headline: 'No messages',
        ),
        surfaceSize: const Size(400, 800),
      ));
      // Standard layout wraps content in a Column (no outer Row).
      expect(find.byType(Column), findsAtLeastNWidgets(1));
    });

    testWidgets('compact layout activates automatically below 400 px height',
        (tester) async {
      // Constrain the surface to 300 px — below the compact threshold.
      await tester.pumpWidget(_wrap(
        const VisorEmptyState(
          icon: Icons.inbox_outlined,
          headline: 'No messages',
        ),
        surfaceSize: const Size(400, 300),
      ));
      // The compact layout leads with a Row containing the icon.
      expect(find.byType(Row), findsAtLeastNWidgets(1));
    });

    // ──────────────────────────────────────────────────────────────────────
    // iconSize
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('defaults iconSize to 48', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));
      final icon = tester.widget<Icon>(find.byIcon(Icons.inbox_outlined));
      expect(icon.size, 48);
    });

    testWidgets('respects custom iconSize', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        iconSize: 32,
      )));
      final icon = tester.widget<Icon>(find.byIcon(Icons.inbox_outlined));
      // Standard layout uses the full iconSize; compact scales it down.
      // With surfaceSize height=800 (standard), size should be 32.
      expect(icon.size, 32);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Semantics
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('wraps content in a Semantics container with headline as default label',
        (tester) async {
      final handle = tester.ensureSemantics();

      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));

      final semanticsNode =
          tester.getSemantics(find.byType(VisorEmptyState));
      // The Semantics container label defaults to headline.
      expect(semanticsNode.label, 'No messages');

      handle.dispose();
    });

    testWidgets('semanticLabel param overrides the default label', (tester) async {
      final handle = tester.ensureSemantics();

      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        semanticLabel: 'Inbox is empty',
      )));

      final semanticsNode =
          tester.getSemantics(find.byType(VisorEmptyState));
      expect(semanticsNode.label, 'Inbox is empty');

      handle.dispose();
    });

    // ──────────────────────────────────────────────────────────────────────
    // Rec5 — textContrastGuideline (VI-257)
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('renders with sufficient text contrast (standard layout)',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorEmptyState(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        body: 'You are all caught up.',
      )));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('renders with sufficient text contrast (compact layout)',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(
        const VisorEmptyState(
          icon: Icons.inbox_outlined,
          headline: 'No messages',
          forceCompact: true,
        ),
      ));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    // -------------------------------------------------------------------------
    // R9 — Directionality respect
    // -------------------------------------------------------------------------

    testWidgets('renders without overflow or exception under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorEmptyState(
            icon: Icons.inbox_outlined,
            headline: 'No messages',
          ),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorEmptyState), findsOneWidget);
    });
  });
}
