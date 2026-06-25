---
"@loworbitstudio/visor": minor
---

feat(empty-state): add intent variants for Borealis global state spec §5

Extends `EmptyState` with three semantic `intent` values — `first-use`,
`zero-results`, and `no-access` — that communicate the cause of the empty
state and style the icon slot accordingly.

- `first-use`: no items exist yet; accent-tinted circular icon chip; encourage
  a creation CTA.
- `zero-results`: filter or search returned nothing; accent-tinted chip; offer
  a clear-filter secondary action.
- `no-access`: permission or feature gate; neutral chip with lock icon; no CTA
  (terminal state).

Also adds `iconWrap` boolean prop. Setting `intent` auto-activates `iconWrap`,
wrapping the icon in a 72 × 72 circular chip. `iconWrap` can be used
independently of `intent` to get the chip treatment without semantic coloring.
