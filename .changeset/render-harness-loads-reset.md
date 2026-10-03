---
"@loworbitstudio/visor": patch
---

`visor render` now loads visor-core's element reset (resolved from `packages/tokens/dist/reset.css` or the installed `@loworbitstudio/visor-core`) and binds `#theme-scope` to the `--font-body` token, so native controls in a render wear the theme font as they do in a real app.

`Button` now optically centres its label. Bare text is wrapped in a `button-text` span trimmed to the capital-height band (`text-box: trim-both cap alphabetic`), so the label no longer sits up to ~1px high in fonts whose ascent and descent are lopsided (Product Sans, PP Model Mono). Box size is unchanged at every size, and the compact `dlg` size is left as it was. Browsers without `text-box` (Firefox) fall back to the previous rendering.
