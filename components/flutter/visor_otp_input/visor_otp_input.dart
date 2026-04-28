import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:visor_core/visor_core.dart';

/// A one-time-password input widget composed of [digitCount] individual digit
/// boxes.
///
/// ## Basic usage
///
/// ```dart
/// VisorOtpInput(
///   digitCount: 6,
///   onCodeComplete: (code) => _verify(code),
///   onCodeChanged: (partial) => _handleChange(partial),
/// )
/// ```
///
/// ## Programmatic clear
///
/// Expose a [GlobalKey] to call [VisorOtpInputState.clear]:
///
/// ```dart
/// final _otpKey = GlobalKey<VisorOtpInputState>();
///
/// VisorOtpInput(key: _otpKey, digitCount: 6, onCodeComplete: _verify)
///
/// // later:
/// _otpKey.currentState?.clear();
/// ```
///
/// ## Platform notes
///
/// On web (`kIsWeb`) a single hidden [TextField] is used to capture all input.
/// This avoids browsers intercepting backspace before Flutter sees it — a
/// regression observed in SoleSpark and Veronica without this branch.
///
/// On native, a [KeyboardListener] + per-digit [FocusNode] handles input
/// directly.
///
/// ## Theming
///
/// All colors, spacing, and radius values are read from:
/// - `context.visorColors` (`surfaceInteractiveDefault`, `surfaceAccentSubtle`,
///   `borderFocus`, `borderDefault`, `textPrimary`)
/// - `context.visorSpacing` (gap between digits)
/// - `context.visorRadius` (`sm` radius for digit boxes)
///
/// Zero hard-coded [Color] or [double] literals.
class VisorOtpInput extends StatefulWidget {
  const VisorOtpInput({
    super.key,
    this.digitCount = 6,
    this.onCodeComplete,
    this.onCodeChanged,
    this.enabled = true,
    this.autofocus = false,
    this.semanticLabel,
  }) : assert(digitCount > 0, 'digitCount must be at least 1');

  /// Number of digit boxes to render. Defaults to 6.
  final int digitCount;

  /// Fires once when all [digitCount] digits are filled in.
  /// Will not re-fire if the user modifies a digit after completion.
  final ValueChanged<String>? onCodeComplete;

  /// Fires on every individual digit entry, with the partial code so far.
  final ValueChanged<String>? onCodeChanged;

  /// When false all input is ignored. Useful for loading/submitting states.
  final bool enabled;

  /// Whether to request focus when the widget first mounts.
  final bool autofocus;

  /// Optional override for the row-level Semantics container label.
  ///
  /// Defaults to `'OTP code, $digitCount digits'`. Pass a domain-specific
  /// label (e.g. `'Two-factor authentication code, 6 digits'`) when the
  /// generic label would lack context for screen-reader users.
  final String? semanticLabel;

  @override
  VisorOtpInputState createState() => VisorOtpInputState();
}

/// Exposes [clear] so host screens can reset the OTP without rebuilding.
class VisorOtpInputState extends State<VisorOtpInput> {
  late List<String> _digits;
  late List<FocusNode> _focusNodes;
  late List<TextEditingController> _controllers;

  // Web-only: single hidden TextField that captures all keyboard input.
  late final TextEditingController _webController;
  late final FocusNode _webFocusNode;

  // Tracks which digit is currently active (used for visual state).
  int _focusedIndex = 0;

  // Guard so onCodeComplete fires only once per completion cycle.
  bool _completionFired = false;

  // Guards against recursive onChanged callbacks when we programmatically
  // update controller text inside _setDigit.
  bool _ignoreTextChanges = false;

  @override
  void initState() {
    super.initState();
    _digits = List.filled(widget.digitCount, '');
    _focusNodes = List.generate(widget.digitCount, (_) => FocusNode());
    _controllers =
        List.generate(widget.digitCount, (_) => TextEditingController());

    for (var i = 0; i < widget.digitCount; i++) {
      _focusNodes[i].addListener(() {
        if (_focusNodes[i].hasFocus) {
          setState(() => _focusedIndex = i);
        }
      });
    }

    _webController = TextEditingController();
    _webFocusNode = FocusNode();
  }

