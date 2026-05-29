# Spike: Branding Assets in Visor Themes (VI-467)

> **Status:** Spike — architecture + recommendation. No implementation code ships with this ticket; the work is decomposed into follow-up tickets at the end.
>
> **Goal:** Define how brand assets (logo, brandmark, wordmark, monochrome, per-mode variants) become first-class data in Visor themes, and recommend an implementation path.
>
> **Update (VI-468):** The 7 open questions are now operator-resolved — see §8, "Resolved decisions." Phase 1 is filed as **VI-469** (SVG asset prep), **VI-470** (schema + engine), **VI-471** (Explorer Brand section).

---

## 1. Recommendation at a glance

Brand assets should be modeled **exactly like fonts already are** — declared in `.visor.yaml`, resolved by the theme-engine to CDN URLs, emitted as CSS custom properties, and guarded by a build-time coverage validator. Consumption is a three-layer stack: engine-emitted `--brand-*` CSS variables at the bottom, a `useBrand()` hook in the middle, and a copy-and-own `<Logo>` registry primitive on top. Per-mode swapping is **CSS-driven by default** (mirroring the existing `.wordmark-light/.wordmark-dark` rules), with a `mode` prop escape hatch.

The fonts subsystem is not just a loose analogy — it is the template. Every architectural question below has a direct precedent in `packages/theme-engine/src/fonts/`, which means the brand subsystem can reuse proven patterns (CDN URL builder, source enum, coverage validator, per-theme aliasing) rather than inventing them.

| Concern | Recommendation | Direct precedent |
|---|---|---|
| Where assets are declared | New top-level `brand` block in `.visor.yaml` | `typography` block |
| Where files live / ship from | CDN: `brands.visor.design` on R2 (D2) | `fonts.visor.design` |
| How resolved | `buildVisorBrandUrl()` → content-hashed CDN URLs, emitted as `--brand-*` vars in a dedicated `visor-brand` cascade layer | `buildVisorFontUrl()` → `@font-face` + `--font-*` |
| How consumed | `--brand-*` vars → `useBrand()` → `<Logo>` (supersedes `NavbarBrand`) | `--font-*` vars; `SidebarProvider`/`useSidebar` |
| Per-mode swap | CSS-driven auto-swap + `mode` prop override | `globals-wordmark-rules.ts` |
| Variant slots | `logo`, `brandmark`, `wordmark`, `favicon`, `monochrome` + custom | typography slots (`heading`/`display`/`body`/`mono`) |
| File format | SVG-first, raster fallback; monochrome via `mask-image` + `currentColor`; favicon set generated in build | — (new) |
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

1. **CSS custom properties (engine-emitted).** The engine emits, into a dedicated **`visor-brand` cascade layer** (ordered after `visor-semantic` — Q1 resolved), **mode-scoped `--brand-{variant}`** vars whose value swaps with the active mode selector (matching the adaptive-token pattern), plus explicit `--brand-{variant}-light`/`-dark` for forced-mode use. Lowest layer — enables pure-CSS usage (`background-image: var(--brand-brandmark)`), works with zero JS, framework-agnostic. The dedicated layer keeps brand overrides cleanly separable from semantic tokens.
2. **`useBrand()` hook + `BrandProvider`.** A context primitive (precedent: `SidebarProvider`/`useSidebar` in `components/ui/sidebar/sidebar.tsx:26-34`) that exposes the resolved brand manifest as data: `{ logo, brandmark, wordmark, favicon, monochrome, getAsset(variant, mode) }`. For apps that need URLs in JS (e.g. setting `<link rel="icon">`, OG tags, canvas).
3. **`<Logo>` registry primitive.** The ergonomic default: `<Logo variant="brandmark" />` renders the right asset with correct `alt`, sizing, aspect-ratio, and per-mode swap. Copy-and-own via `npx visor add logo`. See §5.2. **`<Logo>` supersedes the existing `NavbarBrand` slot (Q7 resolved):** `NavbarBrand` (`components/ui/navbar/navbar.tsx:39`) is deprecated in favor of `<Logo>` as the single canonical brand renderer — copy-and-own consumers are unaffected until they re-add navbar.

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
- **`monochrome` is tinted via CSS masking (Q2 resolved).** Render the monochrome mark with `mask-image: var(--brand-monochrome)` + `background-color: currentColor` (or any token) — it inherits the surrounding color and ties into the token system (tint with `--text-primary`, `--primary`, etc.) **without injecting SVG markup**. No inline SVG, no DOMPurify, no new sanitization surface (the repo ships no SVG sanitizer today). Inline-SVG is deferred unless a use case truly needs in-SVG element styling.
- **Favicon set is generated in build (Q4 resolved).** Declare a single source (SVG + 512 PNG); the brand build/sync step generates the full set — `16/32/48` (`.ico`), `180` (apple-touch), `192/512` (PNG / web-manifest) — via an image step (e.g. `sharp`). Consumers wire the generated set into their framework's favicon handling.
- **Clear-space + aspect ratio are tokenized (Q6 resolved).** Each variant declares a `clearSpace` (safe-zone) and `aspectRatio`; `<Logo>` enforces them (padding + locked ratio box). Aspect ratio may be auto-derived from the SVG viewBox but is pinned as a token for consistency.
- **CDN-hosted, npm stays CSS-only.** No binaries enter `visor-core`, consistent with fonts.

