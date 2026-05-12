# Changelog

## 0.6.0

### Minor Changes

- 74627cc: VI-354 fix: scope cross-theme `@font-face` declarations by aliasing the family name per theme so co-loaded themes don't overwrite each other's per-theme properties (e.g. `size-adjust`).

  When two themes that share a visor-fonts family (e.g. both reference `PP Model Mono`) declared different `typography.scale` values, the generated `@font-face` blocks collided globally — the later-declared theme's `size-adjust` silently overrode the earlier theme's for shared weights, corrupting typography rendering in the earlier theme without warning.

  The fix aliases each theme's visor-fonts `@font-face` family as `"{family} [{theme-slug}]"` in both the docs and nextjs adapters. The theme's `--font-*` CSS vars now list the aliased name first with the bare family as a fallback, so DevTools surface the alias for debugging and the cascade has a graceful-degradation hint. No `.visor.yaml` changes required — the fix is contained in the engine's CSS emitter.

  **Consumer migration note:** The engine no longer emits an `@font-face` block for the bare family name. Consumer CSS that hardcodes `font-family: "PP Model Mono"` (or any bare visor-fonts family name) will no longer load that font — the browser falls through to system fonts. **Always reference fonts through `var(--font-heading)` / `var(--font-sans)` / `var(--font-mono)` / etc.** The bare family in those stacks is a fallback hint, not a registered font.

  Affects: themes that share a visor-fonts family across multiple co-loaded themes will start emitting aliased `@font-face` family names. Themes using only Google Fonts or local fonts are unaffected.

- 821c491: VI-355 fix: respect `typography.heading.family` in the docs adapter.

  The docs adapter previously hard-aliased `--font-heading: var(--font-sans);`, silently overriding the theme's heading slot. Every other adapter (`generate-css.ts`, `adapters/deck.ts`, `fonts/pipeline.ts`) already read from `config.typography.heading.family`; the docs adapter — the one operators actually visually verify themes against — was the lone outlier. Themes like Blacklight that intentionally pair a display family for headings with a different body family rendered the wrong font in the docs Typography specimen as a result.

  The docs adapter now emits `--font-heading` from `config.typography.heading.family` (falling back to `body.family` when no heading slot is defined), routed through the same alias-aware `fontStack()` helper used elsewhere so VI-354's per-theme `@font-face` aliasing still applies. Themes without an explicit heading slot keep the previous behavior because the engine's defaults resolve heading and body to the same family.

- 167860f: VI-358 fix: route Satoshi (and Monaspace Neon for Space) through the visor-fonts CDN for stock themes that were shipping `--font-*` overrides without matching `@font-face` blocks. Adds a build-time `validateFontCoverage` validator that catches future drift.

  Stock themes Blackout, Borderless, and Space declared `--font-*: Satoshi` (and Space also `--font-mono: Monaspace Neon`) with no matching `@font-face` because neither font is in the Google Fonts catalog, so the resolver fell through to `source: local` which emits a commented-out placeholder instead of a real `@font-face`. On any machine without Satoshi installed locally — i.e. every visitor to visor.design who isn't the operator — the browser silently fell back to system-ui.

  The `.visor.yaml` files now carry `source: visor-fonts` + `org: low-orbit-studio` annotations on the affected slots, so the engine emits real `@font-face` URLs pointing at `fonts.visor.design`. The schema and resolver were extended so `typography.mono` accepts the same `weight | weights | source | org` fields as the other slots; previously only `family` was allowed, which forced custom mono fonts into the same broken fall-through path.

  New `validateFontCoverage(css)` in `@loworbitstudio/visor-theme-engine` scans emitted CSS and errors when any `--font-*` declaration names a custom family with no matching `@font-face` (or Google Fonts `@import`). Wired into `visor theme sync` and `generate-private-themes.mjs` so any new theme that drifts back into the broken state fails the build immediately.

  Operator follow-up (out of this changeset):

  - Upload Satoshi (Regular/Bold) and Monaspace Neon (Regular) to R2 under `low-orbit-studio/{satoshi,monaspace-neon}/` via `npm run fonts:add`. Until then the new `@font-face` URLs return 404 and browsers still fall back — but the structural fix is correct and the validator passes.
  - Satoshi license check for public CDN distribution.

