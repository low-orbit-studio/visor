/**
 * Theme Validator
 *
 * Comprehensive validation for .visor.yaml theme configs.
 * Returns structured, JSON-serializable results with errors (blocking)
 * and warnings (non-blocking).
 *
 * Consumed by CLI (`npx visor theme validate`) and the docs site
 * (live validation in the future theme creator).
 */

import { validateConfig as validateSchema } from "./schema.js";
import { resolveConfig } from "./resolve.js";
import { hexToOklch, getContrastRatio, isValidHex } from "./color.js";
import type { VisorThemeConfig } from "./types.js";

// ============================================================
// Types
// ============================================================

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface ThemeValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// ============================================================
// Constants
// ============================================================

/** WCAG AA contrast ratios */
const CONTRAST_TEXT_AA = 4.5;
const CONTRAST_INTERACTIVE_AA = 3.0;

/** DeltaE threshold below which primary/accent are "too similar" */
const DELTA_E_SIMILAR_THRESHOLD = 10;

// ============================================================
// Helpers
// ============================================================

function issue(
  severity: ValidationSeverity,
  code: string,
  message: string,
  path?: string
): ValidationIssue {
  const result: ValidationIssue = { severity, code, message };
  if (path !== undefined) {
    result.path = path;
  }
  return result;
}

/**
 * Approximate deltaE (OKLCH) between two hex colors.
 * Uses Euclidean distance in OKLCH space — sufficient for
 * detecting "too similar" colors.
 */
function deltaEOklch(hex1: string, hex2: string): number {
  const [l1, c1, h1] = hexToOklch(hex1);
  const [l2, c2, h2] = hexToOklch(hex2);

  // Convert polar hue to Cartesian for distance
  const h1Rad = (h1 * Math.PI) / 180;
  const h2Rad = (h2 * Math.PI) / 180;

  const a1 = c1 * Math.cos(h1Rad);
  const b1 = c1 * Math.sin(h1Rad);
  const a2 = c2 * Math.cos(h2Rad);
  const b2 = c2 * Math.sin(h2Rad);

  // Scale L by 100 to match typical deltaE ranges
  const dL = (l1 - l2) * 100;
  const da = (a1 - a2) * 100;
  const db = (b1 - b2) * 100;

  return Math.sqrt(dL * dL + da * da + db * db);
}

// ============================================================
// Error Rules (blocking)
// ============================================================

function checkStructuralIntegrity(
  config: unknown,
  issues: ValidationIssue[]
): boolean {
  const result = validateSchema(config);
  if (!result.valid) {
    for (const msg of result.errors) {
      issues.push(issue("error", "STRUCTURAL", msg));
    }
    return false;
  }
  return true;
}

