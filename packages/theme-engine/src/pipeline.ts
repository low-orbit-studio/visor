/**
 * Import Pipeline
 *
 * Main public API that orchestrates all 4 stages:
 *   1. Shade Generation (Primitives)
 *   2. Semantic Assignment
 *   3. Adaptive Assembly (CSS)
 *   4. Override Application
 */

import { parse as parseYaml } from "yaml";
import { validateConfig } from "./schema.js";
import { resolveConfig } from "./resolve.js";
import { generateShadeScale, TAILWIND_GRAY } from "./shades.js";
import { assignSemanticTokens } from "./assign.js";
import { applyOverrides } from "./overrides.js";
import {
  generatePrimitivesCss,
  generateLightCss,
  generateDarkCss,
  generateFullBundleCss,
  generateSemanticCss,
} from "./generate-css.js";
import type {
  VisorThemeConfig,
  ResolvedThemeConfig,
  GeneratedPrimitives,
  ThemeOutput,
} from "./types.js";

// ============================================================
// Stage 1: Primitive Generation
// ============================================================

/**
 * Generate all shade scales from a resolved config.
 * If neutral is null, uses Tailwind Gray verbatim.
 */
export function generatePrimitives(
  config: ResolvedThemeConfig
): GeneratedPrimitives {
  return {
    primary: generateShadeScale(config.colors.primary, "primary") as GeneratedPrimitives["primary"],
    accent: generateShadeScale(config.colors.accent, "accent") as GeneratedPrimitives["accent"],
    neutral:
      config.colors.neutral === null
        ? TAILWIND_GRAY
        : (generateShadeScale(config.colors.neutral, "neutral") as GeneratedPrimitives["neutral"]),
    success: generateShadeScale(config.colors.success, "success") as GeneratedPrimitives["success"],
    warning: generateShadeScale(config.colors.warning, "warning") as GeneratedPrimitives["warning"],
    error: generateShadeScale(config.colors.error, "error") as GeneratedPrimitives["error"],
    info: generateShadeScale(config.colors.info, "info") as GeneratedPrimitives["info"],
  };
}

// ============================================================
// YAML Parsing
// ============================================================

/**
 * Parse a YAML string into a VisorThemeConfig.
 * Validates the structure before returning.
 */
export function parseConfig(yamlString: string): VisorThemeConfig {
  const parsed = parseYaml(yamlString);
  const result = validateConfig(parsed);

  if (!result.valid) {
    throw new Error(
      `Invalid .visor.yaml:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  return parsed as VisorThemeConfig;
}

// ============================================================
// Full Pipeline
// ============================================================

/**
 * Generate a complete theme from a .visor.yaml string.
 * Parses YAML, validates, and runs all 4 pipeline stages.
 */
export function generateTheme(yamlString: string): ThemeOutput {
  const config = parseConfig(yamlString);
  return generateThemeFromConfig(config);
}

/**
 * Generate a complete theme from a pre-parsed config object.
 * Skips YAML parsing — for browser consumers or programmatic use.
 */
export function generateThemeFromConfig(
  config: VisorThemeConfig
): ThemeOutput {
  // Validate
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(
      `Invalid theme config:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  // Resolve defaults
  const resolved = resolveConfig(config);

  // Stage 1: Generate shade scales
  const primitives = generatePrimitives(resolved);

  // Stage 2: Assign semantic tokens
  let tokens = assignSemanticTokens(primitives, resolved);

  // Stage 4: Apply overrides (before CSS generation)
  tokens = applyOverrides(tokens, resolved.overrides);

  // Stage 3: Generate CSS
  return {
    primitivesCss: generatePrimitivesCss(primitives, resolved),
    semanticCss: generateSemanticCss(tokens),
    lightCss: generateLightCss(tokens),
    darkCss: generateDarkCss(tokens),
    fullBundleCss: generateFullBundleCss(primitives, tokens, resolved),
  };
}
