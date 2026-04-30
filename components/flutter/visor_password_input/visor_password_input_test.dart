import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import '../visor_text_input/visor_text_input.dart';
import 'visor_password_input.dart';

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
  group('VisorPasswordInput', () {
    // -----------------------------------------------------------------------
    // Rendering
    // -----------------------------------------------------------------------

    testWidgets('renders the label text', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('renders a VisorTextInput as the base', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      expect(find.byType(VisorTextInput), findsOneWidget);
    });

    testWidgets('renders the inner TextFormField', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      expect(find.byType(TextFormField), findsOneWidget);
    });

    testWidgets('is disabled when enabled is false', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password', enabled: false)),
      );
      final field = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(field.enabled, isFalse);
    });

    // -----------------------------------------------------------------------
    // obscureText toggle
    // -----------------------------------------------------------------------

    testWidgets('text is obscured by default', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      // obscureText is surfaced on EditableText, which TextFormField creates
      // internally. The obscure state is reflected in the EditableText widget.
      final editableText = tester.widget<EditableText>(find.byType(EditableText));
      expect(editableText.obscureText, isTrue);
    });

    testWidgets('tapping the eye icon reveals text', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );

      // Initially obscured.
      final textBefore = tester.widget<EditableText>(find.byType(EditableText));
      expect(textBefore.obscureText, isTrue);

      // Tap the visibility-off icon to reveal.
      await tester.tap(find.byIcon(Icons.visibility_off_outlined));
      await tester.pump();

      // Should now be revealed.
      final textAfter = tester.widget<EditableText>(find.byType(EditableText));
      expect(textAfter.obscureText, isFalse);

      // Icon should have flipped to the visibility icon.
      expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
    });

    testWidgets('tapping the eye icon a second time re-obscures text',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );

      // Reveal.
      await tester.tap(find.byIcon(Icons.visibility_off_outlined));
      await tester.pump();

      // Re-obscure.
      await tester.tap(find.byIcon(Icons.visibility_outlined));
      await tester.pump();

      final editableText = tester.widget<EditableText>(find.byType(EditableText));
      expect(editableText.obscureText, isTrue);
    });

    testWidgets('eye icon is always visible regardless of content', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
    });

    testWidgets('eye toggle is inert when field is disabled', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password', enabled: false)),
      );

      // Attempt tap — should not toggle (gesture is disabled).
      await tester.tap(find.byIcon(Icons.visibility_off_outlined), warnIfMissed: false);
      await tester.pump();

      // Still obscured — icon has not changed.
      expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
      expect(find.byIcon(Icons.visibility_outlined), findsNothing);
    });

    // -----------------------------------------------------------------------
    // Validation states
    // -----------------------------------------------------------------------

    testWidgets('shows checkmark icon when valid', (tester) async {
      final controller = TextEditingController(text: 'S3cur3P@ssw0rd');
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          controller: controller,
          validator: (v) =>
              v != null && v.length >= 8 ? null : 'Too short',
        )),
      );
      await tester.pump();
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('does not show checkmark when field is empty', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        )),
      );
      expect(find.byIcon(Icons.check_circle_outline), findsNothing);
    });

    testWidgets('shows both checkmark and eye toggle when valid', (tester) async {
      final controller = TextEditingController(text: 'S3cur3P@ss');
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          controller: controller,
          validator: (v) =>
              v != null && v.length >= 8 ? null : 'Too short',
        )),
      );
      await tester.pump();
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
      expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
    });

    testWidgets('shows error text after user interaction', (tester) async {
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
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

    testWidgets('shows explicit errorText override', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(
          labelText: 'Password',
          errorText: 'Incorrect password',
        )),
      );
      expect(find.text('Incorrect password'), findsOneWidget);
    });

    // -----------------------------------------------------------------------
    // isValid override
    // -----------------------------------------------------------------------

    testWidgets('isValid: true forces checkmark regardless of validator',
        (tester) async {
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          isValid: true,
          validator: (_) => 'Always invalid',
        )),
      );
      expect(find.byIcon(Icons.check_circle_outline), findsOneWidget);
    });

    testWidgets('isValid: false suppresses checkmark even when validator passes',
        (tester) async {
      final controller = TextEditingController(text: 'hunter2');
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          controller: controller,
          isValid: false,
          validator: (_) => null,
        )),
      );
      await tester.pump();
      expect(find.byIcon(Icons.check_circle_outline), findsNothing);
    });

    // -----------------------------------------------------------------------
    // Form integration
    // -----------------------------------------------------------------------

    testWidgets('Form.validate() returns true when validator passes',
        (tester) async {
      final formKey = GlobalKey<FormState>();
      final controller = TextEditingController(text: 'S3cur3P@ss');
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: Form(
              key: formKey,
              child: VisorPasswordInput(
                labelText: 'Password',
                controller: controller,
                validator: (v) =>
                    v != null && v.length >= 8 ? null : 'Too short',
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
              child: VisorPasswordInput(
                labelText: 'Password',
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
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          onChanged: (v) => lastValue = v,
        )),
      );
      await tester.enterText(find.byType(TextFormField), 'hunter2');
      expect(lastValue, 'hunter2');
    });

    // -----------------------------------------------------------------------
    // Token usage — no hard-coded values
    // -----------------------------------------------------------------------

    testWidgets('widget builds without hard-coded color references',
        (tester) async {
      // Static analysis (flutter analyze) enforces the actual token rule.
      // This test verifies the widget renders without throwing.
      await tester.pumpWidget(
        _wrap(VisorPasswordInput(
          labelText: 'Password',
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        )),
      );
      expect(find.byType(VisorPasswordInput), findsOneWidget);
    });
  });

  // -------------------------------------------------------------------------
  // meetsGuideline (R11) — tap-target + labeled-tap coverage
  // -------------------------------------------------------------------------

  group('meetsGuideline (R11)', () {
    testWidgets(
        'default password input meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'password input in error state meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(
          labelText: 'Password',
          errorText: 'Incorrect password',
        )),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'password input with isValid override meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(
          labelText: 'Password',
          isValid: true,
        )),
      );
      await tester.pump();
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    // Rec5 — textContrastGuideline (VI-257)

    testWidgets('default password input renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(labelText: 'Password')),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });

    testWidgets('password input in error state renders with sufficient text contrast',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPasswordInput(
          labelText: 'Password',
          errorText: 'Incorrect password',
        )),
      );
      await expectLater(tester, meetsGuideline(textContrastGuideline));
      handle.dispose();
    });
  });
}
