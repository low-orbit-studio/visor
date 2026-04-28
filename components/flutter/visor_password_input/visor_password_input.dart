import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

import '../visor_text_input/visor_text_input.dart';

/// Password input with a show/hide eye toggle, composed on top of
/// [VisorTextInput] per the Visor two-layer distribution model.
///
/// The eye toggle occupies the suffix slot of the underlying [VisorTextInput].
/// When the field has a valid value, the checkmark appears first; the toggle
/// is always present. All visual properties read from Visor token extensions —
/// zero hard-coded values.
///
/// ## Basic usage
///
/// ```dart
/// VisorPasswordInput(
///   labelText: 'Password',
///   validator: (v) =>
///       v != null && v.length >= 8 ? null : 'Minimum 8 characters',
/// )
/// ```
///
/// ## Form integration
///
/// ```dart
/// VisorPasswordInput(
///   labelText: 'Confirm password',
///   autovalidateMode: AutovalidateMode.onUserInteraction,
///   validator: (v) =>
///       v == _passwordController.text ? null : 'Passwords must match',
/// )
/// ```
class VisorPasswordInput extends StatefulWidget {
  const VisorPasswordInput({
    required this.labelText,
    this.controller,
    this.focusNode,
    this.errorText,
    this.onChanged,
    this.onFieldSubmitted,
    this.validator,
    this.textInputAction,
    this.autofocus = false,
    this.enabled = true,
    this.autovalidateMode,
    this.isValid,
    this.semanticLabel,
    super.key,
  });

  /// The label that floats to the top when the field is focused or filled.
  final String labelText;

  /// Optional external controller. When omitted, an internal controller is
  /// created and managed by the underlying [VisorTextInput].
  final TextEditingController? controller;

  /// Optional external focus node. When omitted, an internal node is managed.
  final FocusNode? focusNode;

  /// Overrides the error message shown below the field. When non-null this
  /// takes precedence over the string returned by [validator].
  final String? errorText;

  /// Called each time the field's text changes.
  final ValueChanged<String>? onChanged;

  /// Called when the user submits the field (keyboard action / done).
  final ValueChanged<String>? onFieldSubmitted;

  /// Synchronous validator forwarded to [VisorTextInput]. Returns `null` for
  /// valid; an error string for invalid.
  final String? Function(String?)? validator;

  /// Keyboard action button type.
  final TextInputAction? textInputAction;

  /// Whether the field should request focus on build.
  final bool autofocus;

  /// When false the field is rendered with reduced opacity and ignores input.
  final bool enabled;

  /// When to run validation. Defaults to [AutovalidateMode.onUserInteraction].
  final AutovalidateMode? autovalidateMode;

  /// Explicit valid/invalid override for async validation scenarios.
  ///
  /// - `null` (default) — derives the state from [validator].
  /// - `true`  — forces the valid (checkmark) state.
  /// - `false` — forces the non-valid state regardless of [validator] output.
  final bool? isValid;

  /// Accessibility label for screen readers. Defaults to [labelText].
  final String? semanticLabel;

  @override
  State<VisorPasswordInput> createState() => _VisorPasswordInputState();
}

class _VisorPasswordInputState extends State<VisorPasswordInput> {
  bool _obscureText = true;

  void _toggleObscureText() {
    setState(() => _obscureText = !_obscureText);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final opacity = context.visorOpacity;

    final eyeTooltip = _obscureText ? 'Show password' : 'Hide password';

    // Reduce-motion is handled inside VisorTextInput; no animation here.
    final toggleButton = Semantics(
      button: true,
      label: eyeTooltip,
      excludeSemantics: true,
      child: GestureDetector(
        onTap: widget.enabled ? _toggleObscureText : null,
        child: Padding(
          padding: EdgeInsets.only(right: spacing.md),
          child: Opacity(
            opacity: widget.enabled ? 1.0 : opacity.alpha50,
            child: Icon(
              _obscureText
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: colors.textTertiary,
              size: 20,
              semanticLabel: eyeTooltip,
            ),
          ),
        ),
      ),
    );

    return VisorTextInput(
      labelText: widget.labelText,
      controller: widget.controller,
      focusNode: widget.focusNode,
      errorText: widget.errorText,
      onChanged: widget.onChanged,
      onFieldSubmitted: widget.onFieldSubmitted,
      validator: widget.validator,
      textInputAction: widget.textInputAction,
      autofocus: widget.autofocus,
      enabled: widget.enabled,
      // Password fields must not autocorrect or suggest.
      autocorrect: false,
      enableSuggestions: false,
      autovalidateMode: widget.autovalidateMode,
      isValid: widget.isValid,
      semanticLabel: widget.semanticLabel,
      obscureText: _obscureText,
      suffixWidget: toggleButton,
    );
  }
}
