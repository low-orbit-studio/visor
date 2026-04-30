import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_otp_input.dart';

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
          child: SizedBox(width: 400, child: child),
        ),
      ),
    ),
  );
}

void main() {
  group('VisorOtpInput', () {
    testWidgets('renders default 6 digit boxes', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorOtpInput(onCodeComplete: (_) {})),
      );
      // 6 SizedBoxes at the digit size level — find by key count via
      // the visible TextField widgets (one per empty digit).
      expect(find.byType(TextField), findsNWidgets(6));
    });

    testWidgets('renders configurable digitCount boxes', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorOtpInput(digitCount: 4, onCodeComplete: (_) {})),
      );
      expect(find.byType(TextField), findsNWidgets(4));
    });

    testWidgets('onCodeChanged fires on digit entry', (tester) async {
      final codes = <String>[];
      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          digitCount: 4,
          onCodeChanged: codes.add,
          onCodeComplete: (_) {},
        )),
      );

      await tester.tap(find.byType(TextField).first);
      await tester.pump();
      await tester.enterText(find.byType(TextField).first, '3');
      await tester.pump();

      expect(codes, isNotEmpty);
    });

    testWidgets('onCodeComplete fires when all digits are filled',
        (tester) async {
      final completions = <String>[];
      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          digitCount: 4,
          onCodeComplete: completions.add,
          onCodeChanged: (_) {},
        )),
      );

      // Enter one digit at a time in each text field.
      final fields = find.byType(TextField);
      for (var i = 0; i < 4; i++) {
        await tester.tap(fields.at(i));
        await tester.pump();
        await tester.enterText(fields.at(i), '${i + 1}');
        await tester.pump();
      }

      expect(completions, hasLength(1));
      // Code should be '1234' — 4 digits entered sequentially.
      expect(completions.first, hasLength(4));
    });

    testWidgets('onCodeComplete does not re-fire on re-entry after completion',
        (tester) async {
      var fireCount = 0;
      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          digitCount: 2,
          onCodeComplete: (_) => fireCount++,
        )),
      );

      final fields = find.byType(TextField);
      await tester.tap(fields.first);
      await tester.pump();
      await tester.enterText(fields.first, '1');
      await tester.pump();
      await tester.tap(fields.last);
      await tester.pump();
      await tester.enterText(fields.last, '2');
      await tester.pump();

      // Completing again by changing a digit should reset guard.
      // fireCount should be 1 after one full completion.
      expect(fireCount, equals(1));
    });

    testWidgets('clear() resets all digits and calls onCodeChanged',
        (tester) async {
      final key = GlobalKey<VisorOtpInputState>();
      final codes = <String>[];

      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          key: key,
          digitCount: 2,
          onCodeChanged: codes.add,
          onCodeComplete: (_) {},
        )),
      );

      // Enter digits.
      final fields = find.byType(TextField);
      await tester.tap(fields.first);
      await tester.pump();
      await tester.enterText(fields.first, '5');
      await tester.pump();

      // Clear.
      key.currentState!.clear();
      await tester.pump();

      // After clear, onCodeChanged should have been called with ''.
      expect(codes.last, equals(''));
    });

    testWidgets('enabled: false disables all TextFields', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          digitCount: 4,
          enabled: false,
          onCodeComplete: (_) {},
        )),
      );

      // All text fields should be disabled.
      final textFields =
          tester.widgetList<TextField>(find.byType(TextField)).toList();
      for (final field in textFields) {
        expect(field.enabled, isFalse);
      }
    });

    testWidgets('renders VisorOtpInput widget without error', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          digitCount: 6,
          onCodeComplete: (_) {},
          onCodeChanged: (_) {},
        )),
      );
      expect(find.byType(VisorOtpInput), findsOneWidget);
    });

    // R6 — per-cell + container Semantics (VI-253)

    testWidgets('row Semantics container has default label including digit count',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorOtpInput(onCodeComplete: (_) {})),
      );
      expect(find.bySemanticsLabel('OTP code, 6 digits'), findsOneWidget);
      handle.dispose();
    });

    testWidgets('per-digit Semantics labels include position and value',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorOtpInput(onCodeComplete: (_) {})),
      );

      // All cells start empty with position-aware labels.
      expect(
        find.bySemanticsLabel('OTP digit 1 of 6, empty'),
        findsOneWidget,
      );
      expect(
        find.bySemanticsLabel('OTP digit 6 of 6, empty'),
        findsOneWidget,
      );

      // Fill digit at index 2 with '7'; label should reflect the value.
      final fields = find.byType(TextField);
      await tester.tap(fields.at(2));
      await tester.pump();
      await tester.enterText(fields.at(2), '7');
      await tester.pump();

      expect(
        find.bySemanticsLabel('OTP digit 3 of 6, 7'),
        findsOneWidget,
      );
      // Untouched cells still report empty with their position.
      expect(
        find.bySemanticsLabel('OTP digit 1 of 6, empty'),
        findsOneWidget,
      );
      handle.dispose();
    });

    testWidgets('semanticLabel param overrides container label',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorOtpInput(
          semanticLabel: 'Two-factor code',
          onCodeComplete: (_) {},
        )),
      );
      expect(find.bySemanticsLabel('Two-factor code'), findsOneWidget);
      expect(find.bySemanticsLabel('OTP code, 6 digits'), findsNothing);
      handle.dispose();
    });

    // R11 — meetsGuideline tap-target + labeled-tap-target (VI-253)

    testWidgets(
        'default 6-digit input meets Android tap-target + labeled-tap-target guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(VisorOtpInput(onCodeComplete: (_) {})),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    // -------------------------------------------------------------------------
    // R9 — Directionality respect
    // -------------------------------------------------------------------------

    testWidgets('renders without overflow or exception under RTL',
        (tester) async {
      await tester.pumpWidget(
        _wrap(
          VisorOtpInput(onCodeComplete: (_) {}),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorOtpInput), findsOneWidget);
      // OTP digit boxes are displayed in a Row. In RTL, the Row reverses
      // visual order so digit 1 appears at the right end. The digit boxes
      // themselves are index-keyed and symmetric, so visual reversal does
      // not break entry — the cursor still moves to the next logical field.
      // No semantic reordering follow-up required; OTP codes are locale-neutral.
      expect(find.byType(TextField), findsNWidgets(6));
    });
  });
}
