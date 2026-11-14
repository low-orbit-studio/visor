---
"@loworbitstudio/visor": patch
---

VI-790: `phone-input` keeps its full-screen country picker inside `portal.container`.

Below 500px wide, intl-tel-input swaps the dropdown for a full-screen picker that ignores `dropdownParent` and appends to `document.body`. Inside a modal Dialog that put the picker under the dialog and outside its focus trap. With `portal` set, the full-screen picker is now appended to `portal.container` and carries `portal.scopeClassName`, like the dropdown. Without `portal`, nothing changes.

`intl-tel-input` and `@intl-tel-input/react` bumped `^29.2.3` → `^29.5.11` (`fullscreenParent` arrived in 29.4.0).
