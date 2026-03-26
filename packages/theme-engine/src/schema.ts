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
