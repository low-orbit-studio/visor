# Spike: Branding Assets in Visor Themes (VI-467)

> **Status:** Spike — architecture + recommendation. No implementation code ships with this ticket; the work is decomposed into follow-up tickets at the end.
>
> **Goal:** Define how brand assets (logo, brandmark, wordmark, monochrome, per-mode variants) become first-class data in Visor themes, and recommend an implementation path.

---

## 1. Recommendation at a glance

Brand assets should be modeled **exactly like fonts already are** — declared in `.visor.yaml`, resolved by the theme-engine to CDN URLs, emitted as CSS custom properties, and guarded by a build-time coverage validator. Consumption is a three-layer stack: engine-emitted `--brand-*` CSS variables at the bottom, a `useBrand()` hook in the middle, and a copy-and-own `<Logo>` registry primitive on top. Per-mode swapping is **CSS-driven by default** (mirroring the existing `.wordmark-light/.wordmark-dark` rules), with a `mode` prop escape hatch.

The fonts subsystem is not just a loose analogy — it is the template. Every architectural question below has a direct precedent in `packages/theme-engine/src/fonts/`, which means the brand subsystem can reuse proven patterns (CDN URL builder, source enum, coverage validator, per-theme aliasing) rather than inventing them.

| Concern | Recommendation | Direct precedent |
|---|---|---|
| Where assets are declared | New top-level `brand` block in `.visor.yaml` | `typography` block |
| Where files live / ship from | CDN: `brands.visor.design` on R2 (D2) | `fonts.visor.design` |
| How resolved | `buildVisorBrandUrl()` → CDN URLs, emitted as `--brand-*` CSS vars | `buildVisorFontUrl()` → `@font-face` + `--font-*` |
| How consumed | `--brand-*` vars → `useBrand()` → `<Logo>` | `--font-*` vars; `SidebarProvider`/`useSidebar` |
| Per-mode swap | CSS-driven auto-swap + `mode` prop override | `globals-wordmark-rules.ts` |
| Variant slots | `logo`, `brandmark`, `wordmark`, `favicon`, `monochrome` + custom | typography slots (`heading`/`display`/`body`/`mono`) |
| File format | SVG-first, raster fallback, `currentColor` for monochrome | — (new) |
| Stock themes | Default to the Visor brand, tunable per theme (D3) | existing `/assets/visor-logo*.png` |
| Validation | `validateBrandCoverage(css)` build-time check | `validateFontCoverage(css)` |
| First deliverable | Visual Explorer cohesion (D1) | `visual-explorer.tsx` |

---

## 2. Decisions made (locked with operator)

These four decisions were confirmed before drafting and frame every recommendation below.

- **D1 — Phase 1 optimizes for the Visual Explorer cohesion test.** The cheapest path to validating "do the brand and tokens sing together" is to render a logo beside tokens in the docs Explorer. CDN standup and the shipped `<Logo>` component are deliberately deferred to later phases.
- **D2 — Distribution is CDN-hosted** at `brands.visor.design` (Cloudflare R2), mirroring the proven `fonts.visor.design` pipeline: source assets live in the theme repo and are synced to the CDN.
- **D3 — Stock themes default to the existing Visor brand assets** (the current Visor logo/wordmark), with the option to tune per stock theme later. Stock themes are **not** logo-less, and we do **not** commission a bespoke mark per theme up front.
- **D4 — Consumption is the full stack:** a `<Logo>` registry primitive backed by a `BrandProvider`/`useBrand()` context, layered over `--brand-*` CSS variables emitted by the engine.

**Reconciling D1 and D2.** Phase 1 (Explorer cohesion) needs no CDN. The schema is designed CDN-first so it is forward-compatible, but Phase 1 resolves brand assets from **local bundled files** in the docs app (`packages/docs/public/themes/{slug}/brand/`). A later phase stands up `brands.visor.design` and flips the resolver's `source` from `local` to `visor-brands`. This is exactly how a font slot can today be `local` or `visor-fonts` — same enum, different resolution.

---

## 3. Current state (what we are building on)

### 3.1 Themes carry tokens, not assets

