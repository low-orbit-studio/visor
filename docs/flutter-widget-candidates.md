# Flutter Widget Candidates

## Priority Rubric

Candidates are ranked by:

1. **Reuse frequency** — widget appears in two or more of the three source repos (SoleSpark, ENTR, Veronica) or fills a high-demand inventory gap
2. **Theming fit** — widgets that use `colorway.*`, `Theme.of(context)`, or semantic `UIColors` tokens outrank those with raw hard-coded hex/rgba values
3. **Inventory gap** — fills a missing entry in `docs/component-inventory.md` (Flutter currently has 4 widgets against 83 documented)

> **Complexity key:** S = straightforward port (minimal theming work, no external deps), M = medium (needs theming refactor or light dep cleanup), L = large (significant rework, complex state, or heavy third-party deps)

---

## Candidates

| Rank | Candidate Name | Source Repo + Path(s) | Current Dependencies | Theming Status | Complexity | Inventory Match | Notes |
|------|---------------|----------------------|---------------------|---------------|------------|-----------------|-------|
| 1 | **OtpDigitGroup** | SoleSpark: `lib/shared/widgets/form/otp_digit_group.dart` + `otp_digit.dart`<br>ENTR: `lib/shared/widgets/forms/otp_digit_group.dart` + `otp_digit.dart`<br>Veronica: `lib/shared/widgets/forms/otp_digit_group.dart` + `otp_digit.dart` | `flutter/services`, `ui` package spacing | Token-adjacent; uses `UISpacing` constants; `OtpDigit` visual uses app-level tokens — needs Visor token swap | S | gap | Appears in all 3 repos verbatim. Auto-advance, backspace-to-prev, configurable digit count. Pure presentational. Highest cross-repo reuse of any candidate. Target: `visor_otp_input`. |
| 2 | **UITextFormField / VeronicaTextField** | SoleSpark: `lib/shared/widgets/form/ui_text_form_field.dart`<br>Veronica: `lib/shared/widgets/forms/veronica_text_field.dart` | `flutter/services`, `ui` package | SoleSpark: hard-coded `UIColors.*` constants; Veronica: uses `context.colorway` tokens — theming refactor needed | M | gap | Animated floating label, validation state, checkmark suffix. Veronica version is closer to token-driven. React `input` component is in inventory — this is the Flutter gap. Target: `visor_text_input`. |
| 3 | **EmptyView / EmptyState** | ENTR: `lib/shared/widgets/screen/empty_view.dart`<br>ENTR: `lib/shared/widgets/screen/empty_view_card.dart`<br>Veronica: `lib/shared/widgets/screen/error_view.dart` (overlapping role) | `flutter/material` only | Token-driven via `Theme.of(context).colorScheme` — good theming posture; compact/standard layout adaptive | S | gap | Visor has a React `empty-state` admin compound but no Flutter primitive. ENTR version is well-isolated. Target: `visor_empty_state` (extends existing Visor widget shape). |
| 4 | **LoadingIndicator / DelayedLoadingIndicator** | ENTR: `lib/shared/widgets/loading/loading_indicator.dart`<br>ENTR: `lib/shared/widgets/loading/delayed_loading_indicator.dart`<br>Veronica: `lib/shared/widgets/indicators/centered_progress_indicator.dart` | `flutter/material` only | Fully token-driven; color optional, defaults to theme primary | S | gap | Not in Visor Flutter at all. Two tiers: simple spinner and delay-gated version. Can be a single widget with `delay` param. Target: `visor_loading_indicator`. |
| 5 | **SettingsMenuTile** | Veronica: `lib/settings/widgets/settings_menu_tile.dart`<br>ENTR: `lib/settings/widgets/settings_view.dart` (contains equivalent inline tile pattern) | `ui` package spacing + icons | Token-driven via `Theme.of(context).colorScheme`; icon + label + caret row; danger color override | S | gap | Maps to the list-tile navigation pattern used across all admin/settings surfaces. Fills `sidebar` + navigation gap for Flutter. Target: `visor_settings_tile`. |
| 6 | **UIButton (SoleSpark-flavored)** | SoleSpark: `lib/shared/widgets/buttons/ui_button.dart`<br>Veronica: `lib/shared/widgets/buttons/veronica_button.dart`<br>ENTR: (uses internal `modal_action_button.dart`) | `ui` package | SoleSpark: hard-coded `UIColors.*`; Veronica: partial `context.colorway` tokens — needs refactor | M | enhancement | Visor already has `visor_button`. SoleSpark adds a `userType` (dual-brand) pattern not in current VisorButton. Enhancement opportunity. |
| 7 | **UIInternationalPhoneInputField** | SoleSpark: `lib/shared/widgets/form/ui_international_phone_input_field.dart`<br>ENTR: `lib/shared/widgets/form/entr_phone_form_field.dart` | `country_code_picker`, `flutter_libphonenumber` | Hard-coded `UIColors.*` throughout; extensive theming refactor needed | L | gap | Visor React inventory has `phone-input`. Flutter has nothing. Third-party deps are significant. Two-phase approach: port core + stub country picker first. Target: `visor_phone_input`. |
| 8 | **SuggestionChip** | Veronica: `lib/shared/widgets/chips/suggestion_chip.dart`<br>Veronica: `lib/shared/widgets/chips/style_chip.dart` | `ui` package | Token-driven via `context.colorway`; selected/unselected states; size variants | S | gap | Maps directly to React `toggle-group` pattern. Clean, minimal deps, good theming. Target: `visor_chip`. |
| 9 | **CachedAvatar** | ENTR: `lib/shared/widgets/images/cached_avatar.dart`<br>Veronica: `lib/shared/widgets/avatars/cached_avatar.dart`<br>Veronica: `lib/shared/widgets/avatars/veronica_circle_avatar.dart` | `cached_network_image`, `phosphor_flutter` | Partially token-driven (`Theme.of(context).colorScheme.primary`); uses `UIColors.light5o` (hard-coded) | M | gap | Maps to React `avatar` component (inventory). Initials fallback, network image, loading overlay. Target: `visor_avatar`. |
| 10 | **ConfirmActionSheet** | ENTR: `lib/shared/widgets/screen/confirm_action_sheet.dart`<br>ENTR: `lib/shared/widgets/screen/confirm_critical_action_sheet.dart`<br>Veronica: `lib/shared/widgets/dialogs/veronica_alert_dialog.dart` | `phosphor_flutter`, ENTR's `AdaptiveModalForm` | Token-driven via `Theme.of(context).colorScheme`; adapts to bottom sheet vs dialog | M | gap | Maps to React `dialog` + `confirm-dialog` (admin). Adaptive modal is non-trivial. Core content widget is S; adaptive presenter adds M complexity. Target: `visor_confirm_sheet`. |
| 11 | **SnackBar / ToastBar** | Veronica: `lib/shared/widgets/snack_bars/veronica_snack_bar.dart`<br>ENTR: `lib/shared/widgets/screen/modal_snack_bar.dart` | `ui` package | Token-driven via `context.colorway`; success / error / standard variants | S | gap | React `toast` is in inventory. Flutter has no toast/snackbar. Static helper methods pattern is clean. Target: `visor_snack_bar`. |
| 12 | **PasswordField** | Veronica: `lib/shared/widgets/forms/veronica_password_field.dart`<br>SoleSpark: (obscureText param on `UITextFormField`) | `ui` package | Veronica: token-driven via `context.colorway`; SoleSpark: partial hard-coded | M | gap | Maps to React `password-input`. Eye toggle, validation state, checkmark. Could be subtype of `visor_text_input`. Target: `visor_password_input`. |
| 13 | **LoadingDots** | Veronica: `lib/shared/widgets/indicators/loading_dots.dart` | `ui` package | Hard-coded `UIPrimaryColors.goldenHour*` brand colors — needs token refactor for Visor | M | new territory | Three-dot animated loading indicator. Motion-respects `MediaQuery.disableAnimations`. No exact React equivalent — new territory for Visor. Target: `visor_loading_dots`. |
| 14 | **ChipSearchInput** | Veronica: `lib/search/widgets/chip_search_input.dart` | `models` package (for `SearchableTag` type), `ui` package | Token-driven via `context.colorway`; animated clear button; reduce-motion aware | M | gap | Maps to React `search-input` + `tag-input` combined pattern. Domain model dep (`SearchableTag`) needs abstraction via generic type param. Target: `visor_chip_search_input`. |
| 15 | **ErrorView** | ENTR: `lib/shared/widgets/screen/error_view.dart`<br>SoleSpark: `lib/shared/widgets/error_screen.dart`<br>Veronica: `lib/shared/widgets/screen/error_view.dart` | `phosphor_flutter` (ENTR), `flutter/material` | ENTR: partially token-driven; SoleSpark: hard-coded `Colors.red`; Veronica: token-driven | M | gap | All 3 repos have an error state widget. Maps to React `banner` + `alert` feedback components. Retry button, optional scaffold wrap, icon + message. Target: `visor_error_view`. |
| 16 | **FormDialog** | ENTR: `lib/shared/widgets/forms/form_dialog.dart`<br>ENTR: `lib/shared/widgets/forms/form_wrapper.dart` | `flutter/material` only | Fully token-driven via `Dialog` theme | S | gap | Minimal wrapper — Dialog + ConstrainedBox with maxWidth. Maps to React `dialog`. Zero external deps, trivial port. Target: `visor_form_dialog`. |
| 17 | **ClickableText** | ENTR: `lib/shared/widgets/text/clickable_text.dart` | `url_launcher`, `ui` package | Partially token-driven; link color uses `UIColors.primary` (hard-coded tint) | M | new territory | Rich text with inline tappable URLs. No React equivalent in Visor inventory — new territory. Target: `visor_rich_text`. |
| 18 | **BackButton / VeronicaBackButton** | Veronica: `lib/shared/widgets/buttons/veronica_back_button.dart`<br>ENTR: `lib/shared/widgets/navigation/back_arrow.dart`<br>SoleSpark: `lib/shared/widgets/buttons/ui_back_button.dart` | `ui` package | Mixed; ENTR uses `Theme.of(context)` tokens; SoleSpark hard-coded | S | new territory | Semantic nav back button. All 3 repos have one. No React equivalent but universal Flutter need. Target: `visor_back_button`. |

