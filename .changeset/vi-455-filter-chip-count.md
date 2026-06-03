---
"@loworbitstudio/visor": minor
---

Add `count` and `countTone` props to FilterChip (VI-455). `count?: React.ReactNode`
renders an inline count pill after the chip label — ideal for quick-filter pivots
("All 132 / Active 47 / Suspended 8"). `countTone?: "primary" | "neutral"` (default
`"neutral"`) controls the pill's surface treatment; `"primary"` uses the accent ramp.
The pill automatically re-tones when the chip is selected via a
`[data-selected="true"] .count` CSS rule — no consumer override required. Count is
rendered inside the `<button>` so screen readers announce it as part of the
accessible name. Existing FilterChip usages without `count` render identically.