A Visor theme is a single `.visor.yaml` file. The schema's top-level keys are `name`, `version`, `colors`, `colors-dark`, `typography`, `spacing`, `radius`, `shadows`, `motion`, `overrides` (`docs/visor-theme.schema.json`). There is **no** brand/asset concept. The emit pipeline (`packages/theme-engine/src/pipeline.ts`, `generateThemeDataFromConfig`) runs parse → resolve → generate primitives → assign semantic tokens → apply overrides → emit CSS in five sections. The published tokens package (`@loworbitstudio/visor-core`) is **CSS-only** — it bundles no binary assets; fonts are loaded by URL, never shipped in the npm tarball.

### 3.2 The fonts subsystem is the template

Fonts are an external, per-theme asset already modeled as first-class theme data. The mechanics, all in `packages/theme-engine/src/fonts/`:

- **Declaration** (`.visor.yaml`): `typography.<slot>.source` ∈ `google-fonts | visor-fonts | fontshare | local`, plus `org` and an optional `cdn-overrides`.
- **Resolution** (`resolve.ts`): `VISOR_FONTS_CDN = "https://fonts.visor.design"` (`resolve.ts:63`); `buildVisorFontUrl(org, family, weight, cdnBase)` (`resolve.ts:98`) produces `https://fonts.visor.design/{org}/{slug}/{Prefix}-{Weight}.woff2`.
- **Emission** (`pipeline.ts`): writes `@font-face` blocks for `visor-fonts`, `--font-*` custom properties, and comment placeholders for `local`.
- **Per-theme aliasing** (`adapters/nextjs.ts`, VI-354): family names are aliased per theme so co-loaded themes don't collide.
- **Validation** (`validate-coverage.ts`): `validateFontCoverage(css)` fails the build if a `--font-*` declaration has no matching `@font-face`.
- **Delivery**: R2 bucket with permissive GET CORS (`cloudflare/fonts-cors-rules.json`).

Every one of these has a brand-asset counterpart in the recommendation below.

### 3.3 Existing brand handling (all consumer-side today)

- **Visor's own marks** live at `assets/visor-logo.png` (1.3 MB) and `assets/visor-logo-dark.png` (6.7 MB), plus docs wordmarks at `packages/docs/public/visor-wordmark-{light,dark}.png`. These are heavy PNGs — see §6.
- **Per-mode swap precedents already exist:**
  - `ThemeImage` (`packages/docs/components/theme-image.tsx`): JS-driven — reads `resolvedTheme` from `next-themes` and picks `srcLight`/`srcDark`, guarded by a `mounted` flag (so it risks a first-paint flash).
  - Wordmark visibility rules (`scripts/rules/globals-wordmark-rules.ts:27-28`): CSS-driven — `.dark .wordmark-light { display: none; }` and `html:not(.dark) .wordmark-dark { display: none; }`, **validated at build time**. This is the better precedent: no flash, SSR-safe.
- **Block-level logo slots** (`blocks/admin-shell`, `blocks/footer-section`) accept a `logo?: React.ReactNode` — the consumer hand-provides the node. There is no theme-driven source.
- **Component gap is explicitly acknowledged:** `components/ui/avatar/avatar.visor.yaml:14` lists "Logo display (use NavbarBrand or a dedicated logo component)" under `when_not_to_use`, and `image.visor.yaml` similarly defers logos. A `<Logo>` primitive is a known, documented gap.
- **No prior brand work in the engine or schema** — `grep` for `visor-brands`/`brands.visor.design`/`--brand-*` in `packages/theme-engine/src` and the schema returns nothing. Clean slate.

---

## 4. Proposed architecture

Each subsection is annotated with the ticket question(s) it answers; §9 has the full coverage map.

### 4.A Where brand assets live  *(answers Q1, Q7)*

**Declaration:** a new optional top-level `brand` block in `.visor.yaml`, structured like `typography` — per-slot entries that each carry a `source`, `org`, and slug/path. See §5.1 for the concrete schema.

**Source of truth (files):** mirror fonts. Source assets live in the theme repo and are synced to the CDN; the `.visor.yaml` references them by `org` + slug, never by committing binaries into the engine or `visor-core`.

