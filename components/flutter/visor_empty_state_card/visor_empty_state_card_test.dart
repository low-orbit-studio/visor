import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import '../visor_empty_state/visor_empty_state.dart';
import 'visor_empty_state_card.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
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
            width: 360,
            // Give plenty of height so the card itself has room; the inner
            // VisorEmptyState forces compact via forceCompact regardless.
            height: 800,
            child: child,
          ),
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

    // ──────────────────────────────────────────────────────────────────────
    // Semantics — inherited from inner VisorEmptyState (VI-247 / VI-249)
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('announces as a single Semantics container with headline as default label',
        (tester) async {
      final handle = tester.ensureSemantics();

      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
      )));

      // The container is provided by the inner VisorEmptyState; the card
      // chrome must NOT add a second Semantics(container: true). The inner
      // node's label defaults to the headline.
      final node = tester.getSemantics(find.byType(VisorEmptyState));
      expect(node.label, 'No messages');

      // Single-announcement invariant: exactly one container Semantics in
      // the card's subtree. A second one (e.g., on the card's outer
      // Container) would cause double announcements on TalkBack/VoiceOver.
      final containerSemantics = tester
          .widgetList<Semantics>(find.descendant(
            of: find.byType(VisorEmptyStateCard),
            matching: find.byType(Semantics),
          ))
          .where((s) => s.container)
          .toList();
      expect(containerSemantics, hasLength(1));

      handle.dispose();
    });

    testWidgets('semanticLabel param overrides the announced label', (tester) async {
      final handle = tester.ensureSemantics();

      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        semanticLabel: 'Inbox is empty',
      )));

      final node = tester.getSemantics(find.byType(VisorEmptyState));
      expect(node.label, 'Inbox is empty');

      handle.dispose();
    });

    testWidgets('forwards semanticLabel to inner VisorEmptyState', (tester) async {
      await tester.pumpWidget(_wrap(const VisorEmptyStateCard(
        icon: Icons.inbox_outlined,
        headline: 'No messages',
        semanticLabel: 'custom card label',
      )));

      final inner = tester.widget<VisorEmptyState>(find.byType(VisorEmptyState));
      expect(inner.semanticLabel, 'custom card label');
    });

    // -------------------------------------------------------------------------
    // R9 — Directionality respect
    // -------------------------------------------------------------------------

    testWidgets('renders without overflow or exception under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          const VisorEmptyStateCard(
            icon: Icons.inbox_outlined,
            headline: 'No messages',
          ),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorEmptyStateCard), findsOneWidget);
    });
  });
}
