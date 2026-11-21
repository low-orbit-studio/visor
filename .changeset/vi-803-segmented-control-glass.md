---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": patch
---

SegmentedControl's well reads the glass layer. Inside `data-glass="on"` the well blurs the photo behind it with the glass layer's control blur and, when the theme leaves `segmented-control.track-bg` unbound, takes the glass layer's control fill; a theme's own `track-bg` still wins. Everywhere else the well is solid with no `backdrop-filter`, so a page without glass renders exactly as before. The theme engine's `segmented-control` family description and the schema say so.
