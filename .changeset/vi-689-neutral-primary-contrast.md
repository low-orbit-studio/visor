---
"@loworbitstudio/visor-core": patch
---

Neutral theme: the primary interactive fill is darkened from #1798ad to #138092 (same teal hue) so the white label passes WCAG 2.2 AA text contrast (3.43:1 to 4.64:1) in light and dark. Dark-mode hover and active fills now step darker (#0f6b7a, #0c5663) instead of lighter, keeping white text at or above 4.5:1. Button, ToggleGroup, SegmentedControl and Badge pick this up through the theme.
