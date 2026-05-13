---
"@loworbitstudio/visor-theme-engine": patch
---

VI-373 fix: register `PP Model Sans` in `FONT_WEIGHT_ALIASES`.

`FONT_WEIGHT_ALIASES` (in `packages/theme-engine/src/fonts/font-aliases.ts`) had entries for `PP Model Mono` and `PP Model Plastic` mapping weights 400 → `Book` and 800 → `Super`, but was missing `PP Model Sans`. Result: `buildVisorFontUrl` generated `PPModelSans-Regular.woff2` and `PPModelSans-ExtraBold.woff2` — both 404 on the Visor font CDN, where the real files are `-Book.woff2` and `-Super.woff2` (Pangram-Pangram's PostScript naming).

Net effect on the Blacklight Underground theme: every `--font-sans` slot at weight 400 or 800 silently failed `@font-face` loading. Because the Underground stack is `"PP Model Sans [blacklight-underground]", "PP Model Sans"` with no terminal generic fallback by design (VI-354), the browser fell through to its default (Times) instead of rendering Sans. Visible in the docs sidebar and any non-display text driven by `--font-sans`.

Fix is a three-line addition mirroring the existing Mono/Plastic entries. Test coverage in `font-aliases.test.ts` extended to assert `lookupFontWeightAlias` resolves Sans at 400/800 and `buildVisorFontUrl` emits the correct `PPModelSans-Book.woff2` / `PPModelSans-Super.woff2` URLs.
