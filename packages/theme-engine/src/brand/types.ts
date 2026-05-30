/**
 * Brand-asset resolution types for the Visor theme engine.
 *
 * Models the fonts subsystem (`packages/theme-engine/src/fonts/`): a per-theme
 * `brand` block declares logo/brandmark/wordmark/etc. slots, the resolver maps
 * each to loadable asset URLs (Phase 1: local public/ paths; Phase 2+: CDN),
 * and the pipeline emits `--brand-{variant}` CSS custom properties into a
 * dedicated `visor-brand` cascade layer.
 *
 * Phase 1 (VI-470) supports `source: local` only — no CDN. The `visor-brands`
 * source value is reserved in the type union so the schema stays
 * forward-compatible (parallels the fonts `visor-fonts` source).
 */

/** Where a brand asset is loaded from. Phase 1 resolves only `local`. */
export type BrandSource = "visor-brands" | "local";

/**
 * Standard brand variant slots. A fixed set covers the common lockups; custom
 * operator-defined slots are addressed by key through the `custom` map.
 */
export type BrandVariant =
  | "logo"
  | "brandmark"
  | "wordmark"
  | "monochrome"
  | "favicon"
  | "animated";

/** Ordered list of the standard brand variant slots. */
export const BRAND_VARIANTS: readonly BrandVariant[] = [
  "logo",
  "brandmark",
  "wordmark",
  "monochrome",
  "favicon",
  "animated",
];

/**
 * A single brand-slot declaration in `.visor.yaml`. Each slot may declare a
 * `slug` (CDN namespace, Phase 2+), an explicit per-mode `light`/`dark`
 * filename or path, plus the tokenized `clearSpace` (safe-zone) and
 * `aspectRatio` enforced by `<Logo>` (Q6).
 */
export interface BrandSlot {
  /** CDN/asset-set slug. Required when `source: visor-brands` (Phase 2+). */
  slug?: string;
  /** Preferred asset formats, first wins (e.g. `["svg"]`, `["svg", "png"]`). */
  formats?: string[];
  /** Explicit light-mode asset filename or path (overrides the inferred name). */
  light?: string;
  /** Explicit dark-mode asset filename or path (overrides the inferred name). */
  dark?: string;
  /** Tokenized safe-zone padding enforced by `<Logo>` (Q6), e.g. "0.5rem". */
  clearSpace?: string;
  /** Tokenized locked aspect ratio (Q6), e.g. "3 / 1"; else derived from viewBox. */
  aspectRatio?: string;
}

/**
 * The `brand` block from a `.visor.yaml` file. Structured like `typography`:
 * shared `org`/`source`/`cdn-overrides` defaults plus the standard slots and
 * an optional `custom` map.
 */
export interface VisorBrand {
  /** CDN namespace; required when `source: visor-brands` unless cdn-overrides is set. */
  org?: string;
  /** Where assets resolve from. Phase 1 supports `local` only. Default: `visor-brands`. */
  source?: BrandSource;
  /** Per-source CDN base URL overrides (Phase 2+). Only `visor-brands` is supported. */
  "cdn-overrides"?: {
    "visor-brands"?: string;
  };
  /** Full lockup. */
  logo?: BrandSlot;
  /** Symbol only. */
  brandmark?: BrandSlot;
  /** Type only. */
  wordmark?: BrandSlot;
  /** Single-color mark (tinted via CSS mask-image + currentColor). */
  monochrome?: BrandSlot;
  /** Favicon source. */
  favicon?: BrandSlot;
  /**
   * Animated lockup. Optional and SVG-only (D2/D3): the asset must be a
   * self-contained animated SVG (inlined `<style>`/@keyframes or SMIL) so it
   * animates inside `<img>`. Stock themes omit this — absent → no
   * `--brand-animated` emitted. Reduced-motion consumers fall back to `logo`.
   */
  animated?: BrandSlot;
  /** Operator-defined slots, addressed by key. */
  custom?: Record<string, BrandSlot>;
}

/** A single resolved brand variant — light + dark asset URLs plus its tokens. */
export interface BrandResolution {
  /** The variant slot this resolution covers ("logo", "brandmark", or a custom key). */
  variant: string;
  /** Where this asset comes from. */
  source: BrandSource;
  /** Resolved light-mode asset URL/path. */
  light: string;
  /** Resolved dark-mode asset URL/path. */
  dark: string;
  /** Tokenized safe-zone padding (null when not declared). */
  clearSpace: string | null;
  /** Tokenized locked aspect ratio (null when not declared). */
  aspectRatio: string | null;
  /** Human-readable guidance for assets needing manual setup (e.g. local files). */
  guidance: string | null;
}

/** Result of resolving all brand assets for a theme. */
export interface ThemeBrandResult {
  /** Resolved standard-slot variants in declaration order. */
  variants: BrandResolution[];
  /** Resolved custom-slot variants in declaration order. */
  custom: BrandResolution[];
  /** Mode-scoped `--brand-*` CSS custom property declarations (no @layer wrapper). */
  css: string;
  /** Warnings for assets needing manual setup. */
  warnings: string[];
}
