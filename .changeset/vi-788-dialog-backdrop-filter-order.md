---
"@loworbitstudio/visor": patch
---

Dialog: `--dialog-overlay-blur` and `--dialog-backdrop-filter` now blur in Next.js builds (VI-788).

Lightning CSS, which Next.js uses for CSS modules, kept only the `-webkit-backdrop-filter` line when it followed an unprefixed `backdrop-filter` with a `var()` value, so Chrome, Edge and Firefox lost the blur. The prefixed line now comes first and both survive. Values and defaults are unchanged. Re-copy with `npx visor add dialog --overwrite`.