- **Stock / Visor brand:** introduce `assets/brand/` in this repo as the source for the default Visor mark set (SVG variants — see §6), synced to `brands.visor.design/low-orbit-studio/visor/…`.
- **Private themes:** `visor-themes-private/themes/{slug}/brand/` (the nested directory-per-theme layout already used there), synced to `brands.visor.design/{org}/{slug}/…`.

**Resolution:** `buildVisorBrandUrl(org, slug, variant, mode, format, cdnBase)` → e.g. `https://brands.visor.design/low-orbit-studio/blacklight/logo-dark.svg`, exactly paralleling `buildVisorFontUrl`. `source: local` resolves to a path under the consuming app's `public/` (Phase 1), `source: visor-brands` resolves to the CDN (Phase 2+).

**Why not bundle in YAML or as committed binaries:** inline SVG/data-URI bloats the theme file and is unusable for raster; committing binaries into `visor-core` breaks the "CSS-only npm package" invariant the fonts pipeline deliberately preserves. CDN-by-reference keeps `.visor.yaml` portable and the npm tarball lean.

### 4.B How brand assets are consumed  *(answers Q2, Q4)*

A three-layer stack, each layer usable on its own (matches D4):

1. **CSS custom properties (engine-emitted).** The engine emits per-variant, per-mode `url()` vars into the theme CSS, e.g. `--brand-logo`, `--brand-logo-dark`, `--brand-brandmark`, `--brand-wordmark`, `--brand-favicon`, `--brand-monochrome`. Lowest layer — enables pure-CSS usage (`background-image: var(--brand-brandmark)`), works with zero JS, framework-agnostic.
2. **`useBrand()` hook + `BrandProvider`.** A context primitive (precedent: `SidebarProvider`/`useSidebar` in `components/ui/sidebar/sidebar.tsx:26-34`) that exposes the resolved brand manifest as data: `{ logo, brandmark, wordmark, favicon, monochrome, getAsset(variant, mode) }`. For apps that need URLs in JS (e.g. setting `<link rel="icon">`, OG tags, canvas).
3. **`<Logo>` registry primitive.** The ergonomic default: `<Logo variant="brandmark" />` renders the right asset with correct `alt`, sizing, aspect-ratio, and per-mode swap. Copy-and-own via `npx visor add logo`. See §5.2.

**Variant slots (Q4):** a fixed standard set covers the common lockups — `logo` (full lockup), `brandmark` (symbol only), `wordmark` (type only), `favicon`, `monochrome` (single-color, see §6) — plus an optional `custom` map for operator-defined slots (e.g. `appIcon`, `emailHeader`). Fixed slots get typed props and dedicated CSS vars; custom slots are addressed by key through `getAsset()` and `var(--brand-custom-{key})`.

### 4.C Per-mode swap mechanism  *(answers Q3)*

**Recommendation: CSS-driven auto-swap is the default; a `mode` prop is the override.** Three reasons CSS-first wins over the `ThemeImage` (JS) approach:

- **No hydration flash.** The wordmark-rules precedent already swaps purely on the `.dark`/`.light` class on `<html>` set by the pre-hydration inline script (`packages/docs/app/layout.tsx`). `ThemeImage` gates on a `mounted` flag and can flash on first paint.
- **SSR-safe and JS-free** for the CSS-var layer.
- **It is already validated** — `globals-wordmark-rules.ts` proves the team will enforce these rules at build time.

Mechanism: the engine emits both light and dark URLs. The `<Logo>` component renders both variants and lets CSS pick (display toggle keyed off the active mode class), OR uses a single element whose `content`/`background-image` resolves to the mode-appropriate var via the cascade. The `mode` prop (`<Logo mode="dark">`) force-pins a variant for a known-context surface (e.g. a permanently dark hero in light mode) — this is opt-in, not the default. Auto-swap (no `mode` prop) follows the global theme mode.

### 4.D File format and size strategy  *(answers Q5)*

