---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
---

StatCard takes theme hooks for its edge, corners, elevation and inset (`--stat-card-border`, `--stat-card-radius`, `--stat-card-shadow`, `--stat-card-padding`), the rule above the footer (`--stat-card-footer-border`) and its type (`--stat-card-label-*`, `--stat-card-value-*`, `--stat-card-footer-*` font size, weight, line height, tracking and colour), bindable as `components.stat-card` in a theme. Every hook falls back to the look that shipped, so unbound themes render unchanged. Paper binds a borderless summary card: no edge, no footer rule, 24px corners, no shadow, the desk hero value, and desk label and second-line type.
