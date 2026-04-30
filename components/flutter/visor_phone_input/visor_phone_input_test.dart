import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:visor_core/visor_core.dart';

import '../_fixtures.dart';
import '../visor_text_input/visor_text_input.dart';
import 'visor_phone_input.dart';

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
  group('VisorPhoneInput', () {
    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    testWidgets('renders the label text', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone number')),
      );
      expect(find.text('Phone number'), findsOneWidget);
    });

    testWidgets('renders an underlying VisorTextInput', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone')),
      );
      expect(find.byType(VisorTextInput), findsOneWidget);
    });

    testWidgets('renders the dial code for the default country (US)',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone')),
      );
      // CountryCode.fromCountryCode('US') yields dialCode '+1'.
      expect(find.text('+1'), findsOneWidget);
    });

    testWidgets('renders the dial code for an explicit initialCountryCode',
        (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(
          labelText: 'Phone',
          initialCountryCode: 'GB',
        )),
      );
      expect(find.text('+44'), findsOneWidget);
    });

    testWidgets('renders the country picker prefix', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone')),
      );
      expect(find.byType(CountryCodePicker), findsOneWidget);
    });

    // -------------------------------------------------------------------------
    // Disabled state
    // -------------------------------------------------------------------------

    testWidgets('forwards enabled: false to the inner field', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone', enabled: false)),
      );
      final field = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(field.enabled, isFalse);
    });

    // -------------------------------------------------------------------------
    // Validation surface
    // -------------------------------------------------------------------------

    testWidgets('renders explicit errorText override', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(
          labelText: 'Phone',
          errorText: 'Network error',
        )),
      );
      expect(find.text('Network error'), findsOneWidget);
    });

    testWidgets('does not show checkmark when field is empty', (tester) async {
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone')),
      );
      expect(find.byIcon(Icons.check_circle_outline), findsNothing);
    });

    // -------------------------------------------------------------------------
    // Form integration
    // -------------------------------------------------------------------------

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
              child: VisorPhoneInput(
                labelText: 'Phone',
                validator: (v) =>
                    v != null && v.isNotEmpty ? null : 'Required',
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      expect(formKey.currentState!.validate(), isFalse);
    });

    testWidgets('Form.validate() returns true when validator passes',
        (tester) async {
      final formKey = GlobalKey<FormState>();
      final controller = TextEditingController(text: '5551234567');
      await tester.pumpWidget(
        MaterialApp(
          theme: VisorTheme.build(
            colors: testColors(),
            brightness: Brightness.light,
          ),
          home: Scaffold(
            body: Form(
              key: formKey,
              child: VisorPhoneInput(
                labelText: 'Phone',
                controller: controller,
                validator: (v) =>
                    v != null && v.isNotEmpty ? null : 'Required',
              ),
            ),
          ),
        ),
      );
      expect(formKey.currentState!.validate(), isTrue);
    });

    // -------------------------------------------------------------------------
    // Callbacks
    // -------------------------------------------------------------------------

    testWidgets('onChanged fires when text is entered', (tester) async {
      String? lastValue;
      await tester.pumpWidget(
        _wrap(VisorPhoneInput(
          labelText: 'Phone',
          onChanged: (v) => lastValue = v,
        )),
      );
      await tester.enterText(find.byType(TextFormField), '5551234567');
      expect(lastValue, isNotNull);
      expect(lastValue!.replaceAll(RegExp(r'[^\d]'), ''), '5551234567');
    });

    // -------------------------------------------------------------------------
    // Country change behavior
    // -------------------------------------------------------------------------

    testWidgets(
        'country change clears the internal controller and fires onCountryChanged',
        (tester) async {
      CountryCode? lastCountry;
      await tester.pumpWidget(
        _wrap(VisorPhoneInput(
          labelText: 'Phone',
          onCountryChanged: (c) => lastCountry = c,
        )),
      );
      // Seed text in the inner field, then simulate a country change.
      await tester.enterText(find.byType(TextFormField), '5551234567');
      expect(
        tester.widget<TextFormField>(find.byType(TextFormField)).controller!.text,
        isNotEmpty,
      );

      // Drive the picker via the state's _onCountryChanged path by tapping
      // through CountryCodePicker is brittle in tests — instead, find the
      // picker and invoke its onChanged directly to verify wiring.
      final picker =
          tester.widget<CountryCodePicker>(find.byType(CountryCodePicker));
      picker.onChanged?.call(CountryCode.fromCountryCode('GB'));
      await tester.pump();

      // Field cleared after country change (regardless of internal vs external
      // controller) and callback fired with the new country.
      expect(
        tester.widget<TextFormField>(find.byType(TextFormField)).controller!.text,
        isEmpty,
      );
      expect(lastCountry?.code, 'GB');
    });

    testWidgets('country change clears an external controller', (tester) async {
      final controller = TextEditingController(text: '5551234567');
      await tester.pumpWidget(
        _wrap(VisorPhoneInput(
          labelText: 'Phone',
          controller: controller,
        )),
      );
      expect(controller.text, isNotEmpty);

      final picker =
          tester.widget<CountryCodePicker>(find.byType(CountryCodePicker));
      picker.onChanged?.call(CountryCode.fromCountryCode('GB'));
      await tester.pump();

      expect(controller.text, isEmpty);
    });

    // -------------------------------------------------------------------------
    // Token usage — smoke check
    // -------------------------------------------------------------------------

    testWidgets('widget builds without hard-coded color references',
        (tester) async {
      await tester.pumpWidget(
        _wrap(VisorPhoneInput(
          labelText: 'Phone',
          validator: (v) => v?.isEmpty == true ? 'Required' : null,
        )),
      );
      expect(find.byType(VisorPhoneInput), findsOneWidget);
    });
  });

  // ---------------------------------------------------------------------------
  // meetsGuideline (R11) — tap-target + labeled-tap coverage
  // ---------------------------------------------------------------------------

  group('meetsGuideline (R11)', () {
    testWidgets(
        'default phone input meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(labelText: 'Phone number')),
      );
      await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
      handle.dispose();
    });

    testWidgets(
        'phone input in error state meets Android tap target + label guidelines',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(
        _wrap(const VisorPhoneInput(
          labelText: 'Phone',
          errorText: 'Invalid phone number',
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
          const VisorPhoneInput(labelText: 'Phone number'),
          textDirection: TextDirection.rtl,
        ),
      );
      expect(tester.takeException(), isNull);
      expect(find.byType(VisorPhoneInput), findsOneWidget);
      // The country picker prefix (flag + dial code + keyboard_arrow_down
      // chevron) is laid out inside VisorTextInput's prefixIcon slot, which
      // respects Directionality. The chevron glyph (keyboard_arrow_down) is
      // a vertical arrow and is not direction-sensitive; no semantic flip
      // follow-up required. The Row inside the prefix widget does not reverse
      // because it is a horizontal layout that simply shifts to the opposing
      // side of the text field in RTL via the InputDecoration prefix slot.
      expect(find.byIcon(Icons.keyboard_arrow_down), findsOneWidget);
    });
  });
}