### 4.E Stock vs. private theme handling  *(answers Q6, Q7)*

**Stock themes (D3): default to the Visor brand.** Rather than logo-less or bespoke-per-theme, stock themes inherit a shared `visor` default brand (the SVG-converted Visor mark set). A stock theme may override any slot in its `brand` block to tune for that theme later. Implementation: a default brand object the resolver applies when a stock theme omits `brand`, paralleling how typography defaults are filled in `resolve.ts`.

> **Footgun flagged (important):** defaulting stock themes to the Visor brand means a consumer who adopts `blackout` and forgets to override could **ship Visor's logo in production**. **Resolved (Q3):** a `visor doctor`/theme lint warning ("brand is the Visor default — replace before launch") plus a dev-only visible badge in `<Logo>` — warn, don't block. Ticketed in Phase 2 (§6).

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
    aspectRatio: "3 / 1"         # locked ratio (Q6); else derived from SVG viewBox
    clearSpace: "0.5rem"         # safe-zone padding enforced by <Logo> (Q6)
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
// brandSlot: { slug: string, formats?: string[], light?: string, dark?: string,
//              clearSpace?: string, aspectRatio?: string }   // clearSpace/aspectRatio per Q6
// Cross-field rule (mirrors fonts): source: visor-brands requires `org` unless cdn-overrides is set.
// Emission: --brand-* vars are written into a dedicated `visor-brand` @layer (after visor-semantic) — Q1.
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

The `monochrome` variant renders via CSS `mask-image: var(--brand-monochrome)` + `background-color: currentColor` (no inline SVG — Q2), so `color: var(--primary)` on an ancestor tints the mark. Other variants render as `<img>` with the mode-appropriate `src`. `<Logo>` is the canonical brand renderer and supersedes `NavbarBrand` (Q7). The component ships with `logo.module.css`, `logo.visor.yaml` (required metadata: `name`, `description`, `category` — propose a new `branding` category, `when_to_use`, `when_not_to_use`, `why`, `dependencies`, `example`), and `__tests__/logo.test.tsx` + `logo.a11y.test.tsx`, then a `registry/registry-ui.ts` entry with `registryDependencies: ["utils"]`.

### 5.3 Engine resolution + validation

```ts
// packages/theme-engine/src/brand/resolve.ts   (parallels fonts/resolve.ts)
export const VISOR_BRANDS_CDN = "https://brands.visor.design";
export function buildVisorBrandUrl(
  org: string, slug: string, variant: BrandVariant,
  mode: "light" | "dark", format: string,
  hash: string,                       // content hash from the sync step (Q5)
  cdnBase?: string | null,
): string {
  const base = cdnBase ?? VISOR_BRANDS_CDN;
  const modeSuffix = mode === "dark" ? "-dark" : "";
  // Content-hash segment → immutable URL that busts automatically when the asset changes (Q5).
  return `${base}/${org}/${slug}/${variant}${modeSuffix}.${hash}.${format}`;
}

// packages/theme-engine/src/brand/validate-coverage.ts (parallels validateFontCoverage)
// Fails the build if a --brand-* var references a CDN URL with no resolvable source,
// or a `local` source path that doesn't exist under public/.
export function validateBrandCoverage(css: string): BrandCoverageResult { /* … */ }
```

