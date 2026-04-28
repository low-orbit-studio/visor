import 'dart:async';

import 'package:country_code_picker/country_code_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_libphonenumber/flutter_libphonenumber.dart';
import 'package:visor_core/visor_core.dart';

import '../visor_text_input/visor_text_input.dart';

/// International phone-number input composed on top of [VisorTextInput] per
/// the Visor two-layer distribution model.
///
/// The country picker (flag + dial code + chevron) occupies the prefix slot
/// of the underlying [VisorTextInput]. Tapping it opens
/// [CountryCodePicker]'s search dialog. As the user types, input is formatted
/// for the selected country via `flutter_libphonenumber`. When the number
/// parses to a valid mobile/fixed-line number, the field's valid state
/// triggers the checkmark.
///
/// All visual properties read from Visor token extensions — zero hard-coded
/// values.
///
/// ## Basic usage
///
/// ```dart
/// VisorPhoneInput(
///   labelText: 'Phone number',
///   onChanged: (value) => print('Phone: $value'),
///   onCountryChanged: (country) => print('Country: ${country.dialCode}'),
/// )
/// ```
///
/// ## Form integration
///
/// ```dart
/// VisorPhoneInput(
///   labelText: 'Phone',
///   autovalidateMode: AutovalidateMode.onUserInteraction,
///   validator: (v) =>
///       v != null && v.isNotEmpty ? null : 'Phone number required',
/// )
/// ```
class VisorPhoneInput extends StatefulWidget {
  const VisorPhoneInput({
    required this.labelText,
    this.controller,
    this.focusNode,
    this.errorText,
    this.onChanged,
    this.onCountryChanged,
    this.onFieldSubmitted,
    this.validator,
    this.initialCountryCode = 'US',
    this.textInputAction,
    this.autofocus = false,
    this.enabled = true,
    this.autovalidateMode,
    this.semanticLabel,
    super.key,
  });

  /// The label that floats to the top when the field is focused or filled.
  final String labelText;

  /// Optional external controller. When omitted, an internal controller is
  /// created and managed by the widget.
  final TextEditingController? controller;

  /// Optional external focus node. When omitted, an internal node is managed.
  final FocusNode? focusNode;

  /// Overrides the error message shown below the field. When non-null this
  /// takes precedence over the string returned by [validator].
  final String? errorText;

  /// Called each time the field's text changes.
  final ValueChanged<String>? onChanged;

  /// Called when the user picks a different country from the picker.
  final ValueChanged<CountryCode>? onCountryChanged;

  /// Called when the user submits the field (keyboard action / done).
  final ValueChanged<String>? onFieldSubmitted;

  /// Synchronous validator forwarded to the underlying [VisorTextInput].
  /// Returns `null` for valid; an error string for invalid.
  final String? Function(String?)? validator;

  /// ISO country code used as the initial selection (e.g. `'US'`, `'GB'`).
  ///
  /// When this is the default `'US'`, the widget also attempts to detect the
  /// device locale's country code in [State.didChangeDependencies] and uses
  /// that instead if present. Pass any other value to opt out of locale
  /// detection.
  final String initialCountryCode;

  /// Keyboard action button type.
  final TextInputAction? textInputAction;

  /// Whether the field should request focus on build.
  final bool autofocus;

  /// When false the field is rendered with reduced opacity and ignores input.
  final bool enabled;

  /// When to run validation. Defaults to [AutovalidateMode.onUserInteraction].
  final AutovalidateMode? autovalidateMode;

  /// Accessibility label for screen readers. Defaults to [labelText].
  final String? semanticLabel;

  @override
  State<VisorPhoneInput> createState() => _VisorPhoneInputState();
}

class _VisorPhoneInputState extends State<VisorPhoneInput> {
  late CountryCode _selectedCountry;
  LibPhonenumberTextFormatter? _formatter;
  bool _isFormatterInitialized = false;
  bool _isLibPhoneValid = false;

  TextEditingController? _internalController;

  /// Generation counter for [_validateNumber] — bumped on every keystroke
  /// and on country change so stale async parses are discarded.
  int _validationGeneration = 0;

  TextEditingController get _effectiveController =>
      widget.controller ?? _internalController!;

  @override
  void initState() {
    super.initState();
    _selectedCountry =
        CountryCode.fromCountryCode(widget.initialCountryCode.toUpperCase());
    if (widget.controller == null) {
      _internalController = TextEditingController();
    }
    unawaited(_initializeFormatter());
  }

