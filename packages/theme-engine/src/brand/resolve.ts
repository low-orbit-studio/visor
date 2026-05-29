/**
 * Brand-asset resolver — maps a `brand` block's slots to loadable asset URLs.
 *
 * Mirrors `fonts/resolve.ts`:
 *   - `VISOR_BRANDS_CDN` is the default CDN base (parallels `VISOR_FONTS_CDN`).
 *   - `buildVisorBrandUrl()` constructs a CDN URL for a variant (Phase 2+).
 *   - `source: local` resolves to a path under the consuming app's `public/`.
 *   - `DEFAULT_VISOR_BRAND` is the Visor default brand stock themes fall back to.
 */

import type {
  BrandResolution,
  BrandSlot,
  BrandSource,
  VisorBrand,
} from "./types.js";

/** Default CDN base for brand assets (Phase 2+; unused while source is `local`). */
export const VISOR_BRANDS_CDN = "https://brands.visor.design";

/** First-preferred format when a slot omits `formats`. */
const DEFAULT_FORMAT = "svg";

/** Default source when a brand block / slot omits `source`. */
const DEFAULT_BRAND_SOURCE: BrandSource = "visor-brands";

/**
 * Local public/ path prefix for the Visor default brand. VI-469 produces the
 * SVGs at this canonical location (`packages/docs/public/themes/visor/brand/`),
 * served from the docs app's `public/` root as `/themes/visor/brand/...`.
 */
export const VISOR_DEFAULT_BRAND_PATH = "/themes/visor/brand";

/**
 * The Visor default brand. Stock themes that omit a `brand` block resolve to
 * this — they are not logo-less (D3). Declared as `source: local` so Phase 1
 * resolves it to the bundled SVGs at `/themes/visor/brand/` (no CDN).
 *
 * Aspect ratios and clear-space are pinned per variant (Q6). These are the
 * canonical Visor mark dimensions; per-theme `brand` blocks override any slot.
 */
export const DEFAULT_VISOR_BRAND: VisorBrand = {
  org: "low-orbit-studio",
  source: "local",
  logo: {
    slug: "visor",
    formats: ["svg"],
    light: `${VISOR_DEFAULT_BRAND_PATH}/logo.svg`,
    dark: `${VISOR_DEFAULT_BRAND_PATH}/logo-dark.svg`,
    aspectRatio: "3 / 1",
    clearSpace: "0.5rem",
  },
  brandmark: {
    slug: "visor",
    formats: ["svg"],
    light: `${VISOR_DEFAULT_BRAND_PATH}/brandmark.svg`,
    dark: `${VISOR_DEFAULT_BRAND_PATH}/brandmark-dark.svg`,
    aspectRatio: "1 / 1",
    clearSpace: "0.25rem",
  },
  wordmark: {
    slug: "visor",
    formats: ["svg"],
    light: `${VISOR_DEFAULT_BRAND_PATH}/wordmark.svg`,
    dark: `${VISOR_DEFAULT_BRAND_PATH}/wordmark-dark.svg`,
    aspectRatio: "4 / 1",
    clearSpace: "0.5rem",
  },
  monochrome: {
    slug: "visor",
    formats: ["svg"],
    light: `${VISOR_DEFAULT_BRAND_PATH}/monochrome.svg`,
    dark: `${VISOR_DEFAULT_BRAND_PATH}/monochrome.svg`,
    aspectRatio: "1 / 1",
    clearSpace: "0.25rem",
  },
  favicon: {
    slug: "visor",
    formats: ["svg", "png"],
    light: `${VISOR_DEFAULT_BRAND_PATH}/favicon.svg`,
    dark: `${VISOR_DEFAULT_BRAND_PATH}/favicon.svg`,
    aspectRatio: "1 / 1",
  },
};

/**
 * Build a visor-brands CDN URL for a brand variant (Phase 2+).
 *
 * Default pattern: `https://brands.visor.design/{org}/{slug}/{variant}[-dark].{format}`.
 * When `cdnBase` is provided, that base replaces `VISOR_BRANDS_CDN`. When `org`
 * is empty (the CDN base already encodes the namespace), the org segment is
 * dropped: `{cdnBase}/{slug}/{variant}[-dark].{format}`.
 *
 * Mirrors `buildVisorFontUrl`. Content-hashing (Q5) is a Phase 2 concern and is
 * intentionally omitted here.
 */
export function buildVisorBrandUrl(
  org: string,
  slug: string,
  variant: string,
  mode: "light" | "dark",
  format: string,
  cdnBase?: string | null,
): string {
  const base = cdnBase ?? VISOR_BRANDS_CDN;
  const orgSegment = org ? `/${org}` : "";
  const modeSuffix = mode === "dark" ? "-dark" : "";
  return `${base}${orgSegment}/${slug}/${variant}${modeSuffix}.${format}`;
}

/**
 * Resolve a local asset path for a brand variant.
 *
 * If the slot supplies an explicit `light`/`dark` value, it is used verbatim
 * (it is already a public/-relative path). Otherwise a conventional path is
 * inferred under `public/themes/{slug}/brand/{variant}[-dark].{format}`.
 */
function buildLocalBrandPath(
  slug: string,
  variant: string,
  mode: "light" | "dark",
  format: string,
  explicit: string | undefined,
): string {
  if (explicit) return explicit;
  const modeSuffix = mode === "dark" ? "-dark" : "";
  return `/themes/${slug}/brand/${variant}${modeSuffix}.${format}`;
}

/**
 * Resolve a single brand slot to a `BrandResolution`.
 *
 * Resolution order (mirrors the fonts resolver):
 *   1. `source: local` → public/ paths (Phase 1).
 *   2. `source: visor-brands` → CDN URLs via `buildVisorBrandUrl` (Phase 2+).
 *
 * `org` / `source` / `cdnBase` fall back to the brand-block-wide defaults when
 * the slot omits them.
 */
export function resolveBrandSlot(
  variant: string,
  slot: BrandSlot,
  options: {
    source: BrandSource;
    org: string | null;
    cdnBase?: string | null;
  },
): BrandResolution {
  const source = options.source;
  const format = slot.formats?.[0] ?? DEFAULT_FORMAT;
  const slug = slot.slug ?? variant;
  const clearSpace = slot.clearSpace ?? null;
  const aspectRatio = slot.aspectRatio ?? null;

  if (source === "local") {
    const light = buildLocalBrandPath(slug, variant, "light", format, slot.light);
    const dark = buildLocalBrandPath(slug, variant, "dark", format, slot.dark);
    const guidance = slot.light || slot.dark
      ? null
      : `Brand variant "${variant}" is a local asset. Place the file(s) at ` +
        `public${light}${light !== dark ? ` and public${dark}` : ""} in your project, ` +
        `or set brand.${variant}.light / .dark to an explicit public/-relative path.`;
    return { variant, source, light, dark, clearSpace, aspectRatio, guidance };
  }

  // source: visor-brands — CDN URLs (Phase 2+). Honor explicit per-mode
  // overrides as full paths/URLs when supplied; otherwise build from the CDN.
  const org = options.org ?? "";
  const light =
    slot.light ?? buildVisorBrandUrl(org, slug, variant, "light", format, options.cdnBase);
  const dark =
    slot.dark ?? buildVisorBrandUrl(org, slug, variant, "dark", format, options.cdnBase);
  return { variant, source, light, dark, clearSpace, aspectRatio, guidance: null };
}

/** Resolve the brand-block-wide source default (slot-level `source` is not supported). */
export function resolveBrandSource(brand: VisorBrand): BrandSource {
  return brand.source ?? DEFAULT_BRAND_SOURCE;
}