- **SVG-first.** Logos are vector by nature: infinitely scalable, tiny, CSS-styleable. The current Visor PNGs are a cautionary tale — `visor-logo-dark.png` is **6.7 MB**. A prep task should produce optimized SVG variants of the Visor mark.
- **Raster fallback** (`png`/`webp` at `@1x`/`@2x`) only for marks that are genuinely raster (photographic lockups). The `source`/schema supports a `formats` list like fonts support multiple weights.
- **`monochrome` uses `currentColor`.** Ship the monochrome variant as an SVG using `fill="currentColor"` so it inherits the surrounding text color — this is what ties the logo into the token system and powers the cohesion test (tint the mark with `--text-primary`, `--primary`, etc.). Requires inline-SVG rendering (see Open Questions on sanitization).
- **Favicon** is special: declare a single source SVG/PNG; favicon *size generation* (16/32/180/512) is a build concern — recommend leaving multi-size generation to consumers in v1 (Open Question).
- **CDN-hosted, npm stays CSS-only.** No binaries enter `visor-core`, consistent with fonts. Recommend a `clear-space` / safe-zone note per theme (Open Question on whether to tokenize it).

### 4.E Stock vs. private theme handling  *(answers Q6, Q7)*

**Stock themes (D3): default to the Visor brand.** Rather than logo-less or bespoke-per-theme, stock themes inherit a shared `visor` default brand (the SVG-converted Visor mark set). A stock theme may override any slot in its `brand` block to tune for that theme later. Implementation: a default brand object the resolver applies when a stock theme omits `brand`, paralleling how typography defaults are filled in `resolve.ts`.

> **Footgun flagged (important):** defaulting stock themes to the Visor brand means a consumer who adopts `blackout` and forgets to override could **ship Visor's logo in production**. This needs a guardrail — at minimum a `visor theme` lint warning ("brand is the Visor default — replace before launch") and a dev-only visible affordance in `<Logo>`. Tracked in Open Questions and as a ticket below.

**Private themes (Q7):** the standard drop-in location is `visor-themes-private/themes/{slug}/brand/` (source SVGs), with the theme's `{slug}/theme.visor.yaml` declaring `source: visor-brands`, its `org`, and slug. The existing private-theme discovery (`VISOR_THEMES_PRIVATE_PATH`, `scanNestedThemeDir`) needs no change — brand assets ride alongside the YAML and sync to the CDN. Blacklight is the natural first real consumer.

### 4.F Visual Explorer integration  *(answers Q8 — the Phase 1 deliverable, D1)*

Add a **"Brand" section** to the Explorer (`packages/docs/components/playgrounds/sections/`, registered in `sections/index.ts`), alphabetized into the existing `SECTIONS` list. It renders the active theme's brand:

- All variants (logo / brandmark / wordmark / monochrome) at a few representative sizes.
- On both light and dark surfaces side-by-side — the literal "do they sing" check.
- The `monochrome` variant tinted by token colors (`--text-primary`, `--primary`, `--surface-*`) to show brand+token cohesion.
- A per-variant toggle in the section toolbar; the existing per-mode toggle (`applyMode`, `visual-explorer.tsx`) already drives the swap for free.

Wiring: extend `ThemeEntry` in `packages/docs/lib/theme-config.ts` with optional brand fields (Phase 1 reads local `public/themes/{slug}/brand/` paths, or the shared Visor default). This is the smallest possible slice that proves the architecture before any CDN or published component exists.

---

## 5. Concrete specifications

### 5.1 Schema additions to `.visor.yaml`

```yaml
# New optional top-level block, structured like `typography`.
brand:
  # Shared defaults for all slots (like typography-wide org/source).
  org: low-orbit-studio          # CDN namespace; required when source: visor-brands
  source: visor-brands           # visor-brands | local   (default: visor-brands)
  cdn-overrides:
    visor-brands: https://brands.visor.design   # optional base override

  # Standard slots. Each may be a string slug (light+dark inferred) or an object.
  logo:                          # full lockup
    slug: visor                  # → brands.visor.design/{org}/visor/logo[-dark].svg
    formats: [svg]               # svg | png | webp ; first is preferred
    light: logo-light.svg        # explicit per-mode override (optional)
    dark: logo-dark.svg
  brandmark:                     # symbol only
    slug: visor
  wordmark:                      # type only
    slug: visor
  monochrome:                    # single-color SVG using currentColor
    slug: visor
  favicon:
    slug: visor
    formats: [svg, png]

  # Optional operator-defined slots, addressed by key.
  custom:
    appIcon: { slug: visor, formats: [png] }
```

