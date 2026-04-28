import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:visor_core/visor_core.dart';

/// A search field that holds selected items as inline chip pills.
///
/// Uses a generic type parameter `<T>` so consumers supply their own item
/// shape — no Visor-side coupling to a specific tag or domain model.
///
/// Features:
/// - Text input with selected-item chips rendered inline before the cursor
/// - Each chip removable via its (×) button; backspace on an empty field
///   removes the most-recently added chip (standard Apple Mail / Gmail / Slack UX)
/// - Clear button that animates in/out when text is present
/// - Reduce-motion aware — all animations collapse to instant snaps when the
///   OS "Reduce Motion" accessibility setting is enabled
/// - Theme-agnostic — every visual value read from Visor token extensions
///
/// ## Basic usage
///
/// ```dart
/// VisorChipSearchInput<MyTag>(
///   selectedItems: selectedTags,
///   labelBuilder: (tag) => tag.displayName,
///   hintText: 'Search by tag...',
///   onQueryChanged: (query) { /* filter list */ },
///   onItemRemoved: (tag) { /* remove from selection */ },
/// )
/// ```
///
/// ## With controller and focus node
///
/// ```dart
/// VisorChipSearchInput<MyTag>(
///   selectedItems: selectedTags,
///   labelBuilder: (tag) => tag.displayName,
///   hintText: 'Search...',
///   controller: _textController,
///   focusNode: _focusNode,
///   onQueryChanged: _handleQuery,
///   onItemRemoved: _handleRemove,
///   onFocusChanged: (focused) { /* show/hide overlay */ },
///   onSubmitted: (text) { /* confirm selection */ },
/// )
/// ```
class VisorChipSearchInput<T> extends StatefulWidget {
  const VisorChipSearchInput({
    required this.selectedItems,
    required this.labelBuilder,
    required this.hintText,
    required this.onQueryChanged,
    required this.onItemRemoved,
    this.controller,
    this.focusNode,
    this.onFocusChanged,
    this.onSubmitted,
    this.autofocus = false,
    this.enabled = true,
    super.key,
  });

  /// Currently selected items displayed as inline chips.
  final List<T> selectedItems;

  /// Extracts the display label for a given item. Used by each chip.
  final String Function(T item) labelBuilder;

  /// Hint text shown when the field is empty and no chips are present.
  final String hintText;

  /// Called each time the query text changes.
  final ValueChanged<String> onQueryChanged;

  /// Called when the user removes a chip.
  final ValueChanged<T> onItemRemoved;

  /// Optional external text controller. When omitted an internal controller
  /// is created and managed by the widget.
  final TextEditingController? controller;

  /// Optional external focus node. When omitted an internal node is managed.
  final FocusNode? focusNode;

  /// Called when focus enters or leaves the search field.
  final ValueChanged<bool>? onFocusChanged;

  /// Called when the user confirms input via the keyboard action.
  ///
  /// The field does **not** unfocus on submit — callers retain full control
  /// over dismissal (e.g. to keep an autocomplete overlay open).
  final ValueChanged<String>? onSubmitted;

  /// Whether the field should request focus on first build.
  final bool autofocus;

  /// When false the field is rendered at reduced opacity and ignores input.
  final bool enabled;

  @override
  State<VisorChipSearchInput<T>> createState() =>
      _VisorChipSearchInputState<T>();
}

