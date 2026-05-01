---
"@loworbitstudio/visor": minor
---

Add `valueAs="default" | "hero" | "compact"` and `valueClassName` props to `StatCard` for configurable value typography. Hero renders display-font, 3.5rem fallback, weight-400, tabular-nums, line-height-1; compact renders at 2xl. `data-value-as` is set on the value element when the prop is provided. New `--stat-card-value-font` and `--stat-card-value-size` CSS custom properties on `.base` provide override hooks. `AdminDashboardStat` is extended with a `valueAs` passthrough. Existing consumers are unaffected (no prop → no `data-value-as`, no behavioral change).
