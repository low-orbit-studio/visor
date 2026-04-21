import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_empty_state.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: Center(child: child)),
  );
}

void main() {
  group('VisorEmptyState', () {
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
  });
}
