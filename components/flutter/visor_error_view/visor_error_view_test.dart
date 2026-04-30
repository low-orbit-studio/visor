import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_error_view.dart';

Widget _wrap(Widget child) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Scaffold(
      body: SizedBox(
        width: 400,
        height: 800,
        child: child,
      ),
    ),
  );
}

void main() {
  group('VisorErrorView', () {
    // ──────────────────────────────────────────────────────────────────────
    // Smoke + basic render
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('renders message text', (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
      )));
      expect(find.text('Something went wrong.'), findsOneWidget);
    });

    testWidgets('renders default icon', (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
      )));
      expect(find.byIcon(Icons.error_outline), findsOneWidget);
    });

    testWidgets('renders custom icon when provided', (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'No network.',
        icon: Icons.wifi_off,
      )));
      expect(find.byIcon(Icons.wifi_off), findsOneWidget);
      expect(find.byIcon(Icons.error_outline), findsNothing);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Optional body copy
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('renders body copy when provided', (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Could not load your timeline.',
        body: 'Check your connection and try again.',
      )));
      expect(find.text('Check your connection and try again.'), findsOneWidget);
    });

    testWidgets('omits body copy when null', (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
      )));
      // Only one Text widget: the message. No body.
      expect(
        tester.widgetList<Text>(find.byType(Text)).length,
        equals(1),
      );
    });

    // ──────────────────────────────────────────────────────────────────────
    // Retry button — presence / absence
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('omits retry button when retryCallback is null', (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
      )));
      expect(find.byType(OutlinedButton), findsNothing);
    });

    testWidgets('renders retry button when retryCallback is provided',
        (tester) async {
      await tester.pumpWidget(_wrap(VisorErrorView(
        message: 'Something went wrong.',
        retryCallback: () {},
      )));
      expect(find.byType(OutlinedButton), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
    });

    testWidgets('retry button uses custom retryLabel when provided',
        (tester) async {
      await tester.pumpWidget(_wrap(VisorErrorView(
        message: 'Something went wrong.',
        retryCallback: () {},
        retryLabel: 'Reload',
      )));
      expect(find.text('Reload'), findsOneWidget);
      expect(find.text('Try again'), findsNothing);
    });

    testWidgets('retry button fires retryCallback on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(_wrap(VisorErrorView(
        message: 'Something went wrong.',
        retryCallback: () => tapped = true,
      )));
      await tester.tap(find.byType(OutlinedButton));
      await tester.pump();
      expect(tapped, isTrue);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Scaffold wrap
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('does not render Scaffold-owned AppBar by default',
        (tester) async {
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
      )));
      // The outer _wrap() provides a Scaffold; there should be no AppBar.
      expect(find.byType(AppBar), findsNothing);
    });

    testWidgets('renders AppBar when wrapWithScaffold is true', (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: VisorTheme.build(
          colors: testColors(),
          brightness: Brightness.light,
        ),
        home: const VisorErrorView(
          message: 'Something went wrong.',
          wrapWithScaffold: true,
        ),
      ));
      expect(find.byType(AppBar), findsOneWidget);
    });

    testWidgets('renders scaffold title when provided', (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: VisorTheme.build(
          colors: testColors(),
          brightness: Brightness.light,
        ),
        home: const VisorErrorView(
          message: 'Something went wrong.',
          wrapWithScaffold: true,
          scaffoldTitle: 'Error',
        ),
      ));
      // AppBar title text.
      expect(find.text('Error'), findsOneWidget);
    });

    testWidgets('renders full error view with all props', (tester) async {
      var retried = false;
      await tester.pumpWidget(MaterialApp(
        theme: VisorTheme.build(
          colors: testColors(),
          brightness: Brightness.light,
        ),
        home: VisorErrorView(
          message: 'Network error.',
          body: 'Please check your connection.',
          icon: Icons.wifi_off,
          retryCallback: () => retried = true,
          retryLabel: 'Reconnect',
          wrapWithScaffold: true,
          scaffoldTitle: 'Network Error',
        ),
      ));
      expect(find.text('Network Error'), findsOneWidget);
      expect(find.byIcon(Icons.wifi_off), findsOneWidget);
      expect(find.text('Network error.'), findsOneWidget);
      expect(find.text('Please check your connection.'), findsOneWidget);
      expect(find.text('Reconnect'), findsOneWidget);
      await tester.tap(find.byType(OutlinedButton));
      await tester.pump();
      expect(retried, isTrue);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Semantics — R6, R11, Rec7
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('Semantics container label defaults to the message',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
      )));
      // The error region wraps in Semantics(container: true, liveRegion: true,
      // excludeSemantics: true). We locate the Semantics widget with
      // container: true that is a descendant of VisorErrorView.
      final node = tester.getSemantics(
        find.descendant(
          of: find.byType(VisorErrorView),
          matching: find.byWidgetPredicate(
            (w) => w is Semantics && w.container == true,
          ),
        ),
      );
      expect(node.label, 'Something went wrong.');
      handle.dispose();
    });

    testWidgets('semanticLabel param overrides the announced label',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
        semanticLabel: 'Error: failed to load feed',
      )));
      final node = tester.getSemantics(
        find.descendant(
          of: find.byType(VisorErrorView),
          matching: find.byWidgetPredicate(
            (w) => w is Semantics && w.container == true,
          ),
        ),
      );
      expect(node.label, 'Error: failed to load feed');
      handle.dispose();
    });

    testWidgets('retry button exposes Semantics(button: true, label: …)',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorErrorView(
        message: 'Something went wrong.',
        retryCallback: () {},
        retryLabel: 'Try again',
      )));
      final node = tester.getSemantics(find.byType(OutlinedButton));
      // Button must be labeled so the tap target is also labeled (R11).
      expect(node.flagsCollection.isButton, isTrue);
      handle.dispose();
    });

    // R11 — meetsGuideline for interactive retry button
    testWidgets(
        'retry button meets Android and labeled tap target guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorErrorView(
        message: 'Something went wrong.',
        retryCallback: () {},
      )));
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    // R11 — non-interactive variant (no retry): tap target check not
    // applicable to the static error view.
    // not applicable: non-interactive (no retryCallback)

    // ──────────────────────────────────────────────────────────────────────
    // RTL layout (R9)
    // ──────────────────────────────────────────────────────────────────────

    testWidgets('renders without overflow in RTL directionality', (tester) async {
      await tester.pumpWidget(MaterialApp(
        theme: VisorTheme.build(
          colors: testColors(),
          brightness: Brightness.light,
        ),
        home: Directionality(
          textDirection: TextDirection.rtl,
          child: Scaffold(
            body: VisorErrorView(
              message: 'حدث خطأ ما.',
              body: 'يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
              retryCallback: () {},
              retryLabel: 'حاول مجدداً',
            ),
          ),
        ),
      ));
      // No overflow errors: the widget renders to completion.
      expect(tester.takeException(), isNull);
      expect(find.text('حدث خطأ ما.'), findsOneWidget);
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('static error view renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(const VisorErrorView(
        message: 'Something went wrong.',
        body: 'Please try again.',
      )));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('error view with retry button renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_wrap(VisorErrorView(
        message: 'Something went wrong.',
        retryCallback: () {},
      )));
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });
  });
}
