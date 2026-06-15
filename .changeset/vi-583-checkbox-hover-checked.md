---
"@loworbitstudio/visor": patch
---

fix: Checkbox hover no longer masks the checked fill (editorial density + base)

A checked checkbox left under the pointer rendered with the *unchecked* hover background until the pointer moved away — the checked fill appeared late. Both `@media (hover: hover)` rules (base and `data-density="editorial"`) out-specified the `[data-state="checked"]` rule and forced their hover `background-color`. The fix excludes `[data-state="checked"]` and `[data-state="indeterminate"]` from both hover selectors, so hover affordance only applies to the unchecked box and the checked fill shows immediately on click. At-rest checked / unchecked / hover-unchecked / focus / invalid rendering is unchanged.