- cb3c72e: VI-359 feat: add `fontshare` source type for typography slots, and migrate Blackout, Borderless, and Space (heading + body) to it. Resolves the license blocker on the VI-358 follow-up: Indian Type Foundry's Fontshare EULA (the license shipped with Satoshi) forbids public CDN re-hosting in §02, so the visor-fonts CDN path was not a viable distribution channel for Satoshi. Fontshare's own hosted API is the licensor-controlled channel and is explicitly permitted by the EULA.

  The new `source: fontshare` (no `org:` required) emits `@import url("https://api.fontshare.com/v2/css?f[]=<slug>@<weights>&display=swap")` at the top of the theme's CSS — Fontshare's response ships the real `@font-face` blocks, so the engine doesn't need to fabricate them. The `validateFontCoverage` validator was extended to recognize Fontshare `@import` URLs (alongside Google Fonts `@import`) as legitimate font-face coverage, mapping the lowercase-hyphenated slug back to the title-cased CSS family.

  Behavior is additive: themes still on `source: visor-fonts` (e.g. Space's Monaspace Neon) are unchanged; the new source type is opt-in per slot. Per-theme `@font-face` aliasing (VI-354) is not applied to fontshare sources because all themes sharing a family share Fontshare's hosted `@font-face` blocks — the browser dedupes by URL and the weights union naturally across themes.

  Wisdom captured at `docs/wisdom/W026-satoshi-license-forbids-public-cdn.md` for the license reading and the generalizable rule: read the EULA before adding a font to a CDN namespace under `npm run fonts:add`.

  Operator follow-up:

  - Companion PR in `visor-themes-private` migrates Strata's Satoshi slots from `source: visor-fonts` to `source: fontshare`.
  - Monaspace Neon (OFL-licensed) remains a candidate for the visor-fonts CDN; the upload (and any cross-machine smoke retest) is independent of this change.

## 0.5.0

### Minor Changes

- e61b904: VI-352 — Add per-family weight-name alias registry for visor-fonts CDN URL builder.

  Foundries like Pangram Pangram ship non-standard PostScript names (e.g. `Book` for the regular weight, `Super` for the heaviest). The new `font-aliases.ts` module maps `family → weight → PostScript suffix`; `buildVisorFontUrl()` consults the registry before falling back to the standard `WEIGHT_NAMES` table. Seeded with PP Model Mono and PP Model Plastic (`400 → Book`, `800 → Super`).

  No behavior change for any family not listed in the registry — Google-Fonts-style PostScript names continue to resolve through the existing table.

## 0.4.2

### Patch Changes

- c621d04: Fix neutral-ramp lightness interpolation: replaced the `-1` placeholder in `LIGHTNESS_TARGETS[500]` with `0.55` (Tailwind gray-500's OKLCH L) so `computeLightness()` produces well-distributed ramps for any input neutral, not just inputs that coincidentally land near L≈0.55. Removes dead `anchorShade === 600` branches (every role anchors at 500). Affects auto-derived `neutral.50–neutral.950` shades for themes that don't override neutrals explicitly; neutral.200–500 now land in proper gray territory instead of being pushed toward near-white.
- 8f444af: Rebalance `SEMANTIC_TEXT_MAP` so the auto-derived text scale clears WCAG AA contrast by default for any reasonable input neutral. `text-secondary` now maps to neutral 700/300 (light/dark) and `text-tertiary` to neutral 600/400 — both fixed-L shades. Previously `text-tertiary` landed on neutral 400 (L 0.65), giving ~3.5:1 contrast on white and forcing every stock theme to override the entire text scale. `text-primary` (900/50) and `text-disabled` (300/600) are unchanged. Stock themes (`neutral`) drop their defensive text overrides; `modern-minimal`, `blackout`, and `space` keep theirs as intentional brand language. Borderless dark text-secondary contrast improves from 2.96:1 to 6.77:1.
- 1b5c01a: Expand the runtime contrast validator (`checkContrastWarnings` in `validate.ts`) to check WCAG AA contrast for all standard text levels (`text-primary`, `text-secondary`, `text-tertiary`) and status text levels (`text-error`, `text-warning`, `text-success`, `text-info`) against `bg` and `surface` in both light and dark modes. Coverage expanded from 4 checks to 28 per theme. The validator now drives token values through the same semantic pipeline consumers render (`generatePrimitives` + `assignSemanticTokens` + `applyOverrides`), so theme-specific neutrals and overrides are respected instead of hardcoded `#111827` / `#f9fafb` proxies. `text-disabled` remains exempt per WCAG 1.4.3 Note; `text-link`, `text-link-hover`, `text-inverse`, `text-inverse-secondary` are out of scope (rendered on contextual / inverted surfaces). Theme authors iterating on `.visor.yaml` will now catch tertiary/secondary/status text contrast failures during validation instead of in production.

## 0.4.1

### Patch Changes

- 33f4853: Republish to include `flutterAdapter` export. The 0.4.0 tarball was stale — the local source had added `flutterAdapter` to `adapters/index.ts` but the published artifact did not include it, breaking `@loworbitstudio/visor@0.5.0` (which depends on `^0.4.0`) at import time.

## [Unreleased]

## [0.3.0] - Initial release

### Added

- Initial release of the Visor theme engine for building and distributing design system themes.

## 0.1.0 — Initial Release

### Themes

- **ENTR theme** — First extracted production theme from client project (VI-115)
- **Stock vs custom theme separation** — `themes/` directory split into stock (shipped) and custom (gitignored, consumer-owned) (VI-148)
- **Docs adapter** — `docsAdapter` for registering themes in the fumadocs site (VI-121)
- **Dark-first color scale** — Brand anchor at 500; dark/light scale generated separately to avoid wash-out (VI-152 + subsequent)
- **Label, group, and default-mode fields** — Theme metadata extended for registry and UI display

### Typography

- **Display font slot** — `.visor.yaml` typography section supports a dedicated display font separate from body (VI-118)
- **Font scale adjust** — `size-adjust` on `@font-face` declarations for themes with non-1 typography scale

### Infrastructure

- **Validator hardening** — Dark/light parity warnings; hooks/patterns/registry rule enforcement (VI-152)
- **License & package metadata** — MIT license, keywords, homepage, repository fields (VI-111)
- **npm audit clean** — Resolved all audit vulnerabilities at time of release (VI-108)
- **Removed broken `./fonts` subpath** — Dropped non-functional subpath export that caused resolution errors in consumers (VI-145)
