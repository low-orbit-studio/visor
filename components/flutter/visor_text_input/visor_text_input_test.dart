import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import 'visor_text_input.dart';

Widget _wrap(Widget child, {TextDirection textDirection = TextDirection.ltr}) {
  return MaterialApp(
    theme: VisorTheme.build(
      colors: testColors(),
      brightness: Brightness.light,
    ),
    home: Directionality(
      textDirection: textDirection,
      child: Scaffold(body: Center(child: child)),
    ),
  );
}

void main() {
  group('VisorTextInput', () {
    // -----------------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------------

    testWidgets('renders the label text', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(labelText: 'Email')),
      );
      expect(find.text('Email'), findsOneWidget);
    });

    testWidgets('renders the inner TextFormField', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(labelText: 'Email')),
      );
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('is disabled when enabled is false', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(labelText: 'Email', enabled: false)),
      );
      final field = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(field.enabled, isFalse);
    });

    testWidgets('renders prefix icon when provided', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(
          labelText: 'Email',
          prefixIcon: Icon(Icons.email),
        )),
      );
      expect(find.byIcon(Icons.email), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // Label float animation
    // -----------------------------------------------------------------------

    testWidgets('label is present before interaction', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(labelText: 'Password')),
      );
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('label remains visible after receiving focus', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(labelText: 'Password')),
      );
      await tester.tap(find.byType(TextFormField));
      await tester.pump();
      // Label still rendered (floated to top).
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('label remains visible when field has content', (tester) async {
      final controller = TextEditingController(text: 'hello');
      await tester.pumpWidget(
        _wrap(VisorTextInput(labelText: 'Name', controller: controller)),
      );
      expect(find.text('Name'), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // Validation states
    // -----------------------------------------------------------------------

    testWidgets('shows checkmark icon when valid', (tester) async {
      final controller = TextEditingController(text: 'valid@example.com');
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Email',
          controller: controller,
          validator: (v) =>
              v?.contains('@') == true ? null : 'Invalid email',
        )),
      );
      // Pump to reflect state.
      await tester.pump();
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('does not show checkmark when field is empty', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Email',
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        )),
      );
      expect(find.byIcon(Icons.check_circle_outline), findsNothing);
    });

    testWidgets('shows error text after user interaction', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Email',
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        )),
      );
      await tester.tap(find.byType(TextFormField));
      await tester.enterText(find.byType(TextFormField), 'x');
      await tester.pump();
      await tester.enterText(find.byType(TextFormField), '');
      await tester.pump();
      expect(find.text('Required'), findsOneWidget);
    });

    testWidgets('does not show error text before user interaction', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Email',
          autovalidateMode: AutovalidateMode.onUserInteraction,
          validator: (_) => 'Always error',
        )),
      );
      expect(find.text('Always error'), findsNothing);
    });

    testWidgets('shows explicit errorText override', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorTextInput(
          labelText: 'Email',
          errorText: 'Server error',
        )),
      );
      expect(find.text('Server error'), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // isValid override (D3)
    // -----------------------------------------------------------------------

    testWidgets('isValid: true forces checkmark regardless of validator',
        (tester) async {
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Username',
          isValid: true,
          validator: (_) => 'Always invalid',
        )),
      );
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('isValid: false suppresses checkmark even when validator passes',
        (tester) async {
      final controller = TextEditingController(text: 'taken_user');
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Username',
          controller: controller,
          isValid: false,
          validator: (_) => null, // synchronous pass
        )),
      );
      await tester.pump();
      expect(find.byIcon(Icons.check_circle_outline), findsNothing);
    });

    // -----------------------------------------------------------------------
    // Form integration (D2)
    // -----------------------------------------------------------------------

    testWidgets('Form.validate() returns true when validator passes',
        (tester) async {
      final formKey = GlobalKey<FormState>();
      final controller = TextEditingController(text: 'valid@example.com');
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: Form(
              key: formKey,
              child: VisorTextInput(
                labelText: 'Email',
                controller: controller,
                validator: (v) =>
                    v?.contains('@') == true ? null : 'Invalid',
              ),
            ),
          ),
        ),
      );
      expect(formKey.currentState!.validate(), isTrue);
    });

    testWidgets('Form.validate() returns false when validator fails',
        (tester) async {
      final formKey = GlobalKey<FormState>();
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: Form(
              key: formKey,
              child: VisorTextInput(
                labelText: 'Email',
                validator: (_) => 'Required',
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      expect(formKey.currentState!.validate(), isFalse);
    });

    // -----------------------------------------------------------------------
    // Callbacks
    // -----------------------------------------------------------------------

    testWidgets('onChanged fires when text is entered', (tester) async {
      String? lastValue;
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Search',
          onChanged: (v) => lastValue = v,
        )),
      );
      await tester.enterText(find.byType(TextFormField), 'hello');
      expect(lastValue, 'hello');
    });

    // -----------------------------------------------------------------------
    // Token usage — no UIColors / UISpacing / UIPrimaryColors
    // -----------------------------------------------------------------------

    testWidgets('widget builds without hard-coded color references',
        (tester) async {
      // This test simply verifies the widget renders without throwing;
      // static analysis (flutter analyze) enforces the actual token rule.
      await tester.pumpWidget(
        _wrap(VisorTextInput(
          labelText: 'Amount',
          prefixIcon: const Icon(Icons.attach_money),
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        )),
      );
      expect(find.byType(VisorTextInput), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // meetsGuideline (R11) — tap-target + labeled-tap coverage
  // -------------------------------------------------------------------------

  group('meetsGuideline (R11)', () {
    testWidgets(
        'default text input meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorTextInput(labelText: 'Email')),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'input with prefixIcon meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorTextInput(
          labelText: 'Email',
          prefixIcon: Icon(Icons.email),
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'input in error state meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorTextInput(
          labelText: 'Email',
          errorText: 'Invalid email address',
        )),
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
          const VisorTextInput(labelText: 'Email'),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorTextInput), findsOneWidget);
    });
  });
}
