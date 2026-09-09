---
"@loworbitstudio/visor": minor
---

VI-635: `phone-input` rebuilt on the official `@intl-tel-input/react` v29 wrapper.

The component hand-rolled its own `intl-tel-input` init against v26 — a custom effect, latest-ref plumbing to survive parent re-renders, and a geo-IP fetch on every mount. v29 ships an officially controlled React wrapper that rebinds `onInput` each render and skips writing back to the input while it is focused, so all of that plumbing is now dead weight. It is deleted.

**`onChange` is now E.164-safe.** The signature changes from `(value: string, isValid: boolean)` to `(e164: string | null, isValid: boolean)`, and a partial number is never emitted. The library's own `onChangeNumber` emits `getNumber()` verbatim, which for a partial is a dial-code prefix glued to the formatted national string — typing `21337` yields `"+1213-37"`, hyphens included. Validity is instead derived at emit time, so the emitted value is either a string matching `/^\+[1-9]\d{1,14}$/` or `null`. The display keeps the user's partial typing while the emitted value is `null`, so the control never fights the user.

**The country dropdown is themed through the library's CSS custom properties**, so every theme is correct with no consumer-side CSS:

| Library variable | Visor token |
|---|---|
| `--iti-country-selector-bg` | `--surface-popover` |
| `--iti-border-color` | `--border-default` |
| `--iti-icon-color` | `--text-secondary` |
| `--iti-hover-color` | `--surface-interactive-hover` |
| `--iti-strict-reject-flash-color` | `--surface-error-subtle` |

Each binding falls back to the vendor default, so a theme missing one of these tokens renders exactly as the unstyled library does. v29 sets no colour on the country list and none at all on the search field (an `<input>`, which takes UA `Field`/`FieldText` colours rather than inheriting), so those are pinned explicitly — without it a dark theme rendered a white search box inside a dark panel.

**Other changes:**

- `initialCountry` defaults to `"us"` with `initialCountryLookup: null` — the old code fetched `https://ipapi.co/country/` on every mount, which ad-blockers kill, and whose failure path left the flag unset.
- `loadUtils` is baked in and not overridable.
- `readOnly` and `countrySelectorMode` are passed through. `readOnly` alone does **not** close off the dropdown — the selected country stays a `<button>` and opens on click — so a read-only display needs `countrySelectorMode="OFF"` too.
- `onBlur` now receives the validation error (`(error: ValidationError | null) => void`). The library's error callback does not fire while a number is still partial, and a visibly-present partial that saves as nothing is silent data loss.
- The country selector stays inline by default. Portaling is exposed as one all-or-nothing `portal={{ container, scopeClassName }}` prop, so a selector portaled out of the tree cannot escape its theme scope.
- `intl-tel-input` bumped `^26.9.1` → `^29.2.3`; `@intl-tel-input/react` added.

**Migration:** `onChange` consumers must handle `null`. Code that persisted the first argument directly was previously able to store a malformed number; it now stores `null` until the number is complete. `onBlur` handlers that took no argument continue to work.
