---
"@loworbitstudio/visor": minor
---

VI-401 feat: `admin-settings-page` exposes `--admin-settings-page-nav-width` so consumers can pin the left-rail width without forking the block CSS.

`.withLeftNav .body`'s `grid-template-columns` now reads through `var(--admin-settings-page-nav-width, minmax(12rem, 16rem))`. Default preserves the current responsive rail (clamped between `12rem` and `16rem`). Consumers can override per-instance with any valid `<grid-track-size>` value (e.g. `220px`, `15rem`).
