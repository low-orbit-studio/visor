/**
 * Font resolution infrastructure for the Visor theme engine.
 */

export { resolveFont, buildVisorFontUrl, VISOR_FONTS_CDN } from "./resolve.js";
export { FONT_WEIGHT_ALIASES, lookupFontWeightAlias } from "./font-aliases.js";
export { generatePreloadLinks, generateStylesheetLinks } from "./preload.js";
export { resolveThemeFonts } from "./pipeline.js";
export { lookupGoogleFont, googleFontsCatalog } from "./google-fonts-catalog.js";
export {
  validateFontCoverage,
  formatFontCoverageError,
} from "./validate-coverage.js";
export type { FontCoverageError, FontCoverageResult } from "./validate-coverage.js";

export type {
  FontSource,
  FontDisplayStrategy,
  FontResolution,
  FontResolveOptions,
  VisorTypography,
  ThemeFontResult,
  GoogleFontEntry,
} from "./types.js";
