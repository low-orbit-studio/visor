/**
 * Brand-asset resolution infrastructure for the Visor theme engine.
 *
 * Mirrors `fonts/index.ts`. Phase 1 (VI-470): `source: local` resolution +
 * mode-scoped `--brand-*` emission into a `visor-brand` cascade layer.
 */

export {
  resolveBrandSlot,
  resolveBrandSource,
  buildVisorBrandUrl,
  VISOR_BRANDS_CDN,
  VISOR_DEFAULT_BRAND_PATH,
  DEFAULT_VISOR_BRAND,
} from "./resolve.js";
export { resolveThemeBrand } from "./pipeline.js";

export { BRAND_VARIANTS } from "./types.js";
export type {
  BrandSource,
  BrandVariant,
  BrandSlot,
  VisorBrand,
  BrandResolution,
  ThemeBrandResult,
} from "./types.js";