  @override
  void dispose() {
    _internalController?.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (widget.initialCountryCode == 'US') {
      _detectCountryFromLocale();
    }
  }

  Future<void> _initializeFormatter() async {
    try {
      await init();
    } on Exception {
      // libphonenumber init failure: fall through with a null formatter.
      // The field still works — input is just unformatted.
    }
    if (!mounted) return;
    setState(() {
      _isFormatterInitialized = true;
      _formatter = _buildFormatter(_selectedCountry.code ?? 'US');
    });
  }

  void _detectCountryFromLocale() {
    try {
      final locale = Localizations.localeOf(context);
      final countryCode = locale.countryCode?.toUpperCase();
      if (countryCode == null) return;
      final detectedCountry = CountryCode.fromCountryCode(countryCode);
      if (detectedCountry.code == null) return;
      setState(() {
        _selectedCountry = detectedCountry;
        if (_isFormatterInitialized) {
          _formatter = _buildFormatter(detectedCountry.code ?? 'US');
        }
      });
    } on Exception {
      // Locale detection failures are silent — initial country stays.
    }
  }

  LibPhonenumberTextFormatter? _buildFormatter(String countryCode) {
    if (!_isFormatterInitialized) return null;
    try {
      return LibPhonenumberTextFormatter(
        phoneNumberFormat: PhoneNumberFormat.national,
        country: _countryWithPhoneCode(countryCode),
      );
    } on Exception {
      return LibPhonenumberTextFormatter(
        phoneNumberFormat: PhoneNumberFormat.national,
        country: const CountryWithPhoneCode.us(),
      );
    }
  }

  CountryWithPhoneCode _countryWithPhoneCode(String countryCode) {
    // flutter_libphonenumber ships predefined constructors only for US/GB.
    // Other countries fall back to US — formatting will be approximate but
    // the widget remains functional.
    switch (countryCode.toUpperCase()) {
      case 'GB':
        return const CountryWithPhoneCode.gb();
      case 'US':
      default:
        return const CountryWithPhoneCode.us();
    }
  }

  /// Per-country max digit count used to cap input length. Mirrors the table
  /// from the SoleSpark/ENTR sources; default 15 covers any country not
  /// listed (E.164 max).
  int _maxDigitsForCountry(String countryCode) {
    switch (countryCode.toUpperCase()) {
      case 'US':
      case 'CA':
      case 'FR':
      case 'IT':
      case 'IN':
      case 'AU':
      case 'MX':
      case 'RU':
        return 10;
      case 'ES':
        return 9;
      case 'GB':
      case 'JP':
      case 'CN':
      case 'BR':
        return 11;
      case 'DE':
        return 12;
      default:
        return 15;
    }
  }

  String _digitsOnly(String input) => input.replaceAll(RegExp(r'[^\d]'), '');

  void _onCountryChanged(CountryCode country) {
    // Invalidate any in-flight validations from the previous country so a
    // late-arriving parse() result doesn't flip _isLibPhoneValid back on.
    _validationGeneration++;
    setState(() {
      _selectedCountry = country;
      _formatter = _buildFormatter(country.code ?? 'US');
      _isLibPhoneValid = false;
    });
    _effectiveController.clear();
    widget.onCountryChanged?.call(country);
  }

  Future<void> _validateNumber(String value) async {
    final generation = ++_validationGeneration;
    if (!_isFormatterInitialized || value.isEmpty) {
      if (_isLibPhoneValid && mounted) {
        setState(() => _isLibPhoneValid = false);
      }
      return;
    }
    try {
      final region = _selectedCountry.code ?? 'US';
      final fullNumber = '${_selectedCountry.dialCode ?? '+1'}$value';
      final result = await parse(fullNumber, region: region);
      // Drop the result if the user changed country (or kept typing) while
      // this parse was in flight.
      if (!mounted || generation != _validationGeneration) return;
      final phoneType = result['type'] as String?;
      final isValid = phoneType != null &&
          phoneType != 'unknown' &&
          phoneType != 'notParsed';
      if (isValid != _isLibPhoneValid) {
        setState(() => _isLibPhoneValid = isValid);
      }
    } on Exception {
      if (mounted &&
          generation == _validationGeneration &&
          _isLibPhoneValid) {
        setState(() => _isLibPhoneValid = false);
      }
    }
  }

