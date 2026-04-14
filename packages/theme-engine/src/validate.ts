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
import { hexToOklch, getContrastRatio, isValidHex, isValidColor, parseColor, rgbToOklch } from "./color.js";
import type { VisorThemeConfig, ResolvedThemeConfig, RGB } from "./types.js";
import {
  SEMANTIC_TEXT_MAP,
  SEMANTIC_SURFACE_MAP,
  SEMANTIC_BORDER_MAP,
  SEMANTIC_INTERACTIVE_MAP,
} from "./semantic-map.js";

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

/** Valid CSS length pattern for letter-spacing (e.g., "-0.05em", "0", "0.1rem", "1px") */
const CSS_LENGTH_RE = /^-?\d+(\.\d+)?(em|rem|px|%|ex|ch|vw|vh|cm|mm|in|pt|pc)?$/;

/** Named CSS timing function keywords */
const NAMED_EASINGS = new Set([
  "linear", "ease", "ease-in", "ease-out", "ease-in-out",
]);

/** Patterns for CSS timing functions */
const CUBIC_BEZIER_RE = /^cubic-bezier\(\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*\)$/;
const STEPS_RE = /^steps\(\s*\d+\s*(,\s*(start|end|jump-start|jump-end|jump-none|jump-both)\s*)?\)$/;

/** Build the set of known semantic token keys from semantic-map.ts */
const KNOWN_SEMANTIC_TOKENS: Set<string> = new Set([
  ...Object.keys(SEMANTIC_TEXT_MAP).map((k) => `text-${k}`),
  ...Object.keys(SEMANTIC_SURFACE_MAP).map((k) => `surface-${k}`),
  ...Object.keys(SEMANTIC_BORDER_MAP).map((k) => `border-${k}`),
  ...Object.keys(SEMANTIC_INTERACTIVE_MAP).map((k) => `interactive-${k}`),
]);

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
 * Approximate deltaE (OKLCH) between two CSS colors.
 * Uses Euclidean distance in OKLCH space — sufficient for
 * detecting "too similar" colors.
 */
