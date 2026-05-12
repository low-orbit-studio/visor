---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": patch
---

VI-359 feat: add `fontshare` source type for typography slots, and migrate Blackout, Borderless, and Space (heading + body) to it. Resolves the license blocker on the VI-358 follow-up: Indian Type Foundry's Fontshare EULA (the license shipped with Satoshi) forbids public CDN re-hosting in §02, so the visor-fonts CDN path was not a viable distribution channel for Satoshi. Fontshare's own hosted API is the licensor-controlled channel and is explicitly permitted by the EULA.

The new `source: fontshare` (no `org:` required) emits `@import url("https://api.fontshare.com/v2/css?f[]=<slug>@<weights>&display=swap")` at the top of the theme's CSS — Fontshare's response ships the real `@font-face` blocks, so the engine doesn't need to fabricate them. The `validateFontCoverage` validator was extended to recognize Fontshare `@import` URLs (alongside Google Fonts `@import`) as legitimate font-face coverage, mapping the lowercase-hyphenated slug back to the title-cased CSS family.

Behavior is additive: themes still on `source: visor-fonts` (e.g. Space's Monaspace Neon) are unchanged; the new source type is opt-in per slot. Per-theme `@font-face` aliasing (VI-354) is not applied to fontshare sources because all themes sharing a family share Fontshare's hosted `@font-face` blocks — the browser dedupes by URL and the weights union naturally across themes.

Wisdom captured at `docs/wisdom/W026-satoshi-license-forbids-public-cdn.md` for the license reading and the generalizable rule: read the EULA before adding a font to a CDN namespace under `npm run fonts:add`.

Operator follow-up:
- Companion PR in `visor-themes-private` migrates Strata's Satoshi slots from `source: visor-fonts` to `source: fontshare`.
- Monaspace Neon (OFL-licensed) remains a candidate for the visor-fonts CDN; the upload (and any cross-machine smoke retest) is independent of this change.
