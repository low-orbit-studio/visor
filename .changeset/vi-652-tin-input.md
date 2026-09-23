---
"@loworbitstudio/visor": minor
---

feat: add TinInput — a write-only, masked 9-digit TIN/EIN input

`npx visor add tin-input` ships a taxpayer-ID field that never re-displays the value:

- The input's value is only ever the grouping mask. Every edit is intercepted before it reaches the DOM, so the digits are never in `input.value` or in any attribute. On blur a complete entry shows `•••-••-1234` and the digits are dropped; focusing it again clears it. Until hydration the field is read-only, so nothing typed on a slow first load is shown.
- `kind: 'ssn' | 'ein'` sets the grouping. `onValueChange(digits | null)` is the only way the digits leave: the 9 digits once complete, `null` while incomplete or cleared. There is no `value` and no `name`.
- `lastFour` renders a read-only "On file · ending 1234" with a Replace button that swaps in an empty field. A new `lastFour` brings the echo back.
- Paste strips spaces and dashes and refuses more than 9 digits with an error rather than truncating. Password-manager ignore attributes are always set, with no reveal toggle and no copy affordance.
- The hint and error sit below the field, in Visor Field order, and are bound by `aria-describedby`. The committed echo reads as "ending in 1234", and `size="lg"` meets 44px touch targets.
