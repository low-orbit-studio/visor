import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_back_button.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(
      body: Directionality(
        textDirection: textDirection,
        child: Center(child: child),
      ),
    ),
  );
}

void main() {
  group('VisorBackButton', () {
    testWidgets('renders without error', (tester) async {
      await tester.pumpWidget(_wrap(const VisorBackButton()));
      expect(find.byType(VisorBackButton), findsOneWidget);
    });

    testWidgets('calls onPressed when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(VisorBackButton(onPressed: () => tapped = true)),
      );
      await tester.tap(find.byType(VisorBackButton));
      await tester.pump();
      expect(tapped, isTrue);
    });

    testWidgets('pops navigator when onPressed is null', (tester) async {
      // Push a second route so that a pop is possible.
      bool poppedSuccessfully = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Builder(builder: (rootContext) {
            return Scaffold(
              body: ElevatedButton(
                onPressed: () {
                  Navigator.of(rootContext).push(
                    MaterialPageRoute<void>(
                      builder: (_) => Scaffold(
                        body: VisorBackButton(
                          onPressed: null,
                        ),
                      ),
                    ),
                  );
                },
                child: const Text('Go'),
              ),
            );
          }),
        ),
      );

      // Navigate to second route.
      await tester.tap(find.text('Go'));
      await tester.pumpAndSettle();

      expect(find.byType(VisorBackButton), findsOneWidget);

      // Tap back button — should pop back to first route.
      await tester.tap(find.byType(VisorBackButton));
      await tester.pumpAndSettle();

      // VisorBackButton should no longer be visible after pop.
      expect(find.byType(VisorBackButton), findsNothing);
      poppedSuccessfully = true;
      expect(poppedSuccessfully, isTrue);
    });

    testWidgets('custom onPressed overrides default pop behaviour',
        (tester) async {
      var customCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: Center(
              child: VisorBackButton(
                onPressed: () => customCalled = true,
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.byType(VisorBackButton));
      await tester.pump();
      expect(customCalled, isTrue);
    });

    testWidgets('has default "Back" semantics label', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorBackButton()));
      expect(find.bySemanticsLabel('Back'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('semanticLabel overrides default label', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorBackButton(semanticLabel: 'Go back to settings')),
      );
      expect(find.bySemanticsLabel('Go back to settings'), findsOneWidget);
      expect(find.bySemanticsLabel('Back'), findsNothing);
      handle.dispose();
    });

    testWidgets('renders back arrow icon in LTR', (tester) async {
      await tester.pumpWidget(_wrap(const VisorBackButton()));
      expect(find.byIcon(Icons.arrow_back_ios_new_rounded), findsOneWidget);
      expect(find.byIcon(Icons.arrow_forward_ios_rounded), findsNothing);
    });

    testWidgets('renders forward arrow icon in RTL', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorBackButton(), textDirection: TextDirection.rtl),
      );
      expect(find.byIcon(Icons.arrow_forward_ios_rounded), findsOneWidget);
      expect(find.byIcon(Icons.arrow_back_ios_new_rounded), findsNothing);
    });

    // R11 — meetsGuideline tap-target + labeled-tap-target (VI-274)

    testWidgets('meets Android tap-target + labeled-tap-target guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorBackButton()));
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'semanticLabel override still passes labeledTapTargetGuideline',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorBackButton(semanticLabel: 'Go back to settings')),
      );
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });
  });
}