JSON Schema sketch (to add to `docs/visor-theme.schema.json` and `packages/theme-engine/src/types.ts`):

```jsonc
"brand": {
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "org": { "type": "string" },
    "source": { "enum": ["visor-brands", "local"], "default": "visor-brands" },
    "cdn-overrides": {
      "type": "object",
      "properties": { "visor-brands": { "type": "string", "format": "uri" } }
    },
    "logo":       { "$ref": "#/$defs/brandSlot" },
    "brandmark":  { "$ref": "#/$defs/brandSlot" },
    "wordmark":   { "$ref": "#/$defs/brandSlot" },
    "monochrome": { "$ref": "#/$defs/brandSlot" },
    "favicon":    { "$ref": "#/$defs/brandSlot" },
    "custom": { "type": "object", "additionalProperties": { "$ref": "#/$defs/brandSlot" } }
  }
}
// brandSlot: { slug: string, formats?: string[], light?: string, dark?: string }
// Cross-field rule (mirrors fonts): source: visor-brands requires `org` unless cdn-overrides is set.
```

### 5.2 Component API

```tsx
// components/ui/logo/logo.tsx  (registry: `npx visor add logo`)

type BrandVariant = "logo" | "brandmark" | "wordmark" | "monochrome" | "favicon";

interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  variant?: BrandVariant;     // default: "logo"
  mode?: "light" | "dark";    // omit → auto-swap with active theme mode
  size?: number | string;     // height; width derives from aspect ratio
  title?: string;             // accessible name; falls back to theme name + variant
}

// Auto-swap (default): follows the global .dark/.light class, CSS-driven, no flash.
<Logo />
<Logo variant="brandmark" size={32} />
// Force a variant for a known-context surface:
<Logo variant="monochrome" mode="dark" />

// Provider + hook (precedent: SidebarProvider/useSidebar)
<BrandProvider brand={resolvedBrand}>...</BrandProvider>

const { logo, brandmark, wordmark, favicon, monochrome, getAsset } = useBrand();
// getAsset("logo", "dark") → resolved URL; also reaches custom slots.
```

The `monochrome` variant renders inline SVG with `fill: currentColor` so `color: var(--primary)` on an ancestor tints the mark. Other variants render as `<img>` with the mode-appropriate `src`. The component ships with `logo.module.css`, `logo.visor.yaml` (required metadata: `name`, `description`, `category` — propose a new `branding` category, `when_to_use`, `when_not_to_use`, `why`, `dependencies`, `example`), and `__tests__/logo.test.tsx` + `logo.a11y.test.tsx`, then a `registry/registry-ui.ts` entry with `registryDependencies: ["utils"]`.

### 5.3 Engine resolution + validation

```ts
// packages/theme-engine/src/brand/resolve.ts   (parallels fonts/resolve.ts)
export const VISOR_BRANDS_CDN = "https://brands.visor.design";
export function buildVisorBrandUrl(
  org: string, slug: string, variant: BrandVariant,
  mode: "light" | "dark", format: string, cdnBase?: string | null,
): string {
  const base = cdnBase ?? VISOR_BRANDS_CDN;
  const modeSuffix = mode === "dark" ? "-dark" : "";
  return `${base}/${org}/${slug}/${variant}${modeSuffix}.${format}`;
}

// packages/theme-engine/src/brand/validate-coverage.ts (parallels validateFontCoverage)
// Fails the build if a --brand-* var references a CDN URL with no resolvable source,
// or a `local` source path that doesn't exist under public/.
export function validateBrandCoverage(css: string): BrandCoverageResult { /* … */ }
```

CSS emission (into the theme CSS bundle, alongside `--font-*`):