  @override
  void dispose() {
    for (final n in _focusNodes) {
      n.dispose();
    }
    for (final c in _controllers) {
      c.dispose();
    }
    _webController.dispose();
    _webFocusNode.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Resets all digit boxes to empty and moves focus to the first digit.
  void clear() {
    _ignoreTextChanges = true;
    setState(() {
      _digits = List.filled(widget.digitCount, '');
      for (final c in _controllers) {
        c.clear();
      }
      _focusedIndex = 0;
      _completionFired = false;
    });
    _ignoreTextChanges = false;
    if (widget.enabled) {
      if (kIsWeb) {
        _webFocusNode.requestFocus();
      } else {
        _focusNodes[0].requestFocus();
      }
    }
    widget.onCodeChanged?.call('');
  }

  // ---------------------------------------------------------------------------
  // Input handling — native
  // ---------------------------------------------------------------------------

  void _onNativeKeyEvent(int index, KeyEvent event) {
    if (_ignoreTextChanges) return;
    if (!widget.enabled) return;
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) return;

    if (event.logicalKey == LogicalKeyboardKey.backspace) {
      if (_digits[index].isNotEmpty) {
        _setDigit(index, '');
      } else if (index > 0) {
        _focusNodes[index - 1].requestFocus();
        _setDigit(index - 1, '');
      }
    }
  }

  void _onNativeTextChanged(int index, String text) {
    if (_ignoreTextChanges) return;
    if (!widget.enabled) return;
    if (text.isEmpty) return;

    // Accept only the last character to handle paste gracefully (D6).
    final char = text.substring(text.length - 1);
    if (!RegExp(r'\d').hasMatch(char)) {
      _ignoreTextChanges = true;
      _controllers[index].clear();
      _ignoreTextChanges = false;
      return;
    }

    _setDigit(index, char);

    if (index < widget.digitCount - 1) {
      _focusNodes[index + 1].requestFocus();
    } else {
      _focusNodes[index].unfocus();
    }
  }

  // ---------------------------------------------------------------------------
  // Input handling — web
  // ---------------------------------------------------------------------------

  void _onWebTextChanged(String text) {
    if (!widget.enabled) return;

    // The hidden TextField accumulates input. Process each new character.
    // We only care about the trailing characters not yet consumed.
    for (final char in text.characters) {
      if (!RegExp(r'\d').hasMatch(char)) continue;
      final nextEmpty = _digits.indexOf('');
      if (nextEmpty == -1) break;
      _setDigit(nextEmpty, char);
    }

    // Reset the hidden field so next keypress starts fresh.
    _webController.clear();
  }

