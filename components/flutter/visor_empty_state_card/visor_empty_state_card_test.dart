import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import '../visor_empty_state/visor_empty_state.dart';
import 'visor_empty_state_card.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(
      body: Center(
        child: SizedBox(
          width: 360,
          // Give plenty of height so the card itself has room; the inner
          // VisorEmptyState forces compact via forceCompact regardless.
          height: 800,
          child: child,
        ),
      ),
    ),
  );
}

void main() {
  group('VisorEmptyStateCard', () {
    testWidgets('renders icon and headline', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));
      expect(find.byIcon(Icons.inbox_outlined), findsOneWidget);
      expect(find.text('No messages'), findsOneWidget);
    });

    testWidgets('renders body when provided', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        body: 'All caught up.',
      )));
      expect(find.text('All caught up.'), findsOneWidget);
    });

    testWidgets('always uses compact layout via forceCompact', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));
      // VisorEmptyStateCard always delegates with forceCompact: true.
      final emptyState = tester.widget<VisorEmptyState>(
        find.byType(VisorEmptyState),
      );
      expect(emptyState.forceCompact, isTrue);
    });

    testWidgets('renders inside a decorated Container (card chrome)', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));
      // The card chrome is a Container with a BoxDecoration.
      final containers = tester
          .widgetList<Container>(find.byType(Container))
          .where((c) => c.decoration is BoxDecoration)
          .toList();
      expect(containers, isNotEmpty);
    });

    testWidgets('renders action when provided', (tester) async {
      await tester.pumpWidget(_wrap(VisorEmptyStateCard(
        icon: Icons.folder_open,
        headline: 'No projects',
        action: FilledButton(
          onPressed: () {},
          child: const Text('Create project'),
        ),
      )));
      expect(find.text('Create project'), findsOneWidget);
    });

    testWidgets('renders both action and secondaryAction', (tester) async {
      await tester.pumpWidget(_wrap(VisorEmptyStateCard(
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
  });
}