```css
:root {
  --brand-logo:        url("https://brands.visor.design/low-orbit-studio/visor/logo-light.svg");
  --brand-logo-dark:   url("https://brands.visor.design/low-orbit-studio/visor/logo-dark.svg");
  --brand-brandmark:   url("…/brandmark-light.svg");
  /* …wordmark, favicon, monochrome… */
}
```

---

## 6. Phased implementation plan + ticket breakdown

Estimates use the Visor pointing scale (the spike itself is a 3). Phases gate on operator review.

### Phase 1 — Visual Explorer cohesion *(D1; no CDN, local assets)*

| Ticket | Scope | Est |
|---|---|---|
| **Prep** | Produce optimized **SVG** variants of the Visor mark (logo, brandmark, wordmark, monochrome) from the existing PNGs; place in `assets/brand/` + `packages/docs/public/themes/visor/brand/`. Asset prep only — no new design (logo design is out of scope). | 2 |
| **Schema (minimal)** | Add the `brand` block to `docs/visor-theme.schema.json` + `theme-engine` types + `resolve.ts` defaults; emit `--brand-*` CSS vars; support `source: local`. No CDN resolution yet. | 3 |
| **Explorer Brand section** | New alphabetized `BrandSection` in the docs Explorer: variant grid, light/dark side-by-side, `monochrome` tinted by tokens, per-variant toggle; extend `ThemeEntry`. Stock themes show the Visor default. | 3 |

### Phase 2 — CDN + distribution *(D2)*

| Ticket | Scope | Est |
|---|---|---|
| **Stand up `brands.visor.design`** | R2 bucket + GET CORS (clone `cloudflare/fonts-cors-rules.json`) + custom domain. | 2 |
| **`visor-brands` resolution + validator** | `buildVisorBrandUrl()`, `source: visor-brands` + `org` + `cdn-overrides`; `validateBrandCoverage(css)` wired into `theme sync` / private-theme generation. | 3 |
| **Brand sync pipeline** | Repo brand source → R2 (mirror the fonts sync); content-hash/cache-busting decision (see Open Qs). | 3 |
| **Stock-brand guardrail** | `visor theme` lint warning + dev-only `<Logo>` affordance when the brand is the Visor default ("replace before launch"). | 2 |

### Phase 3 — Shipped component + first real consumer *(D4)*

| Ticket | Scope | Est |
|---|---|---|
| **`<Logo>` primitive** | `components/ui/logo/*` + `BrandProvider`/`useBrand()`, CVA where useful, inline-SVG for `monochrome`, tests + a11y tests, `logo.visor.yaml`, `registry/registry-ui.ts` entry, new `branding` category. | 3 |
| **Docs + manifest + publish** | `<Logo>` docs page, manifest regen, coordinated `@loworbitstudio/visor` release (publish-smoke gate). | 2 |
| **Private themes + Blacklight** | `visor-themes-private/themes/{slug}/brand/` convention; onboard Blacklight brand as the first real consumer; per-mode marks. | 3 |

**Total:** ~26 points across 3 phases. Phase 1 (~8) delivers the operator-prioritized cohesion test end-to-end with no infrastructure.

---

## 7. Decisions made (summary)

1. Brand assets are modeled on the fonts subsystem — declaration, CDN resolution, CSS-var emission, coverage validator.
2. Declared via a new top-level `brand` block in `.visor.yaml` (§5.1).
3. CDN-hosted at `brands.visor.design` (D2); npm `visor-core` stays CSS-only.
4. Three-layer consumption: `--brand-*` vars → `useBrand()` → `<Logo>` (D4).
5. Per-mode swap is CSS-driven by default, `mode` prop override.
6. Standard slots `logo|brandmark|wordmark|favicon|monochrome` + `custom`.
7. SVG-first; `monochrome` uses `currentColor`; raster fallback only when needed.
8. Stock themes default to the Visor brand, tunable per theme (D3), with a launch guardrail.
9. Phase 1 = Explorer cohesion with local assets (D1); CDN and component follow.

## 8. Open questions for operator