  void _onWebKeyEvent(KeyEvent event) {
    if (!widget.enabled) return;
    if (event is! KeyDownEvent && event is! KeyRepeatEvent) return;

    if (event.logicalKey == LogicalKeyboardKey.backspace) {
      // Find the last filled digit and clear it.
      int target = -1;
      for (var i = widget.digitCount - 1; i >= 0; i--) {
        if (_digits[i].isNotEmpty) {
          target = i;
          break;
        }
      }
      if (target >= 0) {
        _setDigit(target, '');
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Shared state mutation
  // ---------------------------------------------------------------------------

  void _setDigit(int index, String value) {
    // Sync the controller text programmatically. Guard against the controller's
    // own onChanged listener firing recursively.
    _ignoreTextChanges = true;
    _controllers[index].text = value;
    _controllers[index].selection = TextSelection.fromPosition(
      TextPosition(offset: value.length),
    );
    _ignoreTextChanges = false;

    setState(() {
      _digits[index] = value;
      _focusedIndex = index;
    });

    final partial = _digits.join();
    widget.onCodeChanged?.call(partial);

    final allFilled = _digits.every((d) => d.isNotEmpty);
    if (value.isNotEmpty && allFilled) {
      if (!_completionFired) {
        _completionFired = true;
        widget.onCodeComplete?.call(partial);
      }
    } else {
      // Reset completion guard if a digit is cleared after full entry.
      _completionFired = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final spacing = context.visorSpacing;

    if (kIsWeb) {
      return _buildWeb(context, spacing);
    }
    return _buildNative(context, spacing);
  }

  Widget _buildNative(BuildContext context, VisorSpacingData spacing) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sizes = _calculateSizing(constraints.maxWidth, spacing);
        return Semantics(
          container: true,
          label: widget.semanticLabel ??
              'OTP code, ${widget.digitCount} digits',
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < widget.digitCount; i++) ...[
                if (i > 0) SizedBox(width: sizes.gap),
                KeyboardListener(
                  focusNode: FocusNode(skipTraversal: true),
                  onKeyEvent: (event) => _onNativeKeyEvent(i, event),
                  child: _VisorOtpDigit(
                    controller: _controllers[i],
                    focusNode: _focusNodes[i],
                    digit: _digits[i],
                    isFocused: _focusedIndex == i && _focusNodes[i].hasFocus,
                    enabled: widget.enabled,
                    size: sizes.digitSize,
                    onChanged: (text) => _onNativeTextChanged(i, text),
                    autofocus: widget.autofocus && i == 0,
                    index: i,
                    length: widget.digitCount,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildWeb(BuildContext context, VisorSpacingData spacing) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final sizes = _calculateSizing(constraints.maxWidth, spacing);
        return Stack(
          alignment: Alignment.center,
          children: [
            // Visible digit row. The hidden capture TextField sits OUTSIDE
            // this Semantics container so its own textField semantics don't
            // leak into the OTP code group announcement.
            Semantics(
              container: true,
              label: widget.semanticLabel ??
                  'OTP code, ${widget.digitCount} digits',
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  for (var i = 0; i < widget.digitCount; i++) ...[
                    if (i > 0) SizedBox(width: sizes.gap),
                    GestureDetector(
                      onTap: widget.enabled
                          ? () {
                              setState(() => _focusedIndex = i);
                              _webFocusNode.requestFocus();
                            }
                          : null,
                      child: _VisorOtpDigit(
                        controller: _controllers[i],
                        focusNode: FocusNode(skipTraversal: true),
                        digit: _digits[i],
                        isFocused:
                            _webFocusNode.hasFocus && _focusedIndex == i,
                        enabled: widget.enabled,
                        size: sizes.digitSize,
                        onChanged: (_) {},
                        index: i,
                        length: widget.digitCount,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            // Transparent hidden TextField that captures all keyboard input.
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                child: KeyboardListener(
                  focusNode: FocusNode(skipTraversal: true),
                  onKeyEvent: _onWebKeyEvent,
                  child: TextField(
                    controller: _webController,
                    focusNode: _webFocusNode,
                    enabled: widget.enabled,
                    autofocus: widget.autofocus,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    onChanged: _onWebTextChanged,
                    decoration: const InputDecoration(border: InputBorder.none),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  /// Computes responsive digit size and gap given the available width.
  ///
  /// On narrow containers the digits shrink proportionally; on wide ones they
  /// cap at a comfortable 56×56 max.
  _OtpSizes _calculateSizing(double available, VisorSpacingData spacing) {
    // Intentional layout constraints: 56px max (comfortable touch target),
    // 32px min (readable digit text). Not design tokens — structural bounds.
    const maxDigitSize = 56.0;
    const minDigitSize = 32.0;
    final gapCount = widget.digitCount - 1;
    // Start with gap = spacing.sm (8px).
    final gap = spacing.sm;
    final totalGap = gapCount * gap;
    final digitSize = ((available - totalGap) / widget.digitCount)
        .clamp(minDigitSize, maxDigitSize);
    return _OtpSizes(digitSize: digitSize, gap: gap);
  }
}

// ---------------------------------------------------------------------------
// Sizing record
// ---------------------------------------------------------------------------

class _OtpSizes {
  const _OtpSizes({required this.digitSize, required this.gap});
  final double digitSize;
  final double gap;
}

// ---------------------------------------------------------------------------
// Private digit widget
// ---------------------------------------------------------------------------

/// A single OTP digit box. Private — consumed only by [VisorOtpInput].
///
/// Visual states:
/// - Empty default: `surfaceInteractiveDefault` bg, `borderDefault` border
/// - Focused: `borderFocus` bg fill, `borderFocus` border
/// - Filled: `surfaceAccentSubtle` bg, `borderDefault` border
///
/// Digit text: `textPrimary`.
/// Border radius: `radius.sm`.
class _VisorOtpDigit extends StatelessWidget {
  const _VisorOtpDigit({
    required this.controller,
    required this.focusNode,
    required this.digit,
    required this.isFocused,
    required this.enabled,
    required this.size,
    required this.onChanged,
    required this.index,
    required this.length,
    this.autofocus = false,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String digit;
  final bool isFocused;
  final bool enabled;
  final double size;
  final ValueChanged<String> onChanged;
  final int index;
  final int length;
  final bool autofocus;

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final opacity = context.visorOpacity;
    final radius = context.visorRadius;
    final textStyles = context.visorTextStyles;

    final Color bg;
    final Color border;

    if (isFocused && enabled) {
      bg = colors.borderFocus.withValues(alpha: opacity.alpha12);
      border = colors.borderFocus;
    } else if (digit.isNotEmpty) {
      bg = colors.surfaceAccentSubtle;
      border = colors.borderDefault;
    } else {
      bg = colors.surfaceInteractiveDefault;
      border = colors.borderDefault;
    }

    final semanticLabel =
        'OTP digit ${index + 1} of $length, ${digit.isEmpty ? 'empty' : digit}';

    return Semantics(
      label: semanticLabel,
      textField: true,
      child: SizedBox(
        width: size,
        height: size,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(color: border),
            borderRadius: BorderRadius.circular(radius.sm),
          ),
          child: Center(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              enabled: enabled,
              autofocus: autofocus,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 1,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              onChanged: onChanged,
              style: textStyles.titleMedium.copyWith(
                color: enabled ? colors.textPrimary : colors.textDisabled,
              ),
              decoration: const InputDecoration(
                border: InputBorder.none,
                counterText: '',
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