function checkCompleteness(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  // colors.primary is required — checked by schema validation
  // Check that all color values are valid hex when provided
  const colorEntries = Object.entries(config.colors) as [string, string][];
  for (const [key, value] of colorEntries) {
    if (value !== undefined && !isValidHex(value)) {
      issues.push(
        issue(
          "error",
          "INVALID_COLOR",
          `'colors.${key}' is not a valid CSS hex color: ${value}`,
          `colors.${key}`
        )
      );
    }
  }

  // Validate dark mode colors if present
  const darkColors = config["colors-dark"];
  if (darkColors) {
    const darkEntries = Object.entries(darkColors) as [string, string][];
    for (const [key, value] of darkEntries) {
      if (value !== undefined && !isValidHex(value)) {
        issues.push(
          issue(
            "error",
            "INVALID_COLOR",
            `'colors-dark.${key}' is not a valid CSS hex color: ${value}`,
            `colors-dark.${key}`
          )
        );
      }
    }
  }

  // Validate radius values are non-negative
  if (config.radius) {
    const radiusEntries = Object.entries(config.radius) as [string, number][];
    for (const [key, value] of radiusEntries) {
      if (value !== undefined && (typeof value !== "number" || value < 0)) {
        issues.push(
          issue(
            "error",
            "INVALID_RADIUS",
            `'radius.${key}' must be a non-negative number, got: ${value}`,
            `radius.${key}`
          )
        );
      }
    }
  }

  // Validate shadow strings
  if (config.shadows) {
    const shadowEntries = Object.entries(config.shadows) as [string, string][];
    for (const [key, value] of shadowEntries) {
      if (value !== undefined) {
        if (typeof value !== "string" || value.trim().length === 0) {
          issues.push(
            issue(
              "error",
              "INVALID_SHADOW",
              `'shadows.${key}' must be a non-empty CSS box-shadow string`,
              `shadows.${key}`
            )
          );
        }
      }
    }
  }

  // Validate typography weight values
  if (config.typography) {
    const { heading, body } = config.typography;
    if (heading?.weight !== undefined) {
      if (
        typeof heading.weight !== "number" ||
        heading.weight < 100 ||
        heading.weight > 900
      ) {
        issues.push(
          issue(
            "error",
            "INVALID_WEIGHT",
            `'typography.heading.weight' must be between 100 and 900, got: ${heading.weight}`,
            "typography.heading.weight"
          )
        );
      }
    }
    if (body?.weight !== undefined) {
      if (
        typeof body.weight !== "number" ||
        body.weight < 100 ||
        body.weight > 900
      ) {
        issues.push(
          issue(
            "error",
            "INVALID_WEIGHT",
            `'typography.body.weight' must be between 100 and 900, got: ${body.weight}`,
            "typography.body.weight"
          )
        );
      }
    }

    // Validate font family strings
    if (heading?.family !== undefined) {
      if (typeof heading.family !== "string" || heading.family.trim().length === 0) {
        issues.push(
          issue(
            "error",
            "INVALID_FONT_FAMILY",
            "'typography.heading.family' must be a non-empty string",
            "typography.heading.family"
          )
        );
      }
    }
    if (body?.family !== undefined) {
      if (typeof body.family !== "string" || body.family.trim().length === 0) {
        issues.push(
          issue(
            "error",
            "INVALID_FONT_FAMILY",
            "'typography.body.family' must be a non-empty string",
            "typography.body.family"
          )
        );
      }
    }
    if (config.typography.mono?.family !== undefined) {
      if (
        typeof config.typography.mono.family !== "string" ||
        config.typography.mono.family.trim().length === 0
      ) {
        issues.push(
          issue(
            "error",
            "INVALID_FONT_FAMILY",
            "'typography.mono.family' must be a non-empty string",
            "typography.mono.family"
          )
        );
      }
    }
  }

  // Validate spacing base
  if (config.spacing?.base !== undefined) {
    if (typeof config.spacing.base !== "number" || config.spacing.base < 1) {
      issues.push(
        issue(
          "error",
          "INVALID_SPACING",
          `'spacing.base' must be >= 1, got: ${config.spacing.base}`,
          "spacing.base"
        )
      );
    }
  }
}

function checkTypeScaleCoherence(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  const headingWeight = config.typography?.heading?.weight;
  const bodyWeight = config.typography?.body?.weight;

  // Both must be defined to check coherence
  if (headingWeight !== undefined && bodyWeight !== undefined) {
    if (headingWeight < bodyWeight) {
      issues.push(
        issue(
          "error",
          "TYPE_SCALE_INCOHERENT",
          `Heading weight (${headingWeight}) must be >= body weight (${bodyWeight})`,
          "typography"
        )
      );
    }
  }
}

// ============================================================
// Warning Rules (non-blocking)
// ============================================================

