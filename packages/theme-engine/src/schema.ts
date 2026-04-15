/**
 * JSON Schema & Validation
 *
 * Exports the .visor.yaml JSON Schema and a lightweight validation function.
 * No external validation library — keeps the bundle small for browser use.
 */

import visorThemeSchema from "./visor-theme.schema.json";
import { isValidHex, isValidColor } from "./color.js";
import type { VisorThemeConfig } from "./types.js";

export { visorThemeSchema };

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================
// Known Keys — mirrors the JSON Schema structure
// ============================================================

const KNOWN_TOP_LEVEL_KEYS = new Set([
  "name", "version", "group", "colors", "colors-dark", "typography",
  "spacing", "radius", "shadows", "motion", "overrides",
]);

const KNOWN_COLOR_KEYS = new Set([
  "primary", "accent", "neutral", "background", "surface",
  "success", "warning", "error", "info",
]);

const KNOWN_TYPOGRAPHY_KEYS = new Set([
  "heading", "display", "body", "mono", "letter-spacing", "scale",
]);

const KNOWN_TYPOGRAPHY_FONT_KEYS = new Set(["family", "weight", "weights", "source", "org"]);
const KNOWN_TYPOGRAPHY_MONO_KEYS = new Set(["family"]);
const KNOWN_LETTER_SPACING_KEYS = new Set(["tight", "normal", "wide"]);

const KNOWN_SPACING_KEYS = new Set(["base"]);
const KNOWN_RADIUS_KEYS = new Set(["sm", "md", "lg", "xl", "pill"]);
const KNOWN_SHADOW_KEYS = new Set(["xs", "sm", "md", "lg", "xl"]);
const KNOWN_MOTION_KEYS = new Set(["duration-fast", "duration-normal", "duration-slow", "easing"]);
const KNOWN_OVERRIDES_KEYS = new Set(["light", "dark"]);

/**
 * Check for unknown keys at every nesting level.
 * Catches typos like `colour` instead of `colors`.
 */
function checkUnknownKeys(obj: Record<string, unknown>, errors: string[]): void {
  // Top-level
  for (const key of Object.keys(obj)) {
    if (!KNOWN_TOP_LEVEL_KEYS.has(key)) {
      errors.push(`Unknown top-level key '${key}'. Valid keys: ${[...KNOWN_TOP_LEVEL_KEYS].join(", ")}`);
    }
  }

  // colors
  if (typeof obj.colors === "object" && obj.colors !== null) {
    for (const key of Object.keys(obj.colors as Record<string, unknown>)) {
      if (!KNOWN_COLOR_KEYS.has(key)) {
        errors.push(`Unknown key 'colors.${key}'. Valid keys: ${[...KNOWN_COLOR_KEYS].join(", ")}`);
      }
    }
  }

  // colors-dark
  if (typeof obj["colors-dark"] === "object" && obj["colors-dark"] !== null) {
    for (const key of Object.keys(obj["colors-dark"] as Record<string, unknown>)) {
      if (!KNOWN_COLOR_KEYS.has(key)) {
        errors.push(`Unknown key 'colors-dark.${key}'. Valid keys: ${[...KNOWN_COLOR_KEYS].join(", ")}`);
      }
    }
  }

  // typography
  if (typeof obj.typography === "object" && obj.typography !== null) {
    const typo = obj.typography as Record<string, unknown>;
    for (const key of Object.keys(typo)) {
      if (!KNOWN_TYPOGRAPHY_KEYS.has(key)) {
        errors.push(`Unknown key 'typography.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_KEYS].join(", ")}`);
      }
    }
    // typography.heading
    if (typeof typo.heading === "object" && typo.heading !== null) {
      for (const key of Object.keys(typo.heading as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_FONT_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.heading.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_FONT_KEYS].join(", ")}`);
        }
      }
    }
    // typography.display
    if (typeof typo.display === "object" && typo.display !== null) {
      for (const key of Object.keys(typo.display as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_FONT_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.display.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_FONT_KEYS].join(", ")}`);
        }
      }
    }
    // typography.body
    if (typeof typo.body === "object" && typo.body !== null) {
      for (const key of Object.keys(typo.body as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_FONT_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.body.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_FONT_KEYS].join(", ")}`);
        }
      }
    }
    // typography.mono
    if (typeof typo.mono === "object" && typo.mono !== null) {
      for (const key of Object.keys(typo.mono as Record<string, unknown>)) {
        if (!KNOWN_TYPOGRAPHY_MONO_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.mono.${key}'. Valid keys: ${[...KNOWN_TYPOGRAPHY_MONO_KEYS].join(", ")}`);
        }
      }
    }
    // typography.letter-spacing
    if (typeof typo["letter-spacing"] === "object" && typo["letter-spacing"] !== null) {
      for (const key of Object.keys(typo["letter-spacing"] as Record<string, unknown>)) {
        if (!KNOWN_LETTER_SPACING_KEYS.has(key)) {
          errors.push(`Unknown key 'typography.letter-spacing.${key}'. Valid keys: ${[...KNOWN_LETTER_SPACING_KEYS].join(", ")}`);
        }
      }
    }
  }

  // spacing
  if (typeof obj.spacing === "object" && obj.spacing !== null) {
    for (const key of Object.keys(obj.spacing as Record<string, unknown>)) {
      if (!KNOWN_SPACING_KEYS.has(key)) {
        errors.push(`Unknown key 'spacing.${key}'. Valid keys: ${[...KNOWN_SPACING_KEYS].join(", ")}`);
      }
    }
  }

  // radius
  if (typeof obj.radius === "object" && obj.radius !== null) {
    for (const key of Object.keys(obj.radius as Record<string, unknown>)) {
      if (!KNOWN_RADIUS_KEYS.has(key)) {
        errors.push(`Unknown key 'radius.${key}'. Valid keys: ${[...KNOWN_RADIUS_KEYS].join(", ")}`);
      }
    }
  }

  // shadows
  if (typeof obj.shadows === "object" && obj.shadows !== null) {
    for (const key of Object.keys(obj.shadows as Record<string, unknown>)) {
      if (!KNOWN_SHADOW_KEYS.has(key)) {
        errors.push(`Unknown key 'shadows.${key}'. Valid keys: ${[...KNOWN_SHADOW_KEYS].join(", ")}`);
      }
    }
  }

  // motion
  if (typeof obj.motion === "object" && obj.motion !== null) {
    for (const key of Object.keys(obj.motion as Record<string, unknown>)) {
      if (!KNOWN_MOTION_KEYS.has(key)) {
        errors.push(`Unknown key 'motion.${key}'. Valid keys: ${[...KNOWN_MOTION_KEYS].join(", ")}`);
      }
    }
  }

  // overrides
  if (typeof obj.overrides === "object" && obj.overrides !== null) {
    for (const key of Object.keys(obj.overrides as Record<string, unknown>)) {
      if (!KNOWN_OVERRIDES_KEYS.has(key)) {
        errors.push(`Unknown key 'overrides.${key}'. Valid keys: ${[...KNOWN_OVERRIDES_KEYS].join(", ")}`);
      }
    }
  }
}

