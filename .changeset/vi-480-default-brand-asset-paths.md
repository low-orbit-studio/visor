---
"@loworbitstudio/visor-theme-engine": patch
---

VI-480 fix: correct `DEFAULT_VISOR_BRAND` asset paths to match the shipped VI-469 SVGs.

The default brand emitted `--brand-*` URLs for `logo.svg` / `brandmark.svg` / `wordmark.svg` / `monochrome.svg` / `favicon.svg`, but the VI-469 asset set ships `visor-logo-light.svg` / `visor-logo-dark.svg` / `visor-brandmark.svg` / `visor-wordmark-{light,dark}.svg` / `visor-monochrome.svg` — so every default-brand var 404'd for stock themes. Repoints all five slots to the real filenames (brandmark and monochrome are single-file marks), adds a `visor-favicon.svg` source (the Visor symbol), and corrects per-variant `aspectRatio` tokens to the actual SVG viewBoxes (logo `1269.97 / 540`, wordmark `1100 / 316`, monochrome `2210 / 636`).
