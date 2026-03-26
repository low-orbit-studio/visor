/**
 * Font resolution infrastructure for the Visor theme engine.
 */

export { resolveFont } from "./resolve.js";
export { generatePreloadLinks, generateStylesheetLinks } from "./preload.js";
export { resolveThemeFonts } from "./pipeline.js";
export { lookupGoogleFont, googleFontsCatalog } from "./google-fonts-catalog.js";

export type {
  FontSource,
  FontDisplayStrategy,
  FontResolution,
  FontResolveOptions,
  VisorTypography,
  ThemeFontResult,
  GoogleFontEntry,
} from "./types.js";
