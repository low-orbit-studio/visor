# Changelog

## 0.10.0

### Minor Changes

- 0abb273: VI-451 feat: semantic alias surface (intent, hairline, discrete scales).

  Adds an engine-wide alias layer on top of the existing primitive ramp so consumers can reference brand/feedback colors, alpha-based hairlines, and discrete pixel-named scales without redeclaring a parallel token surface. All new aliases emit into the `visor-semantic` cascade layer (declared but previously empty) so consumer overrides in app-globals still take precedence.

  New tokens — 38 total — emitted by every theme:

  - Bare-name intent (shadcn convention): `--primary`, `--primary-text`, `--accent`, `--success`, `--warning`, `--destructive`, `--info`
  - Alpha hairlines: `--hairline`, `--hairline-strong`
  - Surface extensions: `--surface-screen`, `--surface-elev`
  - Text extension: `--text-muted`
  - Discrete font-size aliases: `--text-{11,13,14,16,20,24,32,40,48}`
  - Discrete 4px-grid space aliases: `--space-{1..16}`

  Themes pin per-mode values via flat-key overrides (e.g. `primary: "#6BEBA5"`); bare `primary` resolves to the new `intent` group while prefixed `text-primary` continues to route to the text group — no collision with existing tokens. Discrete scale values are mode-agnostic; `--space-N` derives from `spacing.base` so a theme with a non-default base gets a proportional scale.

  Engine ships with derived defaults so every theme picks up the alias surface automatically. Theme-specific values flow through the existing `overrides.{light,dark}` path. Surfaces the gap [VI-451](https://linear.app/low-orbit-studio/issue/VI-451) flagged from the admin-ui organization-management reference build — consumers can now `var(--surface-card)`, `var(--primary)`, `var(--hairline)`, `var(--text-14)`, etc. directly.

  Drive-by: engine schema now accepts opt-in `motion.easing-overshoot` for themes that want bouncy entrances (emitted as `--motion-easing-overshoot` only when set, so the default token surface is unchanged for themes that don't opt in).

## 0.9.0

### Minor Changes

- 36b4b26: VI-445 feat: per-theme CDN routing for `source: visor-fonts`.

  Themes can now declare `typography.cdn-overrides.visor-fonts` to route their licensed-font URLs at a project-owned bucket instead of the shared `fonts.visor.design`. When the override is in play, the per-slot `org` may be empty (the override CDN encodes the project namespace), and resolution emits `{cdn}/{slug}/{prefix}-{weight}.woff2`. Preconnect hints deduplicate per unique CDN. Schema validation relaxes the `org` requirement only when an override is set and rejects empty override URLs.

  This unblocks Knowmentum's Hoefler Gotham bucket (EULA-mitigation CORS scoped to knowmentum.ai origins) and the same pattern for any future Lineto/Hoefler-style font under a theme-specific license. Themes without an override resolve to `fonts.visor.design` exactly as before — fully backwards compatible.

## 0.8.1

### Patch Changes

- 8bd7a00: chore(theme-engine): add Gotham weight alias (400 → Book)

  Hoefler's Gotham uses "Book" instead of "Regular" at weight 400. Light (300) and Medium (500) match `WEIGHT_NAMES` defaults. Knowmentum theme consumes Gotham via the visor-fonts CDN; this alias makes `fonts.visor.design/low-orbit-studio/gotham/Gotham-Book.woff2` resolve.

- 98d6a9b: VI-420 feat: theme validator catches override-incompleteness — would have caught VI-417.

  `validate()` in `packages/theme-engine/src/validate.ts` now emits `INCOMPLETE_OVERRIDE` warnings when a theme manifest declares `overrides.light` with a `surface-page` or `surface-card` override (signaling inverted always-dark light treatment) but omits the leak-prone semantic tokens that the engine would otherwise resolve to bright light-mode defaults.

  The required set covers text (4), surface (20), border (4), and interactive (7) tokens whose engine defaults leak on inverted themes. Saturated brand/status tokens are excluded — their defaults render correctly across modes.

  Trigger is narrowed to `surface-page` / `surface-card` overrides specifically (D1's literal "text-_ or surface-_" rule false-positives on light-bg themes that stylistically tweak text alphas like modern-minimal, neutral, space). Dark-mode completeness is intentionally out of scope — engine dark defaults are already dark and rarely leak symmetrically.

  Severity: WARNING (D3) — non-blocking. Operators may have intentional reasons for partial overrides, and emerging themes shouldn't be blocked.

  Live verification:

  - `npx visor theme validate themes/blackout.visor.yaml` → 0 INCOMPLETE_OVERRIDE warnings (post-VI-417 baseline is clean).
  - Pre-VI-417 Blackout fixture → 19 INCOMPLETE_OVERRIDE warnings, exactly matching the tokens VI-417 added.
  - modern-minimal, neutral, space → 0 INCOMPLETE_OVERRIDE warnings (no false positives).
  - borderless → 25 warnings (true positive — same class of bug as pre-VI-417 Blackout, follow-up).

## 0.8.0

### Minor Changes

- dc9a96d: VI-368: add `--scope-prefix` option to the nextjs theme adapter.

  `visor theme apply --adapter nextjs` now accepts an optional `--scope-prefix <selector>` flag that wraps all generated CSS under the supplied selector instead of `:root`. This enables the body-class repaint pattern that `/lo-prototype-to-visor` Phase 3 prescribes, where multiple themes coexist on a page and swap via a body class (e.g. `body.blacklight-theme`).

  **Behavior when `--scope-prefix 'body.blacklight-theme'` is set:**

  - Primitives + light tokens emit under `body.blacklight-theme { ... }` instead of `:root { ... }`.
  - The manual-toggle dark block scopes to the composed selectors `body.blacklight-theme.dark`, `body.blacklight-theme.theme-dark`, `body.blacklight-theme[data-theme="dark"]` — matching the body-class + `html.dark` dual-toggle pattern used by R2's `body.entr-theme` / `body.blackout-theme`.
  - The `@media (prefers-color-scheme: dark)` block composes the prefix with the existing `:not(.light)` guards: `body.blacklight-theme:not(.light):not(.theme-light):not([data-theme="light"])`.

  **Backward compatible.** When `--scope-prefix` is omitted, output is unchanged (`:root` selectors), so existing setups continue to work without modification.

  New programmatic option `NextJSAdapterOptions.scopePrefix?: string` on `nextjsAdapter()` for callers using the adapter directly. The same prefix is threaded through `generatePrimitivesCss`, `generateLightCss`, and `generateDarkCss` via an optional `options.scopePrefix` parameter on each.

### Patch Changes

- 9fac26a: VI-373 fix: register `PP Model Sans` in `FONT_WEIGHT_ALIASES`.

  `FONT_WEIGHT_ALIASES` (in `packages/theme-engine/src/fonts/font-aliases.ts`) had entries for `PP Model Mono` and `PP Model Plastic` mapping weights 400 → `Book` and 800 → `Super`, but was missing `PP Model Sans`. Result: `buildVisorFontUrl` generated `PPModelSans-Regular.woff2` and `PPModelSans-ExtraBold.woff2` — both 404 on the Visor font CDN, where the real files are `-Book.woff2` and `-Super.woff2` (Pangram-Pangram's PostScript naming).

  Net effect on the Blacklight Underground theme: every `--font-sans` slot at weight 400 or 800 silently failed `@font-face` loading. Because the Underground stack is `"PP Model Sans [blacklight-underground]", "PP Model Sans"` with no terminal generic fallback by design (VI-354), the browser fell through to its default (Times) instead of rendering Sans. Visible in the docs sidebar and any non-display text driven by `--font-sans`.

  Fix is a three-line addition mirroring the existing Mono/Plastic entries. Test coverage in `font-aliases.test.ts` extended to assert `lookupFontWeightAlias` resolves Sans at 400/800 and `buildVisorFontUrl` emits the correct `PPModelSans-Book.woff2` / `PPModelSans-Super.woff2` URLs.

## 0.7.0

### Minor Changes

- 70ad01f: VI-367: make mono slot @font-face loading discoverable + non-trapping.

  Closes the trap surfaced post-BO-35 where a downstream theme pinned to `@loworbitstudio/visor-theme-engine@^0.4.x` could only express `typography.mono: { family }` (the only thing 0.4 allowed), yet failed the 0.6.0 `validate-coverage` check because the mono family had no matching `@font-face`. The fix the error message pointed to — adding `source`/`org` to the mono slot — was not expressible on the consumer's pinned engine version.

  **Mono slot inherits source/org from a matching slot.** When `typography.mono.family` matches `typography.heading.family`, `typography.display.family`, or `typography.body.family` (case-insensitive) AND `typography.mono.source` is unset AND the matching slot has `source` set, mono now inherits `source`/`org` from the covering slot. Match precedence: heading → display → body. Themes that explicitly set `typography.mono.source` keep full control — inheritance only kicks in when mono's `source` is absent.

  This mirrors the existing weight-merging behavior in the font pipeline when body/display family matches heading and covers the common "mono uses the same font as body" case (e.g. Blacklight's `PP Model Mono` in both slots) without forcing every theme to repeat `source`/`org` on the mono slot.

  **Coverage error message names the version requirement.** When `validate-coverage` fails on `--font-mono`, the error now explicitly names the engine and CLI version requirement: mono-slot `source`/`org` loading requires `@loworbitstudio/visor-theme-engine ≥ 0.5.0` AND `@loworbitstudio/visor ≥ 0.10.0`. Bumping just the engine is silently insufficient because the visor CLI transitively pins its own engine copy (CLI 0.10 → engine ^0.6.0), so consumers must bump both packages together. Non-mono slots keep the shorter message.

  New export: `formatFontCoverageError(filename, declaredAt, family)` from `@loworbitstudio/visor-theme-engine`. The CLI and the docs `generate-private-themes.mjs` script use it so the version-requirement note surfaces consistently from both call sites.

  **Consumer migration — themes pinned to engine 0.4.x with a custom mono font:**

  1. Bump **both** `@loworbitstudio/visor` to `≥0.10` (CLI with engine ^0.6 pin) and `@loworbitstudio/visor-theme-engine` to `≥0.6` together.
  2. If your mono slot's family already matches another slot (heading/display/body) that has `source`/`org` set, no `.visor.yaml` change is required — the engine will inherit.
  3. Otherwise, add `source` (and `org` for `visor-fonts`) to the mono slot directly:

  ```yaml
  typography:
    mono:
      family: PP Model Mono
      weight: 400
      source: visor-fonts # or google-fonts, fontshare, local
      org: low-orbit-studio # required for visor-fonts only
  ```

  No `.visor.yaml` schema changes; no breaking behavior for themes that already pass `validate-coverage`.

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
