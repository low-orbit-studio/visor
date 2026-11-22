---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-core": patch
---

VI-839: squircle themes draw squircles in Safari. Where `corner-shape` is missing (Safari on macOS and iOS), a `corners: squircle` theme's base layer now defines `--squircle-radius` and `--squircle-clip`, and Button, Input, Card, Dialog, SegmentedControl, ToggleGroup, Tabs, Meter, Badge and Chip draw the squircle from them: a circle at 0.54 of the radius under a `clip-path: shape()` that trims only what it draws outside the squircle, so focus rings and shadows stay whole, and edges redrawn on a squircle ring layer (`--squircle-ring`). Chromium and round themes are unchanged. The concentric scan (`visor-core/test-utils`) reads a fallback box as its squircle.