class _VisorChipSearchInputState<T> extends State<VisorChipSearchInput<T>>
    with SingleTickerProviderStateMixin {
  FocusNode? _internalFocusNode;
  TextEditingController? _internalController;

  FocusNode get _effectiveFocusNode =>
      widget.focusNode ?? _internalFocusNode!;

  TextEditingController get _effectiveController =>
      widget.controller ?? _internalController!;

  late AnimationController _clearButtonAnimController;
  late Animation<double> _clearButtonOpacity;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    if (widget.focusNode == null) {
      _internalFocusNode = FocusNode();
    }
    if (widget.controller == null) {
      _internalController = TextEditingController();
    }

    _effectiveFocusNode.addListener(_onFocusChanged);
    _effectiveController.addListener(_onTextChanged);

    _hasText = _effectiveController.text.isNotEmpty;

    _clearButtonAnimController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _clearButtonOpacity = CurvedAnimation(
      parent: _clearButtonAnimController,
      curve: Curves.easeInOut,
    );

    if (_hasText) {
      _clearButtonAnimController.value = 1.0;
    }
  }

  @override
  void didUpdateWidget(VisorChipSearchInput<T> oldWidget) {
    super.didUpdateWidget(oldWidget);

    // When the consumer adds a new chip, auto-clear the query text.
    if (widget.selectedItems.length > oldWidget.selectedItems.length) {
      _effectiveController.clear();
    }

    // Handle controller swap
    if (widget.controller != oldWidget.controller) {
      (oldWidget.controller ?? _internalController)
          ?.removeListener(_onTextChanged);
      if (oldWidget.controller == null && widget.controller != null) {
        _internalController?.dispose();
        _internalController = null;
      } else if (oldWidget.controller != null && widget.controller == null) {
        _internalController = TextEditingController();
      }
      _effectiveController.addListener(_onTextChanged);
      setState(() {
        _hasText = _effectiveController.text.isNotEmpty;
      });
    }

    // Handle focus node swap
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
    _effectiveFocusNode.removeListener(_onFocusChanged);
    _effectiveController.removeListener(_onTextChanged);
    _internalFocusNode?.dispose();
    _internalController?.dispose();
    _clearButtonAnimController.dispose();
    super.dispose();
  }

  void _onFocusChanged() {
    widget.onFocusChanged?.call(_effectiveFocusNode.hasFocus);
    setState(() {});
  }

  void _onTextChanged() {
    final hasText = _effectiveController.text.isNotEmpty;
    if (_hasText != hasText) {
      setState(() => _hasText = hasText);
      final reduceMotion = MediaQuery.of(context).disableAnimations;
      if (reduceMotion) {
        _clearButtonAnimController.value = hasText ? 1.0 : 0.0;
      } else if (hasText) {
        _clearButtonAnimController.forward();
      } else {
        _clearButtonAnimController.reverse();
      }
    }
  }

  void _clearText() {
    _effectiveController.clear();
    widget.onQueryChanged('');
  }

  /// Intercepts Backspace on an empty field to remove the most-recently added
  /// chip. Returns [KeyEventResult.ignored] for all other cases so normal
  /// typing/editing is unaffected.
  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (event is! KeyDownEvent) return KeyEventResult.ignored;
    if (event.logicalKey != LogicalKeyboardKey.backspace) {
      return KeyEventResult.ignored;
    }
    if (_effectiveController.text.isNotEmpty ||
        widget.selectedItems.isEmpty) {
      return KeyEventResult.ignored;
    }
    widget.onItemRemoved(widget.selectedItems.last);
    return KeyEventResult.handled;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.visorColors;
    final spacing = context.visorSpacing;
    final textStyles = context.visorTextStyles;
    final radius = context.visorRadius;
    final opacity = context.visorOpacity;
    final strokeWidths = context.visorStrokeWidths;
    final shadows = context.visorShadows;

    final hasChips = widget.selectedItems.isNotEmpty;

    return Opacity(
      opacity: widget.enabled ? 1.0 : opacity.alpha50,
      child: Material(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(radius.pill),
        shadowColor: shadows.sm.isNotEmpty ? shadows.sm.first.color : null,
        elevation: shadows.sm.isNotEmpty ? 2 : 0,
        child: Container(
          constraints: BoxConstraints(minHeight: spacing.xxxl),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius.pill),
            border: Border.all(
              color: _effectiveFocusNode.hasFocus
                  ? colors.borderFocus
                  : colors.borderDefault,
              width: strokeWidths.thin,
            ),
          ),
          padding: EdgeInsets.symmetric(
            horizontal: spacing.md,
            vertical: spacing.sm,
          ),
          child: Row(
            children: [
              // Search icon
              Padding(
                padding: EdgeInsets.only(right: spacing.sm),
                child: Icon(
                  Icons.search,
                  color: colors.textTertiary,
                  size: 20,
                ),
              ),
              // Chips and text input
              Expanded(
                child: Wrap(
                  spacing: spacing.xs,
                  runSpacing: spacing.xs,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    // Selected item chips
                    ...widget.selectedItems.map(
                      (item) => _ItemChip<T>(
                        item: item,
                        label: widget.labelBuilder(item),
                        onRemoved: () => widget.onItemRemoved(item),
                        colors: colors,
                        spacing: spacing,
                        textStyles: textStyles,
                        radius: radius,
                        opacity: opacity,
                      ),
                    ),
                    // Text input
                    IntrinsicWidth(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minWidth: hasChips ? spacing.xxl * 2.5 : 200,
                        ),
                        child: Focus(
                          onKeyEvent: _handleKeyEvent,
                          child: TextField(
                            controller: _effectiveController,
                            focusNode: _effectiveFocusNode,
                            onChanged: widget.onQueryChanged,
                            // Override default onEditingComplete so Enter does
                            // not unfocus — keeps autocomplete overlays alive.
                            onEditingComplete: () =>
                                _effectiveController.clearComposing(),
                            onSubmitted: widget.onSubmitted,
                            autofocus: widget.autofocus,
                            enabled: widget.enabled,
                            style: textStyles.labelLarge.copyWith(
                              color: colors.textPrimary,
                            ),
                            decoration: InputDecoration(
                              isDense: true,
                              border: InputBorder.none,
                              focusedBorder: InputBorder.none,
                              enabledBorder: InputBorder.none,
                              disabledBorder: InputBorder.none,
                              hintText: hasChips ? '' : widget.hintText,
                              hintStyle: textStyles.labelLarge.copyWith(
                                color: colors.textTertiary,
                              ),
                              contentPadding: EdgeInsets.symmetric(
                                vertical: spacing.sm,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Animated clear button
              FadeTransition(
                opacity: _clearButtonOpacity,
                child: _hasText
                    ? Semantics(
                        button: true,
                        label: 'Clear search',
                        child: IconButton(
                          icon: Icon(
                            Icons.close,
                            color: colors.textTertiary,
                            size: 20,
                          ),
                          onPressed: _clearText,
                          constraints: BoxConstraints(
                            minWidth: spacing.xxl,
                            minHeight: spacing.xxl,
                          ),
                          padding: EdgeInsets.zero,
                        ),
                      )
                    : SizedBox(width: spacing.xxl),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A removable chip displayed inline in the search input.
class _ItemChip<T> extends StatelessWidget {
  const _ItemChip({
    required this.item,
    required this.label,
    required this.onRemoved,
    required this.colors,
    required this.spacing,
    required this.textStyles,
    required this.radius,
    required this.opacity,
  });

  final T item;
  final String label;
  final VoidCallback onRemoved;
  final VisorColorsData colors;
  final VisorSpacingData spacing;
  final VisorTextStylesData textStyles;
  final VisorRadiusData radius;
  final VisorOpacityData opacity;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: spacing.sm,
        vertical: spacing.xs,
      ),
      decoration: BoxDecoration(
        color: colors.surfaceSelected,
        borderRadius: BorderRadius.circular(radius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: textStyles.labelMedium.copyWith(
              color: colors.textPrimary,
              height: 1,
              leadingDistribution: TextLeadingDistribution.even,
            ),
          ),
          SizedBox(width: spacing.xs),
          Semantics(
            button: true,
            label: 'Remove $label',
            child: GestureDetector(
              onTap: onRemoved,
              behavior: HitTestBehavior.opaque,
              child: Icon(
                Icons.close,
                color: colors.textPrimary
                    .withValues(alpha: opacity.alpha60),
                size: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