function deltaEOklch(color1: string, color2: string): number {
  const parsed1 = parseColor(color1);
  const parsed2 = parseColor(color2);
  if (!parsed1 || !parsed2) return Infinity;
  const [l1, c1, h1] = rgbToOklch(...parsed1.rgb);
  const [l2, c2, h2] = rgbToOklch(...parsed2.rgb);

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
  // Check that all color values are valid when provided
  const colorEntries = Object.entries(config.colors) as [string, string][];
  for (const [key, value] of colorEntries) {
    if (value !== undefined && !isValidColor(value)) {
      issues.push(
        issue(
          "error",
          "INVALID_COLOR",
          `'colors.${key}' is not a valid CSS color: ${value}`,
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
      if (value !== undefined && !isValidColor(value)) {
        issues.push(
          issue(
            "error",
            "INVALID_COLOR",
            `'colors-dark.${key}' is not a valid CSS color: ${value}`,
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
    const { heading, display: displayFont, body } = config.typography;
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
    if (displayFont?.weight !== undefined) {
      if (
        typeof displayFont.weight !== "number" ||
        displayFont.weight < 100 ||
        displayFont.weight > 900
      ) {
        issues.push(
          issue(
            "error",
            "INVALID_WEIGHT",
            `'typography.display.weight' must be between 100 and 900, got: ${displayFont.weight}`,
            "typography.display.weight"
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
    if (displayFont?.family !== undefined) {
      if (typeof displayFont.family !== "string" || displayFont.family.trim().length === 0) {
        issues.push(
          issue(
            "error",
            "INVALID_FONT_FAMILY",
            "'typography.display.family' must be a non-empty string",
            "typography.display.family"
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

function checkLetterSpacing(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  const ls = config.typography?.["letter-spacing"];
  if (!ls) return;

  for (const key of ["tight", "normal", "wide"] as const) {
    const value = ls[key];
    if (value !== undefined) {
      if (typeof value !== "string" || !CSS_LENGTH_RE.test(value.trim())) {
        issues.push(
          issue(
            "error",
            "INVALID_LETTER_SPACING",
            `'typography.letter-spacing.${key}' must be a valid CSS length (e.g., "-0.05em", "0", "0.1rem"), got: ${value}`,
            `typography.letter-spacing.${key}`
          )
        );
      }
    }
  }
}

function isValidEasing(value: string): boolean {
  const trimmed = value.trim();
  if (NAMED_EASINGS.has(trimmed)) return true;
  if (CUBIC_BEZIER_RE.test(trimmed)) return true;
  if (STEPS_RE.test(trimmed)) return true;
  return false;
}

function checkMotionEasing(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  const easing = config.motion?.easing;
  if (easing === undefined) return;

  if (typeof easing !== "string" || !isValidEasing(easing)) {
    issues.push(
      issue(
        "error",
        "INVALID_EASING",
        `'motion.easing' must be a valid CSS timing function (e.g., "ease", "cubic-bezier(0.4, 0, 0.2, 1)", "steps(4, end)"), got: ${easing}`,
        "motion.easing"
      )
    );
  }
}

function parseDurationMs(value: string): number | null {
  const match = /^(\d+)ms$/.exec(value);
  return match ? parseInt(match[1], 10) : null;
}

function checkMotionDurationRuntime(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  const motion = config.motion;
  if (!motion) return;

  const durationKeys = ["duration-fast", "duration-normal", "duration-slow"] as const;
  const parsed: Record<string, number> = {};

  for (const key of durationKeys) {
    const value = motion[key];
    if (value === undefined) continue;

    const ms = parseDurationMs(value);
    if (ms === null) continue; // format already validated by schema

    if (ms <= 0) {
      issues.push(
        issue(
          "error",
          "INVALID_DURATION",
          `'motion.${key}' must be > 0ms, got: ${value}`,
          `motion.${key}`
        )
      );
    } else if (ms > 10000) {
      issues.push(
        issue(
          "error",
          "INVALID_DURATION",
          `'motion.${key}' must be <= 10000ms, got: ${value}`,
          `motion.${key}`
        )
      );
    }

    parsed[key] = ms;
  }

  // Warn if ordering is violated: fast < normal < slow
  if (parsed["duration-fast"] !== undefined && parsed["duration-normal"] !== undefined) {
    if (parsed["duration-fast"] >= parsed["duration-normal"]) {
      issues.push(
        issue(
          "warning",
          "DURATION_ORDER",
          `'motion.duration-fast' (${parsed["duration-fast"]}ms) should be less than 'motion.duration-normal' (${parsed["duration-normal"]}ms)`,
          "motion"
        )
      );
    }
  }
  if (parsed["duration-normal"] !== undefined && parsed["duration-slow"] !== undefined) {
    if (parsed["duration-normal"] >= parsed["duration-slow"]) {
      issues.push(
        issue(
          "warning",
          "DURATION_ORDER",
          `'motion.duration-normal' (${parsed["duration-normal"]}ms) should be less than 'motion.duration-slow' (${parsed["duration-slow"]}ms)`,
          "motion"
        )
      );
    }
  }
}

function checkOverrides(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  if (!config.overrides) return;

  for (const mode of ["light", "dark"] as const) {
    const modeOverrides = config.overrides[mode];
    if (!modeOverrides) continue;

    for (const [key, value] of Object.entries(modeOverrides)) {
      // Error on empty values
      if (typeof value !== "string" || value.trim().length === 0) {
        issues.push(
          issue(
            "error",
            "INVALID_OVERRIDE",
            `'overrides.${mode}.${key}' must be a non-empty string`,
            `overrides.${mode}.${key}`
          )
        );
        continue;
      }

      // Warn on keys that don't match any known semantic token
      if (!KNOWN_SEMANTIC_TOKENS.has(key)) {
        issues.push(
          issue(
            "warning",
            "UNKNOWN_OVERRIDE_KEY",
            `'overrides.${mode}.${key}' does not match any known semantic token. Valid tokens include: text-primary, surface-page, border-default, interactive-primary-bg, etc.`,
            `overrides.${mode}.${key}`
          )
        );
      }
    }
  }
}

/**
 * Completeness contract -- verifies the resolved theme has every token
 * the design system requires. Runs after resolveConfig() so we validate
 * the RESOLVED output, not the minimal user input.
 */
function checkResolvedCompleteness(
  resolved: ResolvedThemeConfig,
  issues: ValidationIssue[]
): void {
  // Required color fields in resolved config
  const requiredColors: Array<keyof ResolvedThemeConfig["colors"]> = [
    "primary", "accent", "background", "surface",
    "success", "warning", "error", "info",
  ];
  for (const key of requiredColors) {
    const value = resolved.colors[key];
    if (value === undefined || value === null) {
      // neutral is allowed to be null (uses Tailwind Gray)
      if ((key as string) === "neutral") continue;
      issues.push(
        issue("error", "INCOMPLETE_RESOLVED", `Resolved config missing 'colors.${key}'`, `colors.${key}`)
      );
    }
  }

  // Typography
  if (!resolved.typography.heading.family) {
    issues.push(issue("error", "INCOMPLETE_RESOLVED", "Resolved config missing 'typography.heading.family'", "typography.heading.family"));
  }
  if (!resolved.typography.body.family) {
    issues.push(issue("error", "INCOMPLETE_RESOLVED", "Resolved config missing 'typography.body.family'", "typography.body.family"));
  }
  if (!resolved.typography.mono.family) {
    issues.push(issue("error", "INCOMPLETE_RESOLVED", "Resolved config missing 'typography.mono.family'", "typography.mono.family"));
  }

  // Spacing
  if (resolved.spacing.base === undefined || resolved.spacing.base === null) {
    issues.push(issue("error", "INCOMPLETE_RESOLVED", "Resolved config missing 'spacing.base'", "spacing.base"));
  }

  // Radius -- all 5 tokens
  const requiredRadius: Array<keyof ResolvedThemeConfig["radius"]> = ["sm", "md", "lg", "xl", "pill"];
  for (const key of requiredRadius) {
    if (resolved.radius[key] === undefined || resolved.radius[key] === null) {
      issues.push(issue("error", "INCOMPLETE_RESOLVED", `Resolved config missing 'radius.${key}'`, `radius.${key}`));
    }
  }

  // Shadows -- all 5 tokens
  const requiredShadows: Array<keyof ResolvedThemeConfig["shadows"]> = ["xs", "sm", "md", "lg", "xl"];
  for (const key of requiredShadows) {
    if (!resolved.shadows[key]) {
      issues.push(issue("error", "INCOMPLETE_RESOLVED", `Resolved config missing 'shadows.${key}'`, `shadows.${key}`));
    }
  }

  // Motion -- all 4 tokens
  const requiredMotion: Array<keyof ResolvedThemeConfig["motion"]> = [
    "duration-fast", "duration-normal", "duration-slow", "easing",
  ];
  for (const key of requiredMotion) {
    if (!resolved.motion[key]) {
      issues.push(issue("error", "INCOMPLETE_RESOLVED", `Resolved config missing 'motion.${key}'`, `motion.${key}`));
    }
  }
}

// ============================================================
// Warning Rules (non-blocking)
// ============================================================

/** Parse a color string to RGB, returning a fallback if parsing fails. */
function colorToRgb(color: string): RGB {
  const parsed = parseColor(color);
  return parsed ? parsed.rgb : [0, 0, 0];
}

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

  // Resolve background RGB for alpha compositing
  const lightBgRgb = colorToRgb(lightBg);
  const lightSurfaceRgb = colorToRgb(lightSurface);

  // Text on background: use neutral-900 proxy (dark text on light bg).
  const textDark = "#111827"; // neutral-900 equivalent

  // Text contrast on background (composite against bg for alpha colors)
  const textOnBg = getContrastRatio(textDark, lightBg, lightBgRgb);
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
  const textOnSurface = getContrastRatio(textDark, lightSurface, lightSurfaceRgb);
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
  const primaryOnBg = getContrastRatio(primary, lightBg, lightBgRgb);
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
  const primaryOnSurface = getContrastRatio(primary, lightSurface, lightSurfaceRgb);
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

  const darkBgRgb = colorToRgb(darkBg);
  const darkSurfaceRgb = colorToRgb(darkSurface);

  // Light text on dark backgrounds
  const textLight = "#f9fafb"; // neutral-50 equivalent

  const textOnDarkBg = getContrastRatio(textLight, darkBg, darkBgRgb);
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

  const textOnDarkSurface = getContrastRatio(textLight, darkSurface, darkSurfaceRgb);
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
  const darkPrimaryOnBg = getContrastRatio(darkPrimary, darkBg, darkBgRgb);
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
  const darkPrimaryOnSurface = getContrastRatio(darkPrimary, darkSurface, darkSurfaceRgb);
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
// Dark/Light Color Parity
// ============================================================

function checkDarkLightParity(
  config: VisorThemeConfig,
  issues: ValidationIssue[]
): void {
  if (!config.colors) return;

  const colorKeys = Object.keys(config.colors).filter((k) => k !== "primary");
  const hasDarkSection = config["colors-dark"] !== undefined;

  // If custom colors beyond primary exist but no colors-dark section, warn
  if (colorKeys.length > 0 && !hasDarkSection) {
    issues.push(
      issue(
        "warning",
        "DARK_LIGHT_PARITY",
        "Custom colors are set but no colors-dark section exists. Dark mode will use generated defaults which may not match your brand.",
        "colors-dark"
      )
    );
    return;
  }

  // If both exist, check for key parity
  if (colorKeys.length > 0 && hasDarkSection) {
    const lightKeys = new Set(Object.keys(config.colors));
    const darkKeys = new Set(Object.keys(config["colors-dark"]!));

    // Check keys in light but not dark (skip primary — it's always present in light)
    for (const key of lightKeys) {
      if (key === "primary") continue;
      if (!darkKeys.has(key)) {
        issues.push(
          issue(
            "warning",
            "DARK_LIGHT_PARITY",
            `Color "${key}" is set in colors but missing from colors-dark. Dark mode will use a generated default.`,
            "colors-dark"
          )
        );
      }
    }

    // Check keys in dark but not light
    for (const key of darkKeys) {
      if (!lightKeys.has(key)) {
        issues.push(
          issue(
            "warning",
            "DARK_LIGHT_PARITY",
            `Color "${key}" is set in colors-dark but missing from colors. Light mode will use a generated default.`,
            "colors"
          )
        );
      }
    }
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

  // 4. Letter-spacing validation (errors)
  checkLetterSpacing(typedConfig, errors);

  // 5. Motion easing validation (errors)
  checkMotionEasing(typedConfig, errors);

  // 6. Motion duration runtime (errors + warnings mixed)
  const durationIssues: ValidationIssue[] = [];
  checkMotionDurationRuntime(typedConfig, durationIssues);
  for (const iss of durationIssues) {
    (iss.severity === "error" ? errors : warnings).push(iss);
  }

  // 7. Override validation (errors + warnings mixed)
  const overrideIssues: ValidationIssue[] = [];
  checkOverrides(typedConfig, overrideIssues);
  for (const iss of overrideIssues) {
    (iss.severity === "error" ? errors : warnings).push(iss);
  }

  // 8. Resolved completeness contract (errors)
  if (errors.length === 0) {
    const resolved = resolveConfig(typedConfig);
    checkResolvedCompleteness(resolved, errors);
  }

  // Only run warning checks if there are no errors
  // (warnings depend on valid config structure)
  if (errors.length === 0) {
    // 9. WCAG contrast warnings
    checkContrastWarnings(typedConfig, warnings);

    // 10. Primary/accent similarity
    checkColorSimilarity(typedConfig, warnings);

    // 11. Missing glow shadow
    checkMissingGlowShadow(typedConfig, warnings);

    // 12. Inconsistent radius scale
    checkRadiusScale(typedConfig, warnings);

    // 13. Dark/light color parity
    checkDarkLightParity(typedConfig, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