CSS emission (into the theme CSS bundle, alongside `--font-*`):

```css
@layer visor-brand {
  :root, .light {
    --brand-logo:        url("https://brands.visor.design/low-orbit-studio/visor/logo.a1b2c3.svg");
    --brand-logo-light:  url("…/logo.a1b2c3.svg");      /* forced-mode alias (Q1) */
    --brand-logo-dark:   url("…/logo-dark.d4e5f6.svg");
    /* …brandmark, wordmark, favicon, monochrome… (content-hashed paths, Q5) */
  }
  .dark, .theme-dark {
    --brand-logo:        url("…/logo-dark.d4e5f6.svg"); /* mode-scoped swap → var(--brand-logo) auto-resolves */
  }
}
```

---

## 6. Phased implementation plan + ticket breakdown

Estimates use the Visor pointing scale (the spike itself is a 3). Phases gate on operator review.

### Phase 1 — Visual Explorer cohesion *(D1; no CDN, local assets — FILED)*

| Ticket | Scope | Est |
|---|---|---|
| **VI-469** | Produce optimized **SVG** variants of the Visor mark (logo, brandmark, wordmark, monochrome) from the existing PNGs; place in `assets/brand/` + `packages/docs/public/themes/visor/brand/`. Asset prep only — no new design (logo design is out of scope). | 2 |
| **VI-470** | Add the `brand` block to `docs/visor-theme.schema.json` + `theme-engine` types + `resolve.ts` defaults; emit mode-scoped `--brand-*` vars into a `visor-brand` `@layer` (Q1); include `clearSpace`/`aspectRatio` fields (Q6); support `source: local`. No CDN yet. | 3 |
| **VI-471** | New alphabetized `BrandSection` in the docs Explorer: variant grid, light/dark side-by-side, `monochrome` tinted via `mask-image` + `currentColor` (Q2), per-variant toggle; extend `ThemeEntry`. Stock themes show the Visor default. Blocked by VI-469 + VI-470. | 3 |

### Phase 2 — CDN + distribution *(D2)*

| Ticket | Scope | Est |
|---|---|---|
| **Stand up `brands.visor.design`** | R2 bucket + GET CORS (clone `cloudflare/fonts-cors-rules.json`) + custom domain. | 2 |
| **`visor-brands` resolution + validator** | `buildVisorBrandUrl()` with content-hash (Q5), `source: visor-brands` + `org` + `cdn-overrides`; `validateBrandCoverage(css)` wired into `theme sync` / private-theme generation. | 3 |
| **Brand sync + content-hashing** | Repo brand source → R2 (mirror the fonts sync); compute content hashes for immutable URLs (Q5). | 3 |
| **Favicon generation** | Generate the favicon set (`.ico` 16/32/48, apple-touch 180, 192/512 PNG + web-manifest) from a single source via `sharp` (Q4); publish to CDN. | 2 |
| **Stock-brand guardrail** | `visor doctor`/theme lint warning + dev-only `<Logo>` badge when the brand is the Visor default ("replace before launch") (Q3). | 2 |

### Phase 3 — Shipped component + first real consumer *(D4)*

| Ticket | Scope | Est |
|---|---|---|
| **`<Logo>` primitive** | `components/ui/logo/*` + `BrandProvider`/`useBrand()`; `monochrome` via `mask-image` + `currentColor` (Q2, no inline SVG); enforce `clearSpace`/`aspectRatio` (Q6); tests + a11y, `logo.visor.yaml`, `registry/registry-ui.ts` entry, new `branding` category. | 3 |
| **Deprecate `NavbarBrand` → `<Logo>`** | Mark `NavbarBrand` deprecated in `navbar.visor.yaml`; update navbar docs/example to use `<Logo>`; update the `avatar.visor.yaml` pointer (Q7). Copy-and-own consumers unaffected until they re-add. | 2 |
| **Docs + manifest + publish** | `<Logo>` docs page, manifest regen, coordinated `@loworbitstudio/visor` release (publish-smoke gate). | 2 |
| **Private themes + Blacklight** | `visor-themes-private/themes/{slug}/brand/` convention; onboard Blacklight brand as the first real consumer; per-mode marks. | 3 |

