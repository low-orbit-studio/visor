---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

ToggleGroup option variant (VI-787).

`variant="option"` draws each item as a full-width tap-to-pick row: a lettered key on the left (A, B, C…, from a CSS counter, filled when picked), the label, and in a `type="multiple"` group a check box on the right that fills when picked. Hover and picked fills, and a 1px inset ring when picked. A column by default; `columns={2}` lays the rows out two up. The group keeps ToggleGroup's semantics: single is a radiogroup of radios, multiple a group of pressed buttons, arrow keys move and Space/Enter picks. A new `shortcuts` prop makes the letters keys while focus is in the group.

Every colour, size, radius and the backdrop blur is a `--toggle-group-option-*` hook, bindable from a theme as the new `components.toggle-group.option-*` keys (23 keys, listed on Component Tokens). Each falls back to a Visor token. The default and outline variants are unchanged. Re-copy with `npx visor add toggle-group --overwrite`.