---

## Top-5 Summary

| Rank | Widget | Target Component | Linear Ticket |
|------|--------|-----------------|---------------|
| 1 | OtpDigitGroup | `visor_otp_input` | [VI-234](https://linear.app/low-orbit-studio/issue/VI-234/flutter-widget-port-otpdigitgroup) |
| 2 | UITextFormField / VeronicaTextField | `visor_text_input` | [VI-235](https://linear.app/low-orbit-studio/issue/VI-235/flutter-widget-port-textinput-floating-label) |
| 3 | EmptyView | `visor_empty_state` | [VI-236](https://linear.app/low-orbit-studio/issue/VI-236/flutter-widget-port-emptyview) |
| 4 | LoadingIndicator | `visor_loading_indicator` | [VI-237](https://linear.app/low-orbit-studio/issue/VI-237/flutter-widget-port-loadingindicator) |
| 5 | SettingsMenuTile | `visor_settings_tile` | [VI-238](https://linear.app/low-orbit-studio/issue/VI-238/flutter-widget-port-settingsmenutile) |

---

## Source Repo Coverage

| Source Repo | Candidates Represented |
|-------------|----------------------|
| SoleSpark (`lib/shared/widgets/`) | Ranks 1, 2, 6, 7, 15, 18 |
| ENTR (`lib/shared/widgets/`, `lib/*/widgets/`) | Ranks 1, 3, 4, 7, 10, 11, 15, 16, 17, 18 |
| Veronica (`lib/shared/widgets/`, `lib/settings/widgets/`, `lib/search/widgets/`) | Ranks 1, 2, 3, 5, 8, 9, 10, 11, 12, 13, 14, 15, 18 |

All three source repos are represented with ≥ 3 candidates each.

---

## Notes on Theming Patterns Observed

- **SoleSpark** uses a `ui` package with `UIColors.*` static constants — largely hard-coded, not token-driven. All SoleSpark candidates require theming refactor.
- **ENTR** uses `Theme.of(context).colorScheme.*` — Material 3 token-aligned but not Visor-specific. Light refactor to `context.visorColors` pattern.
- **Veronica** uses `context.colorway` extensions from its `ui` package — closest to Visor's `context.visorColors` extension pattern. Veronica candidates are the easiest to port.
- **Visor target pattern** (per `visor_button.dart`): `context.visorColors`, `context.visorSpacing`, `context.visorTextStyles` extensions from `visor_core`.
