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
  ThemeData,
} from "./types.js";

// ============================================================
// Stage 1: Primitive Generation
// ============================================================

/**
 * Generate all shade scales from a resolved config (light-mode colors).
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

/**
 * Generate dark-mode shade scales, overlaying colors-dark overrides onto the
 * light primitives. Only primary and accent have dark-mode brand overrides in
 * the schema; all other roles inherit from the light scale.
 */
export function generateDarkPrimitives(
  config: ResolvedThemeConfig,
  lightPrimitives: GeneratedPrimitives
): GeneratedPrimitives {
  const colorsDark = config["colors-dark"];
  return {
    ...lightPrimitives,
    primary: colorsDark?.primary
      ? (generateShadeScale(colorsDark.primary, "primary") as GeneratedPrimitives["primary"])
      : lightPrimitives.primary,
    accent: colorsDark?.accent
      ? (generateShadeScale(colorsDark.accent, "accent") as GeneratedPrimitives["accent"])
      : lightPrimitives.accent,
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
  return generateThemeDataFromConfig(config).output;
}

/**
 * Generate theme data including intermediate artifacts from a .visor.yaml string.
 * Returns config, primitives, tokens, and CSS output — used by adapters.
 */
export function generateThemeData(yamlString: string): ThemeData {
  const config = parseConfig(yamlString);
  return generateThemeDataFromConfig(config);
}

/**
 * Generate theme data including intermediate artifacts from a pre-parsed config.
 * Returns config, primitives, tokens, and CSS output — used by adapters.
 */
export function generateThemeDataFromConfig(
  config: VisorThemeConfig
): ThemeData {
  // Validate
  const validation = validateConfig(config);
  if (!validation.valid) {
    throw new Error(
      `Invalid theme config:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  // Resolve defaults
  const resolved = resolveConfig(config);

  // Stage 1: Generate shade scales (light and dark)
  const primitives = generatePrimitives(resolved);
  const darkPrimitives = generateDarkPrimitives(resolved, primitives);

  // Stage 2: Assign semantic tokens using mode-specific shade scales
  let tokens = assignSemanticTokens(primitives, darkPrimitives, resolved);

  // Stage 4: Apply overrides (before CSS generation)
  tokens = applyOverrides(tokens, resolved.overrides);

  // Stage 3: Generate CSS
  const output: ThemeOutput = {
    primitivesCss: generatePrimitivesCss(primitives, resolved),
    semanticCss: generateSemanticCss(tokens),
    lightCss: generateLightCss(tokens),
    darkCss: generateDarkCss(tokens),
    fullBundleCss: generateFullBundleCss(primitives, tokens, resolved),
  };

  return { config: resolved, primitives, tokens, output };
}
