---
"@loworbitstudio/visor": minor
---

InfographicBar gets a selectable mode, a band of counts that is also a list's filter (VI-868). Pass `value`, `defaultValue` or `onValueChange` and the band becomes a radiogroup: each cell is a radio with `aria-checked`, arrow keys move focus and selection together, and `onValueChange` reports the cell's `id`. A pressed plate slides between cells: a lifted plate on a light page, a 9% ink wash in dark, with the hairline dividers hidden beside it. The selectable band has no border and sits on one tint (the page mixed 6% toward the ink), draws a 44px count over a 13px sentence-case caption, and keeps cells at least 124px wide with a 4px concentric inset. The read-only band is unchanged.
