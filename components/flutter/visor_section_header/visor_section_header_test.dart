import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_section_header.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(body: child),
  );
}

void main() {
  group('VisorSectionHeader', () {
    testWidgets('renders title', (tester) async {
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(title: 'Recent activity'),
      ));
      expect(find.text('Recent activity'), findsOneWidget);
    });

    testWidgets('renders subtitle when provided', (tester) async {
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(
          title: 'Recent activity',
          subtitle: 'Last 30 days',
        ),
      ));
      expect(find.text('Last 30 days'), findsOneWidget);
    });

    testWidgets('omits subtitle when null', (tester) async {
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(title: 'Recent activity'),
      ));
      expect(find.byType(Text), findsOneWidget);
    });

    testWidgets('renders trailing widget when provided', (tester) async {
      await tester.pumpWidget(_wrap(
        VisorSectionHeader(
          title: 'Recent activity',
          trailing: TextButton(
            onPressed: () {},
            child: const Text('View all'),
          ),
        ),
      ));
      expect(find.byType(TextButton), findsOneWidget);
      expect(find.text('View all'), findsOneWidget);
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('title renders with sufficient text contrast', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(title: 'Recent activity'),
      ));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('title + subtitle render with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(
        const VisorSectionHeader(
          title: 'Recent activity',
          subtitle: 'Last 30 days',
        ),
      ));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });
  });
}
