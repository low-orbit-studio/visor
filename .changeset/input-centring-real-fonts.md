---
"@loworbitstudio/visor": patch
"@loworbitstudio/visor-theme-engine": patch
---

Fix plain Input vertical centring in real theme fonts. The theme engine now emits `--font-ascent` and `--font-descent` (em ratios) for the body face, and Input's padding nudge reads them, so capitals sit within 0.5px of centre at sm, md and lg in Inter, Outfit, Pitch Sans, PP Model Mono, Product Sans, Satoshi, system-ui and Arial. Faces without measured metrics get no nudge. No clipping and no box-size change.