1. **CSS cascade layer + var naming.** Should `--brand-*` vars emit into the existing `visor-semantic` layer, or a new `visor-brand` layer? Confirm the `--brand-{variant}[-dark]` naming.
2. **Monochrome / inline-SVG sanitization.** `currentColor` tinting needs inline SVG. For private/consumer SVGs, do we sanitize on the build/sync step, and is inline-SVG acceptable in `<Logo>` (vs. `<img>` + CSS mask as a no-inline alternative)?
3. **Stock-brand licensing guardrail.** Confirm the desired strength: silent default, lint warning, or a visible dev-only "Visor default — replace before launch" badge on `<Logo>`? (Recommendation: lint warning + dev badge.)
4. **Favicon multi-size generation.** In scope for the brand system (generate 16/32/180/512), or leave to consumers in v1? (Recommendation: declare one source, defer generation.)
5. **Cache-busting.** Fonts are effectively immutable; logos change more often. Content-hash in the CDN path, or rely on R2 cache headers + manual purge?
6. **Clear-space / aspect ratio.** Tokenize a per-variant safe-zone and locked aspect ratio, or treat as documentation-only guidance?
7. **`NavbarBrand` reconciliation.** `avatar.visor.yaml` references a `NavbarBrand`; confirm whether `<Logo>` supersedes/feeds it or they coexist.

## 9. Question coverage map

Verification requires all eight ticket questions be addressed. Mapping:

| # | Ticket question | Answered in |
|---|---|---|
| 1 | Where do brand assets live? | §4.A, §5.1 |
| 2 | How are they consumed? | §4.B, §5.2 |
| 3 | Per-mode variants | §4.C, §5.2 |
| 4 | Variant types | §4.B, §5.1 |
| 5 | File format strategy | §4.D |
| 6 | Stock themes | §4.E (D3), §6, §8 (open Q3) |
| 7 | Private themes | §4.A, §4.E |
| 8 | Visual Explorer integration | §4.F, §6 (Phase 1) |

## 10. Appendix — codebase references

- **Fonts template:** `packages/theme-engine/src/fonts/resolve.ts` (`VISOR_FONTS_CDN:63`, `buildVisorFontUrl:98`), `…/fonts/pipeline.ts`, `…/fonts/validate-coverage.ts`, `…/adapters/nextjs.ts` (per-theme aliasing, VI-354).
- **Schema + pipeline:** `docs/visor-theme.schema.json`, `packages/theme-engine/src/types.ts`, `packages/theme-engine/src/pipeline.ts` (`generateThemeDataFromConfig`), `…/resolve.ts` (defaults).
- **Visual Explorer:** `packages/docs/components/playgrounds/visual-explorer.tsx`, `…/playgrounds/sections/index.ts`, `packages/docs/lib/theme-config.ts` (`THEME_GROUPS`, `applyTheme`, `applyMode`), `packages/docs/components/theme-image.tsx`.
- **Per-mode precedent:** `scripts/rules/globals-wordmark-rules.ts:27-28`.
- **Provider precedent:** `components/ui/sidebar/sidebar.tsx:26-34`.
- **Component gap pointer:** `components/ui/avatar/avatar.visor.yaml:14`; `components/ui/image/image.visor.yaml`.
- **Registry + CLI:** `registry/registry-ui.ts`, `registry/schema.ts`, `packages/cli/src/generate/build-registry.ts`, `…/build-manifest.ts`, `packages/cli/src/commands/add.ts`; publish gate `scripts/visor-publish-smoke.mjs`.
- **Stock themes:** `themes/*.visor.yaml` (source of truth) → `packages/docs/public/themes/*.visor.yaml`.
- **Private themes:** `visor-themes-private/themes/{slug}/theme.visor.yaml` (nested; not present on this machine), discovery via `VISOR_THEMES_PRIVATE_PATH` / `scanNestedThemeDir`.
- **Existing Visor brand assets:** `assets/visor-logo.png` (1.3 MB), `assets/visor-logo-dark.png` (6.7 MB), `packages/docs/public/visor-wordmark-{light,dark}.png`.
- **CDN config precedent:** `cloudflare/fonts-cors-rules.json`.
