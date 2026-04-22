/**
 * Semantic Token Assignment (Stage 2)
 *
 * Takes generated primitives and resolved config, applies the semantic mapping table,
 * and produces concrete hex values for every semantic token in light and dark modes.
 */

import {
  SEMANTIC_MAP,
  CONFIG_BACKGROUND,
  CONFIG_SURFACE,
  CONFIG_DARK_BACKGROUND,
  CONFIG_DARK_SURFACE,
  isShadeRef,
} from "./semantic-map.js";
import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  SemanticTokens,
  SemanticTokenValue,
  ShadeStep,
  ColorRole,
} from "./types.js";
import type { TokenRef, SemanticMapping } from "./semantic-map.js";

// ============================================================
// Resolution Helpers
// ============================================================

/** Look up a hex value from the generated primitives. */
function lookupShade(
  primitives: GeneratedPrimitives,
  role: ColorRole,
  shade: ShadeStep
): string {
  const scale = primitives[role];
  const value = (scale as Record<number, string>)[shade];
  if (!value) {
    throw new Error(
      `Missing shade ${shade} for role '${role}'. Status colors only have shades 50, 100, 500, 600, 700, 900.`
    );
  }
  return value;
}

/** Resolve a TokenRef to a concrete hex value. */
function resolveRef(
  ref: TokenRef,
  primitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): string {
  if (isShadeRef(ref)) {
    return lookupShade(primitives, ref.role, ref.shade);
  }

  // Constant refs: either literal hex or config-derived sentinels
  switch (ref.constant) {
    case CONFIG_BACKGROUND:
      return config.colors.background;
    case CONFIG_SURFACE:
      return config.colors.surface;
    case CONFIG_DARK_BACKGROUND:
      return (
        config["colors-dark"]?.background ??
        lookupShade(primitives, "neutral", 950)
      );
    case CONFIG_DARK_SURFACE:
      return (
        config["colors-dark"]?.surface ??
        lookupShade(primitives, "neutral", 900)
      );
    default:
      // Literal hex value (e.g., "#ffffff")
      return ref.constant;
  }
}

/** Resolve a single mapping entry to a SemanticTokenValue. */
function resolveMapping(
  mapping: SemanticMapping,
  lightPrimitives: GeneratedPrimitives,
  darkPrimitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): SemanticTokenValue {
  return {
    light: resolveRef(mapping.light, lightPrimitives, config),
    dark: resolveRef(mapping.dark, darkPrimitives, config),
  };
}

// ============================================================
// Main Assignment
// ============================================================

/**
 * Assign semantic tokens from mode-specific shade scales and resolved config.
 * lightPrimitives drives light-mode token values; darkPrimitives drives dark-mode
 * values — allowing themes with colors-dark overrides to produce correct dark
 * semantic tokens (e.g. surface-accent-default uses the dark brand color).
 */
export function assignSemanticTokens(
  lightPrimitives: GeneratedPrimitives,
  darkPrimitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): SemanticTokens {
  const text: Record<string, SemanticTokenValue> = {};
  const surface: Record<string, SemanticTokenValue> = {};
  const border: Record<string, SemanticTokenValue> = {};
  const interactive: Record<string, SemanticTokenValue> = {};

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.text)) {
    text[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.surface)) {
    surface[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.border)) {
    border[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  for (const [name, mapping] of Object.entries(SEMANTIC_MAP.interactive)) {
    interactive[name] = resolveMapping(mapping, lightPrimitives, darkPrimitives, config);
  }

  return { text, surface, border, interactive };
}