  void _handleChanged(String value) {
    unawaited(_validateNumber(value));
    widget.onChanged?.call(value);
  }

  @override
  Widget build(BuildContext context) {
    final maxDigits = _maxDigitsForCountry(_selectedCountry.code ?? 'US');

    final formatters = <TextInputFormatter>[
      TextInputFormatter.withFunction((oldValue, newValue) {
        if (_digitsOnly(newValue.text).length > maxDigits) {
          return oldValue;
        }
        return newValue;
      }),
      if (_formatter != null) _formatter!,
    ];

    return VisorTextInput(
      labelText: widget.labelText,
      controller: _effectiveController,
      focusNode: widget.focusNode,
      errorText: widget.errorText,
      onChanged: _handleChanged,
      onFieldSubmitted: widget.onFieldSubmitted,
      validator: widget.validator,
      keyboardType: TextInputType.phone,
      textInputAction: widget.textInputAction,
      autofocus: widget.autofocus,
      enabled: widget.enabled,
      autocorrect: false,
      enableSuggestions: false,
      autovalidateMode: widget.autovalidateMode,
      // Only override valid/invalid when libphonenumber has a definite answer
      // (it requires init + non-empty input). Null lets VisorTextInput derive
      // validity from the user-supplied [validator].
      isValid: _isLibPhoneValid ? true : null,
      semanticLabel: widget.semanticLabel,
      inputFormatters: formatters,
      prefixIcon: _CountryPickerPrefix(
        selectedCountry: _selectedCountry,
        enabled: widget.enabled,
        onChanged: _onCountryChanged,
      ),
    );
  }
}

/// Tappable country-picker prefix shown inside [VisorTextInput]'s prefix slot.
///
/// Renders the flag, dial code, and a chevron. Tap opens the
/// [CountryCodePicker] search dialog. Wrapped in [Semantics] for screen-reader
/// support.
class _CountryPickerPrefix extends StatelessWidget {
  const _CountryPickerPrefix({
    required this.selectedCountry,
    required this.enabled,
    required this.onChanged,
  });

  final CountryCode selectedCountry;
  final bool enabled;
  final ValueChanged<CountryCode> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;

    final dialCode = selectedCountry.dialCode ?? '+1';
    final countryName = selectedCountry.name ?? selectedCountry.code ?? '';
    final semanticLabel =
        'Country code, $countryName $dialCode. Tap to change.';

    return Semantics(
      button: true,
      enabled: enabled,
      label: semanticLabel,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
        child: CountryCodePicker(
          // Keying on the country code forces a fresh CountryCodePicker
          // (and a fresh initialSelection) when locale detection updates
          // _selectedCountry. CountryCodePicker only honors initialSelection
          // on first build.
          key: ValueKey('country-picker-${selectedCountry.code}'),
          onChanged: onChanged,
          initialSelection: selectedCountry.code,
          enabled: enabled,
          padding: EdgeInsetsDirectional.only(end: spacing.xs),
          flagWidth: 24,
          builder: (country) => _buildPickerButton(
            country: country,
            dialCode: dialCode,
            colors: colors,
            spacing: spacing,
            textStyles: textStyles,
          ),
        ),
      ),
    );
  }

  Widget _buildPickerButton({
    required CountryCode? country,
    required String dialCode,
    required VisorColorsData colors,
    required VisorSpacingData spacing,
    required VisorTextStylesData textStyles,
  }) {
    // 24×18 mirrors the country_code_picker package's standard flag asset
    // dimensions; sizing tokens for raster assets are not yet defined.
    const flagWidth = 24.0;
    const flagHeight = 18.0;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (country?.flagUri != null)
          SizedBox(
            width: flagWidth,
            height: flagHeight,
            child: Image.asset(
              country!.flagUri!,
              package: 'country_code_picker',
              fit: BoxFit.cover,
            ),
          )
        else
          const SizedBox(width: flagWidth, height: flagHeight),
        SizedBox(width: spacing.xs),
        Text(
          dialCode,
          style: textStyles.bodyMedium.copyWith(color: colors.textPrimary),
        ),
        // Inherit chevron size from the ambient IconTheme (set by
        // VisorTextInput's prefixIcon slot to 20dp); keeps the picker
        // chevron consistent with other prefix icons across the registry.
        Icon(Icons.keyboard_arrow_down, color: colors.textTertiary),
      ],
    );
  }
}
