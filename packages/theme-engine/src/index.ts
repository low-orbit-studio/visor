/**
 * @loworbitstudio/visor-theme-engine
 *
 * Theme engine for the Visor design system.
 * Converts .visor.yaml files into complete CSS custom properties.
 */

// Font resolution (from VI-51)
export * from "./fonts/index.js";

// Primary pipeline
export {
  generateTheme,
  generateThemeFromConfig,
  parseConfig,
  generatePrimitives,
} from "./pipeline.js";

// Export pipeline
export { exportTheme } from "./export.js";

// Schema & validation
export { visorThemeSchema, validateConfig, isVisorThemeConfig } from "./schema.js";

// Lower-level utilities (for docs site preview, advanced consumers)
export { generateShadeScale, TAILWIND_GRAY } from "./shades.js";
export {
  hexToOklch,
  oklchToHex,
  hexToRgb,
  rgbToHex,
  clampToSrgb,
  isValidHex,
  normalizeHex,
  getContrastRatio,
} from "./color.js";
export { resolveConfig } from "./resolve.js";
export { assignSemanticTokens } from "./assign.js";
export { applyOverrides } from "./overrides.js";
export { SEMANTIC_MAP } from "./semantic-map.js";
export {
  generatePrimitivesCss,
  generateSemanticCss,
  generateLightCss,
  generateDarkCss,
  generateFullBundleCss,
} from "./generate-css.js";

// Types
export type {
  VisorThemeConfig,
  ResolvedThemeConfig,
  ThemeOutput,
  GeneratedPrimitives,
  SemanticTokens,
  SemanticTokenValue,
  ShadeStep,
  ColorRole,
  FullShadeScale,
  SelectiveShadeScale,
  RGB,
  OKLCH,
} from "./types.js";
