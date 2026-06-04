---
"@loworbitstudio/visor": minor
---

Add `infographic-bar` — a composable Visor block that lays out N `stat-card`s as a single continuous infographic band instead of separate bordered cards butting together.

The band owns the frame, radius, and elevation while each `stat-card` sheds its own chrome, so a KPI row reads as one continuous surface. Outer corners round and inner corners stay square for any N via overflow-clip (no per-cell radius math). The outer frame follows `--border-default` (borderless themes drop it) and dividers follow `--hairline` — retunable via `--infographic-bar-divider`, including `transparent` for a fully seamless band — so the same band renders correctly across bordered and borderless palettes without per-consumer override CSS. Reuses `stat-card` as the cell (composition, not a fork).
