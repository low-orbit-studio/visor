---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
---

NumberInput takes skin hooks for its field and its − and + buttons, and reads the glass layer. The theme engine gains a `number-input` family: `bg`, `bg-focus`, `border`, `radius`, `height`, `value-width`, `value-font-size`, `value-font-weight`, `button-size`, `button-inset`, `button-radius`, `button-color`, `button-hover-bg` and `icon-size`, each falling back to the look NumberInput drew before, so an unbound theme renders as it did. Inside `data-glass="on"` the field takes the glass layer's control fill, focused fill, ring, ink and blur; elsewhere it stays solid with no blur. ArrowUp and ArrowDown now step the value by `step` and hold at `min` and `max` (a caller's `onKeyDown` runs first and can cancel the step), the − button disables at `min` and the + button at `max`, and from empty the first press lands on `min` when one is set.
