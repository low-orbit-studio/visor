# VI-613 — DocFrame brand logos from private themes + text-fallback wordmark font

Evidence for VI-613's two success criteria:

> - Confirmed: doc-shell brand logos resolve from the private visor themes (mode-aware) in the real docs.
> - Text-fallback wordmark font decision made (sans vs display) and applied.

`doc-frame.visor.yaml` carries no `design_ref`, so the CLAUDE.md render-vs-design self-check does not hard-fire here — but visual proof is this ticket's deliverable, so DocFrame was rendered under a real private theme (Animal) in both modes.

## How this was produced

The generated private themes (CSS + copied `brand/*.svg`) are gitignored, so the standard `visor render` harness can't see them and does not serve brand assets over HTTP — the exact reason VI-609's harness fell back to text (the `--brand-logo` URL 404'd). To close that loop, these captures were produced with a one-off Playwright harness that:

1. ran `packages/docs/scripts/generate-private-themes.mjs` (resolves `@low-orbit-studio/visor-themes-private` from the repo's `node_modules`) — emitting `app/private-themes.generated.css` and copying each private theme's `brand/*.svg` into `packages/docs/public/themes/{slug}/brand/`;
2. esbuild-bundled the real `DocFrame` (+ `DocNav`) with a representative manifest, injected `packages/tokens/dist/tokens.css` + `private-themes.generated.css` + the component CSS, and applied `theme="animal-theme"`;
3. served `packages/docs/public/` over local HTTP so `--brand-logo: url("/themes/animal/brand/*.svg")` actually resolves and the `DocFrameBrand` probe `Image` loads (upgrading the slot to the logo);
4. screenshot both modes at deviceScaleFactor 2.

## Part 1 — brand logos resolve from the private themes (mode-aware)

- [`doc-frame__animal__light.png`](./doc-frame__animal__light.png) — `--brand-logo` resolves to `animal-wordmark-red.svg`; the brand slot upgrades to the LOGO (`data-theme-logo` set), red on the light page.
- [`doc-frame__animal__dark.png`](./doc-frame__animal__dark.png) — mode-aware switch: `--brand-logo` resolves to `animal-wordmark-white.svg`; the white logo renders on the dark page.

Both prove the private theme's mode-aware `--brand-logo` SVG resolves in the DocFrame brand slot — not a text/Visor-mark fallback. The resolution logic was never broken; VI-609's fallback was purely the un-served asset.

## Part 2 — text-fallback wordmark now uses `--font-display`

Decision: **display** (was ambient `--font-sans`). Change: `.wordmark` in `doc-frame.module.css` now sets `font-family: var(--font-display, var(--font-family-heading, inherit))`, matching the display-font convention in `stat-card`, `page-header`, and `section-intro`. It degrades to the heading face, then the ambient sans, on themes shipping no `--font-display`.

The wordmark fallback only shows when a theme has no `--brand-logo` (or it fails to load), so these captures force that state by overriding `--brand-logo: none` on the Animal theme (which has a display face — "Sequel 100 Black 95" — distinct from its body "Ratio"):

- [`doc-frame__animal-wordmark-BEFORE-sans__light.png`](./doc-frame__animal-wordmark-BEFORE-sans__light.png) — before: wordmark in "Ratio" (`--font-sans`), generic.
- [`doc-frame__animal-wordmark__light.png`](./doc-frame__animal-wordmark__light.png) — after: wordmark in "Sequel 100 Black 95" (`--font-display`) — the theme's condensed brand character.
- [`doc-frame__animal-wordmark__dark.png`](./doc-frame__animal-wordmark__dark.png) — after, dark mode.

Computed-style probe confirmed the wordmark's resolved `font-family` is the theme's `--font-display` value and the display font actually loaded (`document.fonts.check` true).
