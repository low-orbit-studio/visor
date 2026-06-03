---
"@loworbitstudio/visor": minor
---

Add a `variant` prop (`"default" | "breakout"`) to `DropdownMenuContent` and
`DropdownMenuSubContent` (VI-462). The `breakout` variant raises z-index to 200 and
applies a deeper shadow (`var(--shadow-xl)` with a layered fallback) so dropdowns
escape scroll-clipped stacking contexts (data-table rows, sticky toolbars) without
consumer-side CSS overrides. `variant="default"` is byte-identical to the previous
rendering — strictly additive, no breaking changes.
