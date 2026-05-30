---
"@loworbitstudio/visor-theme-engine": minor
---

Add `animated` as a first-class, optional, SVG-only brand slot. Themes may declare `brand.animated` (a self-contained animated SVG); the engine emits mode-scoped `--brand-animated` / `-light` / `-dark` CSS vars. The slot is optional (no Visor default — stock themes emit nothing) and SVG-only (validation rejects non-SVG formats and non-`.svg` paths). Unblocks the docs Visual Explorer animated render (VI-488) and BO-46.
