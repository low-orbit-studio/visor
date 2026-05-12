# W025 — Themes that declare a custom font must emit @font-face for it, or they silently fall back on visitor machines

## Lesson

A theme that declares `--font-heading: "Satoshi"` without a matching `@font-face` rule in the same emitted CSS will render correctly **only on machines that happen to have Satoshi installed locally**. On every other visitor's machine the browser silently walks the fallback stack to system-ui. No console warning, no network request, no visible failure indicator.

This bug shipped to production on visor.design across four themes (Blackout, Borderless, Space, Strata) and stayed hidden for weeks because:

1. The operator's machine had Satoshi installed locally — every preview, every smoke test, every visual review rendered Satoshi correctly.
2. Headless CI's screenshot baselines were captured on the operator's machine, encoding the locally-resolved Satoshi rendering. Linux CI rasterized Satoshi-via-system-fallback differently, which the operator interpreted as platform variance.
3. The substrate (per-theme `@font-face` aliasing, font CDN URL builder, weight-name registry) all worked correctly for themes that actually emitted `@font-face`. None of those upstream tickets exercised the broken `source: local` path.

The root cause: `typography.<slot>.source: local` (explicit or via fall-through when the family isn't in the Google Fonts catalog) emits a **commented-out** `@font-face` placeholder — never a real one. The CSS still emits `--font-*: "Family", …` overrides, so the cascade asks for the font with nothing telling the browser where to fetch it.

## Fix

Two complementary moves:

1. **Route the font through a real source.** For Visor's stock themes, that means hosting the woff2 files on the visor-fonts CDN and declaring `typography.<slot>.source: visor-fonts` + `org: low-orbit-studio` in the YAML. The engine then emits a real `@font-face` pointing at `fonts.visor.design/{org}/{family}/…`.

2. **Add a build-time validator.** `validateFontCoverage(css)` in `@loworbitstudio/visor-theme-engine` scans every theme's emitted CSS and errors when any `--font-*` declaration names a custom family with no matching `@font-face` (or Google Fonts `@import`). Wired into `visor theme sync` and `packages/docs/scripts/generate-private-themes.mjs` so any new theme that drifts back into the broken state fails the build.

## How to spot

Cross-machine font reality has to be tested on **a clean machine where the operator hasn't installed the design's fonts locally**. Either:

- Run Playwright on a fresh container where no custom fonts are installed.
- Inspect the rendered DOM in DevTools and watch the Network tab for actual font requests — if the only woff2 requests are framework-bundled chrome (Geist, Inter, etc.), no theme font is loading.
- Block all font requests in DevTools and reload — if the page looks identical to the unblocked load, the theme font wasn't loading anyway.

## Tags

fonts, theming, cross-machine, validation, visor-fonts-cdn

## See also

- [W008 — Visor Fonts CDN org slug](W008-visor-fonts-cdn-org.md)
- [W010 — Every theme must explicitly define --font-mono](W010-theme-font-mono-required.md)
- [W019 — Alchemist goldens must baseline on Linux](W019-alchemist-goldens-must-baseline-on-linux.md)
- VI-358 (Linear)
