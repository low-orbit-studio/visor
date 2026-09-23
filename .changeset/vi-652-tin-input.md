---
"@loworbitstudio/visor": minor
---

feat: add TinInput — a write-only, masked 9-digit TIN/EIN input

`npx visor add tin-input` ships a taxpayer-ID field that never re-displays the value:

- The input's value is only ever the grouping mask. Every edit is intercepted before it reaches the DOM, so the digits are never in `input.value` or in any attribute. On blur a complete entry shows `•••-••-1234` and the digits are dropped; focusing it again clears it.
- `kind: 'ssn' | 'ein'` sets the grouping. `onValueChange(digits | null)` is the only way the digits leave: the 9 digits once complete, `null` while incomplete or cleared. There is no `value` and no `name`.
- `lastFour` renders a read-only "On file · ending 1234" with a Replace button that swaps in an empty field.
- Paste strips spaces and dashes and refuses more than 9 digits with an error rather than truncating. Password-manager ignore attributes are always set, with no reveal toggle and no copy affordance.
- Hint and error are bound by `aria-describedby`, the committed echo reads as "ending in 1234", and `size="lg"` meets 44px touch targets.
