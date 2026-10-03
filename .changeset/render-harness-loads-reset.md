---
"@loworbitstudio/visor": patch
---

`visor render` now loads visor-core's element reset (resolved from `packages/tokens/dist/reset.css` or the installed `@loworbitstudio/visor-core`) and binds `#theme-scope` to the `--font-body` token, so native controls in a render wear the theme font as they do in a real app.
