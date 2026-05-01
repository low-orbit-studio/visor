---
"@loworbitstudio/visor": patch
---

Fix `DataTable` group-head row background in dark mode. VI-284 introduced `background: var(--surface-alt, #f3f4f6)` but `--surface-alt` is not defined anywhere in the Visor design system, so the fallback `#f3f4f6` was always used — rendering as a bright light-gray stripe in dark themes. Swap `.groupLabel` (and the demo preview) to `--surface-subtle`, which is defined across all shipped themes (Neutral, Blackout, Modern Minimal, Space) with appropriate light/dark values.