function checkContrastWarnings(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  // Resolve the config so we have defaults for missing values
  const resolved = resolveConfig(config);

  // --- Light mode checks ---
  const lightBg = resolved.colors.background;
  const lightSurface = resolved.colors.surface;
  const primary = resolved.colors.primary;

  // Text on background: we don't have a text color in the config,
  // but we can check that primary (used for interactive elements) has enough contrast.
  // Use neutral-900 proxy (dark text on light bg).
  // The resolved neutral might be null (Tailwind Gray), so use #111827 as fallback.
  const textDark = "#111827"; // neutral-900 equivalent

  // Text contrast on background
  const textOnBg = getContrastRatio(textDark, lightBg);
  if (textOnBg < CONTRAST_TEXT_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Light mode: text-primary on background has contrast ratio ${textOnBg.toFixed(2)}:1 (needs >= ${CONTRAST_TEXT_AA}:1)`,
        "colors.background"
      )
    );
  }

  // Text contrast on surface
  const textOnSurface = getContrastRatio(textDark, lightSurface);
  if (textOnSurface < CONTRAST_TEXT_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Light mode: text-primary on surface has contrast ratio ${textOnSurface.toFixed(2)}:1 (needs >= ${CONTRAST_TEXT_AA}:1)`,
        "colors.surface"
      )
    );
  }

  // Interactive color (primary) on background
  const primaryOnBg = getContrastRatio(primary, lightBg);
  if (primaryOnBg < CONTRAST_INTERACTIVE_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Light mode: primary color on background has contrast ratio ${primaryOnBg.toFixed(2)}:1 (needs >= ${CONTRAST_INTERACTIVE_AA}:1)`,
        "colors.primary"
      )
    );
  }

  // Interactive color (primary) on surface
  const primaryOnSurface = getContrastRatio(primary, lightSurface);
  if (primaryOnSurface < CONTRAST_INTERACTIVE_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Light mode: primary color on surface has contrast ratio ${primaryOnSurface.toFixed(2)}:1 (needs >= ${CONTRAST_INTERACTIVE_AA}:1)`,
        "colors.primary"
      )
    );
  }

  // --- Dark mode checks ---
  const darkBg = resolved["colors-dark"]?.background ?? "#0a0a0a";
  const darkSurface = resolved["colors-dark"]?.surface ?? "#171717";
  const darkPrimary = resolved["colors-dark"]?.primary ?? primary;

  // Light text on dark backgrounds
  const textLight = "#f9fafb"; // neutral-50 equivalent

  const textOnDarkBg = getContrastRatio(textLight, darkBg);
  if (textOnDarkBg < CONTRAST_TEXT_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Dark mode: text-primary on background has contrast ratio ${textOnDarkBg.toFixed(2)}:1 (needs >= ${CONTRAST_TEXT_AA}:1)`,
        "colors-dark.background"
      )
    );
  }

  const textOnDarkSurface = getContrastRatio(textLight, darkSurface);
  if (textOnDarkSurface < CONTRAST_TEXT_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Dark mode: text-primary on surface has contrast ratio ${textOnDarkSurface.toFixed(2)}:1 (needs >= ${CONTRAST_TEXT_AA}:1)`,
        "colors-dark.surface"
      )
    );
  }

  // Interactive color (primary) on dark background
  const darkPrimaryOnBg = getContrastRatio(darkPrimary, darkBg);
  if (darkPrimaryOnBg < CONTRAST_INTERACTIVE_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Dark mode: primary color on background has contrast ratio ${darkPrimaryOnBg.toFixed(2)}:1 (needs >= ${CONTRAST_INTERACTIVE_AA}:1)`,
        "colors-dark.primary"
      )
    );
  }

  // Interactive color on dark surface
  const darkPrimaryOnSurface = getContrastRatio(darkPrimary, darkSurface);
  if (darkPrimaryOnSurface < CONTRAST_INTERACTIVE_AA) {
    issues.push(
      issue(
        "warning",
        "WCAG_CONTRAST",
        `Dark mode: primary color on surface has contrast ratio ${darkPrimaryOnSurface.toFixed(2)}:1 (needs >= ${CONTRAST_INTERACTIVE_AA}:1)`,
        "colors-dark.primary"
      )
    );
  }
}

function checkColorSimilarity(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  const resolved = resolveConfig(config);
  const { primary, accent } = resolved.colors;

  // Skip if accent was defaulted to primary (they're intentionally the same)
  if (config.colors.accent === undefined) {
    return;
  }

  const dE = deltaEOklch(primary, accent);
  if (dE < DELTA_E_SIMILAR_THRESHOLD) {
    issues.push(
      issue(
        "warning",
        "COLOR_SIMILARITY",
        `Primary and accent colors are very similar (deltaE: ${dE.toFixed(1)}). Consider using more distinct colors for better visual hierarchy.`,
        "colors.accent"
      )
    );
  }
}

function checkMissingGlowShadow(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  // The schema doesn't have a "glow" shadow, but we can warn if
  // no shadows are defined at all — the system defaults will be used
  // but a custom theme might want to define its own glow effects.
  // More practically: if shadows are partially defined but missing common sizes.
  if (config.shadows) {
    const defined = Object.entries(config.shadows).filter(
      ([, v]) => v !== undefined
    );
    if (defined.length > 0 && defined.length < 5) {
      const allKeys = ["xs", "sm", "md", "lg", "xl"];
      const missing = allKeys.filter(
        (k) => config.shadows?.[k as keyof typeof config.shadows] === undefined
      );
      issues.push(
        issue(
          "warning",
          "INCOMPLETE_SHADOWS",
          `Shadow scale is partially defined — missing: ${missing.join(", ")}. Consider defining the full scale for consistency.`,
          "shadows"
        )
      );
    }
  }
}

function checkRadiusScale(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  if (!config.radius) return;

  const resolved = resolveConfig(config);
  const { sm, md, lg, xl } = resolved.radius;

  // Check that the scale is monotonically increasing (sm < md < lg < xl)
  if (sm > md) {
    issues.push(
      issue(
        "warning",
        "RADIUS_SCALE",
        `Radius scale is not monotonically increasing: sm (${sm}) > md (${md})`,
        "radius"
      )
    );
  }
  if (md > lg) {
    issues.push(
      issue(
        "warning",
        "RADIUS_SCALE",
        `Radius scale is not monotonically increasing: md (${md}) > lg (${lg})`,
        "radius"
      )
    );
  }
  if (lg > xl) {
    issues.push(
      issue(
        "warning",
        "RADIUS_SCALE",
        `Radius scale is not monotonically increasing: lg (${lg}) > xl (${xl})`,
        "radius"
      )
    );
  }
}

// ============================================================
// Public API
// ============================================================

/**
 * Validate a theme config comprehensively.
 *
 * Returns structured results with errors (blocking) and warnings (non-blocking).
 * Results are JSON-serializable for CLI `--json` output.
 *
 * @param config - A parsed theme config object (from YAML or programmatic)
 * @returns ThemeValidationResult with errors[], warnings[], and valid boolean
 */
export function validate(config: unknown): ThemeValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Structural integrity (errors)
  const structurallyValid = checkStructuralIntegrity(config, errors);

  // If structurally invalid, skip deeper checks
  if (!structurallyValid) {
    return { valid: false, errors, warnings };
  }

  const typedConfig = config as VisorThemeConfig;

  // 2. Completeness (errors)
  checkCompleteness(typedConfig, errors);

  // 3. Type scale coherence (errors)
  checkTypeScaleCoherence(typedConfig, errors);

  // Only run warning checks if there are no errors
  // (warnings depend on valid config structure)
  if (errors.length === 0) {
    // 4. WCAG contrast warnings
    checkContrastWarnings(typedConfig, warnings);

    // 5. Primary/accent similarity
    checkColorSimilarity(typedConfig, warnings);

    // 6. Missing glow shadow
    checkMissingGlowShadow(typedConfig, warnings);

    // 7. Inconsistent radius scale
    checkRadiusScale(typedConfig, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