/**
 * Lightweight structural validation for a .visor.yaml config object.
 * Checks required fields, types, and hex color format.
 * For full JSON Schema validation, use the exported schema with ajv or similar.
 */
export function validateConfig(config: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof config !== "object" || config === null) {
    return { valid: false, errors: ["Config must be an object"] };
  }

  const obj = config as Record<string, unknown>;

  // Unknown key rejection (catches typos like `colour` instead of `colors`)
  checkUnknownKeys(obj, errors);

  // Required fields
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    errors.push("'name' is required and must be a non-empty string");
  }

  if (obj.version !== 1) {
    errors.push("'version' must be 1");
  }

  // Colors
  if (typeof obj.colors !== "object" || obj.colors === null) {
    errors.push("'colors' is required and must be an object");
    return { valid: false, errors };
  }

  const colors = obj.colors as Record<string, unknown>;

  if (typeof colors.primary !== "string" || !isValidColor(colors.primary)) {
    errors.push("'colors.primary' is required and must be a valid CSS color (hex, rgba, hsla, or oklch)");
  }

  // Validate optional color fields
  const optionalColorFields = [
    "accent",
    "neutral",
    "background",
    "surface",
    "success",
    "warning",
    "error",
    "info",
  ];

  for (const field of optionalColorFields) {
    if (colors[field] !== undefined) {
      if (typeof colors[field] !== "string" || !isValidColor(colors[field] as string)) {
        errors.push(`'colors.${field}' must be a valid CSS color (hex, rgba, hsla, or oklch)`);
      }
    }
  }

  // Validate colors-dark if present
  if (obj["colors-dark"] !== undefined) {
    if (typeof obj["colors-dark"] !== "object" || obj["colors-dark"] === null) {
      errors.push("'colors-dark' must be an object");
    } else {
      const darkColors = obj["colors-dark"] as Record<string, unknown>;
      const allColorFields = ["primary", ...optionalColorFields];
      for (const field of allColorFields) {
        if (darkColors[field] !== undefined) {
          if (
            typeof darkColors[field] !== "string" ||
            !isValidColor(darkColors[field] as string)
          ) {
            errors.push(`'colors-dark.${field}' must be a valid CSS color (hex, rgba, hsla, or oklch)`);
          }
        }
      }
    }
  }

  // Validate motion duration patterns
  if (obj.motion && typeof obj.motion === "object") {
    const motion = obj.motion as Record<string, unknown>;
    for (const key of ["duration-fast", "duration-normal", "duration-slow"]) {
      if (motion[key] !== undefined) {
        if (
          typeof motion[key] !== "string" ||
          !/^\d+ms$/.test(motion[key] as string)
        ) {
          errors.push(`'motion.${key}' must match pattern "Nms" (e.g., "200ms")`);
        }
      }
    }
  }

  // Validate typography font source/org cross-field constraints
  if (typeof obj.typography === "object" && obj.typography !== null) {
    const typo = obj.typography as Record<string, unknown>;
    for (const slot of ["heading", "display", "body"]) {
      const font = typo[slot] as Record<string, unknown> | undefined;
      if (font && font.source === "visor-fonts" && !font.org) {
        errors.push(`'typography.${slot}.org' is required when source is 'visor-fonts'`);
      }
      if (font && font.weights !== undefined) {
        if (
          !Array.isArray(font.weights) ||
          !(font.weights as unknown[]).every((w) => typeof w === "number" && w > 0)
        ) {
          errors.push(`'typography.${slot}.weights' must be an array of positive numbers (e.g., [300, 500])`);
        }
      }
    }
  }

  // Validate overrides
  if (obj.overrides !== undefined) {
    if (typeof obj.overrides !== "object" || obj.overrides === null) {
      errors.push("'overrides' must be an object");
    } else {
      const overrides = obj.overrides as Record<string, unknown>;
      for (const mode of ["light", "dark"]) {
        if (overrides[mode] !== undefined) {
          if (typeof overrides[mode] !== "object" || overrides[mode] === null) {
            errors.push(`'overrides.${mode}' must be an object`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Type guard that validates and narrows an unknown config to VisorThemeConfig.
 */
export function isVisorThemeConfig(
  config: unknown
): config is VisorThemeConfig {
  return validateConfig(config).valid;
}