**Total:** ~30 points across 3 phases. Phase 1 (~8, filed as VI-469/470/471) delivers the operator-prioritized cohesion test end-to-end with no infrastructure.

---

## 7. Decisions made (summary)

1. Brand assets are modeled on the fonts subsystem — declaration, CDN resolution, CSS-var emission, coverage validator.
2. Declared via a new top-level `brand` block in `.visor.yaml` (§5.1).
3. CDN-hosted at `brands.visor.design` (D2); npm `visor-core` stays CSS-only.
4. Three-layer consumption: `--brand-*` vars → `useBrand()` → `<Logo>` (D4).
5. Per-mode swap is CSS-driven by default, `mode` prop override; vars emit into a dedicated `visor-brand` cascade layer, mode-scoped (Q1).
6. Standard slots `logo|brandmark|wordmark|favicon|monochrome` + `custom`.
7. SVG-first; `monochrome` tinted via CSS `mask-image` + `currentColor` (no inline SVG, Q2); raster fallback only when needed.
8. Stock themes default to the Visor brand, tunable per theme (D3), with a lint/`doctor` warning + dev-only badge guardrail (Q3).
9. Phase 1 = Explorer cohesion with local assets (D1), filed as VI-469/470/471; CDN and component follow.
10. Favicon set generated in build from a single source (Q4); CDN URLs are content-hashed for cache-busting (Q5).
11. `clearSpace` + `aspectRatio` are tokenized per variant and enforced by `<Logo>` (Q6); `<Logo>` supersedes/deprecates `NavbarBrand` (Q7).

## 8. Resolved decisions (operator)

All seven questions from the original spike were resolved with the operator (VI-468). Decisions are locked and reflected throughout §§4–7.

| # | Question | Decision |
|---|----------|----------|
| Q1 | CSS cascade layer + var naming | **Dedicated `visor-brand` layer** (after `visor-semantic`); mode-scoped `--brand-{variant}` + explicit `-light`/`-dark`. |
| Q2 | Monochrome tinting / SVG sanitization | **CSS `mask-image` + `currentColor`** — no inline SVG, no sanitizer (the repo ships none). |
| Q3 | Stock-brand licensing guardrail | **Lint/`doctor` warning + dev-only badge** on `<Logo>` — warn, don't block. |
| Q4 | Favicon multi-size generation | **Generate the full set in build** (`.ico` 16/32/48, apple-touch 180, 192/512) from a single source. |
| Q5 | Cache-busting | **Content-hash segment in the synced asset path** → immutable URLs. |
| Q6 | Clear-space / aspect ratio | **Tokenize** per-variant `clearSpace` + `aspectRatio`, enforced by `<Logo>`. |
| Q7 | `NavbarBrand` reconciliation | **`<Logo>` supersedes `NavbarBrand`** — deprecate it; copy-and-own consumers unaffected until they re-add. |

Net effect: Q4, Q6, and Q7 expand scope beyond the leaner spike defaults toward a more opinionated, turnkey brand system (auto-generated favicons, enforced safe-zones, one canonical brand component). Reflected in the §6 ticket breakdown.

## 9. Question coverage map

Verification requires all eight ticket questions be addressed. Mapping:

| # | Ticket question | Answered in |
|---|---|---|
| 1 | Where do brand assets live? | §4.A, §5.1 |
| 2 | How are they consumed? | §4.B, §5.2 |
| 3 | Per-mode variants | §4.C, §5.2 |
| 4 | Variant types | §4.B, §5.1 |
| 5 | File format strategy | §4.D |
| 6 | Stock themes | §4.E (D3), §6, §8 (Q3) |
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
