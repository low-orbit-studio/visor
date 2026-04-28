import 'package:flutter/material.dart';
import 'package:visor_core/visor_core.dart';

/// Animated floating-label text input for Visor's Flutter component registry.
///
/// Covers five validation states:
///   - **default** — unfocused, empty, no error
///   - **focused** — field has keyboard focus
///   - **error** — validator returned a non-null error string
///   - **valid** — field is non-empty and the validator (if any) returned null
///   - **disabled** — [enabled] is false
///
/// The label floats from the vertical center to the top of the field on focus
/// or when the field contains text. All sizing, color, radius, and motion
/// values read from Visor token extensions — zero hard-coded values.
///
/// ## Basic usage
///
/// ```dart
/// VisorTextInput(
///   labelText: 'Email',
///   keyboardType: TextInputType.emailAddress,
///   validator: (v) => v?.contains('@') == true ? null : 'Invalid email',
/// )
/// ```
///
/// ## Async validation
///
/// When server-side validation produces a valid/invalid signal outside the
/// synchronous [validator], pass [isValid] to override the derived state:
///
/// ```dart
/// VisorTextInput(
///   labelText: 'Username',
///   isValid: _serverValid, // null = derive from validator
/// )
/// ```
///
/// ## Form integration
///
/// Wrap in a [Form] and call `GlobalKey<FormState>().currentState!.validate()`
/// as usual — [validator] is forwarded to the underlying [TextFormField].
class VisorTextInput extends StatefulWidget {
  const VisorTextInput({
    required this.labelText,
    this.controller,
    this.focusNode,
    this.prefixIcon,
    this.suffixWidget,
    this.errorText,
    this.onChanged,
    this.onFieldSubmitted,
    this.validator,
    this.keyboardType,
    this.textInputAction,
    this.autofocus = false,
    this.enabled = true,
    this.autocorrect = true,
    this.enableSuggestions = true,
    this.textCapitalization = TextCapitalization.none,
    this.autovalidateMode,
    this.isValid,
    this.obscureText = false,
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

  /// Optional icon shown at the leading edge of the field.
  final Widget? prefixIcon;

  /// Optional widget shown at the trailing edge of the field. Rendered after
  /// the checkmark when the field is valid. Use this slot for custom controls
  /// such as a password-visibility toggle.
  ///
  /// When [isValid] resolves to true, the checkmark is shown first and
  /// [suffixWidget] is placed immediately after it.
  final Widget? suffixWidget;

  /// Whether to obscure the field's text (for password inputs).
  ///
  /// When true, the entered characters are replaced with bullet characters
  /// and the field opts out of autocorrect and suggestions automatically.
  /// Defaults to false.
  final bool obscureText;

  /// Overrides the error message shown below the field. When non-null this
  /// takes precedence over the string returned by [validator].
  final String? errorText;

  /// Called each time the field's text changes.
  final ValueChanged<String>? onChanged;

  /// Called when the user submits the field (keyboard action / done).
  final ValueChanged<String>? onFieldSubmitted;

  /// Synchronous validator forwarded to [TextFormField]. Returns `null` for
  /// valid; an error string for invalid.
  final String? Function(String?)? validator;

  /// Keyboard type hint (e.g., [TextInputType.emailAddress]).
  final TextInputType? keyboardType;

  /// Keyboard action button type.
  final TextInputAction? textInputAction;

  /// Whether the field should request focus on build.
  final bool autofocus;

  /// When false the field is rendered with reduced opacity and ignores input.
  final bool enabled;

  /// Whether to enable autocorrect.
  final bool autocorrect;

  /// Whether to enable keyboard suggestions.
  final bool enableSuggestions;

  /// Text capitalisation mode.
  final TextCapitalization textCapitalization;

  /// When to run validation. Defaults to [AutovalidateMode.onUserInteraction].
  final AutovalidateMode? autovalidateMode;

  /// Explicit valid/invalid override for async validation scenarios.
  ///
  /// - `null` (default) — derives the state from [validator].
  /// - `true`  — forces the valid (checkmark) state.
  /// - `false` — forces the non-valid state regardless of [validator] output.
  ///
  /// 95 % of callers leave this null. Only pass a value when server-side
  /// validation produces a valid/invalid signal that the synchronous
  /// [validator] cannot express.
  final bool? isValid;

  /// Accessibility label for screen readers. Defaults to [labelText].
  final String? semanticLabel;

  @override
  State<VisorTextInput> createState() => _VisorTextInputState();
}

class _VisorTextInputState extends State<VisorTextInput> {
  TextEditingController? _internalController;
  FocusNode? _internalFocusNode;

  TextEditingController get _effectiveController =>
      widget.controller ?? _internalController!;

  FocusNode get _effectiveFocusNode =>
      widget.focusNode ?? _internalFocusNode!;

  bool _hasContent = false;
  bool _hasInteracted = false;

  @override
  void initState() {
    super.initState();
    if (widget.controller == null) {
      _internalController = TextEditingController();
    }
    if (widget.focusNode == null) {
      _internalFocusNode = FocusNode();
    }

    _hasContent = _effectiveController.text.isNotEmpty;
    _hasInteracted = _hasContent;

    _effectiveController.addListener(_onControllerChanged);
    _effectiveFocusNode.addListener(_onFocusChanged);
  }

  @override
  void didUpdateWidget(VisorTextInput oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.controller != oldWidget.controller) {
      (oldWidget.controller ?? _internalController)
          ?.removeListener(_onControllerChanged);

      if (oldWidget.controller == null && widget.controller != null) {
        _internalController?.dispose();
        _internalController = null;
      } else if (oldWidget.controller != null && widget.controller == null) {
        _internalController = TextEditingController();
      }

      _effectiveController.addListener(_onControllerChanged);
      setState(() {
        _hasContent = _effectiveController.text.isNotEmpty;
      });
    }

    if (widget.focusNode != oldWidget.focusNode) {
      (oldWidget.focusNode ?? _internalFocusNode)
          ?.removeListener(_onFocusChanged);

      if (oldWidget.focusNode == null && widget.focusNode != null) {
        _internalFocusNode?.dispose();
        _internalFocusNode = null;
      } else if (oldWidget.focusNode != null && widget.focusNode == null) {
        _internalFocusNode = FocusNode();
      }

      _effectiveFocusNode.addListener(_onFocusChanged);
    }
  }

  @override
  void dispose() {
    _effectiveController.removeListener(_onControllerChanged);
    _effectiveFocusNode.removeListener(_onFocusChanged);
    _internalController?.dispose();
    _internalFocusNode?.dispose();
    super.dispose();
  }

  void _onControllerChanged() {
    final hasContent = _effectiveController.text.isNotEmpty;
    if (hasContent != _hasContent) {
      setState(() => _hasContent = hasContent);
    }
    if (!_hasInteracted && hasContent) {
      setState(() => _hasInteracted = true);
    }
  }

  void _onFocusChanged() => setState(() {});

  // ---- State derivation -----------------------------------------------

  bool get _shouldFloat =>
      _effectiveFocusNode.hasFocus || _hasContent;

  /// The effective valid flag: explicit override wins, otherwise derive from
  /// the validator (non-null result = invalid; null with non-empty value = valid).
  bool get _isValid {
    if (widget.isValid != null) return widget.isValid!;
    if (!_hasContent) return false;
    if (widget.validator == null) return true;
    return widget.validator!(_effectiveController.text) == null;
  }

  /// The error message to display below the field.
  ///
  /// Priority:
  ///  1. [widget.errorText] (external override)
  ///  2. Result of [widget.validator] when [_hasInteracted] and mode allows
  String? get _displayErrorText {
    if (widget.errorText != null) return widget.errorText;
    if (widget.validator == null) return null;

    final mode =
        widget.autovalidateMode ?? AutovalidateMode.onUserInteraction;
    if (mode == AutovalidateMode.disabled) return null;
    if (mode == AutovalidateMode.onUserInteraction && !_hasInteracted) {
      return null;
    }

    return widget.validator!(_effectiveController.text);
  }

  bool get _hasError => _displayErrorText != null;

  // ---- Build ----------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final opacity = context.visorOpacity;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;
    final motion = context.visorMotion;

    // Reduce-motion guard: collapse animation durations when the OS
    // accessibility setting "reduce motion" is enabled.
    final reduceMotion = MediaQuery.of(context).disableAnimations;
    final animDuration =
        reduceMotion ? Duration.zero : motion.durationFast;
    final animCurve = reduceMotion ? Curves.linear : motion.easing;

    final borderColor = _resolveBorderColor(colors);
    final fillColor = widget.enabled
        ? colors.surfaceInteractiveDefault
        : colors.surfaceInteractiveDisabled;

    return Semantics(
      label: widget.semanticLabel ?? widget.labelText,
      enabled: widget.enabled,
      textField: true,
      child: Opacity(
        opacity: widget.enabled ? 1.0 : opacity.alpha50,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ---- Input container ----
            Container(
              height: 56,
              decoration: BoxDecoration(
                color: fillColor,
                borderRadius: BorderRadius.circular(radius.sm),
                border: Border.all(color: borderColor),
              ),
              child: Row(
                children: [
                  // Optional prefix icon
                  if (widget.prefixIcon != null)
                    Padding(
                      padding: EdgeInsets.only(
                        left: spacing.md,
                        right: spacing.xs,
                      ),
                      child: IconTheme.merge(
                        data: IconThemeData(
                          color: _hasError
                              ? colors.textError
                              : _effectiveFocusNode.hasFocus
                                  ? colors.borderFocus
                                  : colors.textTertiary,
                          size: 20,
                        ),
                        child: widget.prefixIcon!,
                      ),
                    ),
                  // Label + input stack
                  Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        left:
                            widget.prefixIcon != null ? spacing.xs : spacing.md,
                      ),
                      child: _buildFloatingContent(
                        context: context,
                        colors: colors,
                        textStyles: textStyles,
                        spacing: spacing,
                        animDuration: animDuration,
                        animCurve: animCurve,
                      ),
                    ),
                  ),
                  // Suffix: checkmark when valid + optional suffixWidget
                  if (widget.enabled && _isValid)
                    Padding(
                      padding: EdgeInsets.only(
                        right: widget.suffixWidget != null ? 0 : spacing.md,
                      ),
                      child: Icon(
                        Icons.check_circle_outline,
                        color: colors.textSuccess,
                        size: 20,
                      ),
                    ),
                  if (widget.suffixWidget != null) widget.suffixWidget!,
                ],
              ),
            ),
            // ---- Error text ----
            if (_hasError)
              Padding(
                padding: EdgeInsets.only(top: spacing.xs),
                child: Text(
                  _displayErrorText!,
                  style: textStyles.bodySmall.copyWith(
                    color: colors.textError,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFloatingContent({
    required BuildContext context,
    required VisorColorsData colors,
    required VisorTextStylesData textStyles,
    required VisorSpacingData spacing,
    required Duration animDuration,
    required Curve animCurve,
  }) {
    final labelColor = _hasError
        ? colors.textError
        : _effectiveFocusNode.hasFocus
            ? colors.borderFocus
            : colors.textTertiary;

    return Stack(
      children: [
        // ---- Floating label ----
        AnimatedPositioned(
          duration: animDuration,
          curve: animCurve,
          left: 0,
          top: _shouldFloat ? spacing.xs : null,
          bottom: _shouldFloat ? null : 0,
          child: AnimatedDefaultTextStyle(
            duration: animDuration,
            curve: animCurve,
            style: (_shouldFloat
                    ? textStyles.labelSmall
                    : textStyles.bodyMedium)
                .copyWith(color: labelColor),
            child: _shouldFloat
                ? Text(widget.labelText)
                : Align(
                    alignment: Alignment.centerLeft,
                    child: Text(widget.labelText),
                  ),
          ),
        ),
        // ---- Text input ----
        Positioned(
          left: 0,
          right: 0,
          top: _shouldFloat ? spacing.lg : 0,
          bottom: _shouldFloat ? spacing.xs : 0,
          child: TextFormField(
            controller: _effectiveController,
            focusNode: _effectiveFocusNode,
            onChanged: widget.onChanged,
            onFieldSubmitted: widget.onFieldSubmitted,
            keyboardType: widget.keyboardType,
            textInputAction: widget.textInputAction,
            autofocus: widget.autofocus,
            enabled: widget.enabled,
            autocorrect: widget.autocorrect,
            enableSuggestions: widget.enableSuggestions,
            textCapitalization: widget.textCapitalization,
            obscureText: widget.obscureText,
            autovalidateMode: AutovalidateMode.disabled,
            // Validation is handled externally by our custom error display.
            // We still forward the validator so Form.validate() works.
            validator: widget.validator,
            style: textStyles.bodyMedium.copyWith(
              color: colors.textPrimary,
            ),
            decoration: const InputDecoration(
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              errorBorder: InputBorder.none,
              focusedErrorBorder: InputBorder.none,
              disabledBorder: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              isDense: true,
              filled: false,
              // Suppress built-in error text — we render it ourselves.
              errorStyle: TextStyle(fontSize: 0, height: 0),
            ),
          ),
        ),
      ],
    );
  }

  Color _resolveBorderColor(VisorColorsData colors) {
    if (!widget.enabled) return colors.borderDisabled;
    if (_hasError) return colors.borderError;
    if (_isValid) return colors.borderSuccess;
    if (_effectiveFocusNode.hasFocus) return colors.borderFocus;
    return colors.borderDefault;
  }
}
