/**
 * Export Pipeline
 *
 * Reverses the import pipeline: given theme data, produces a minimal .visor.yaml string.
 * Only includes values that differ from defaults.
 */

import { stringify as stringifyYaml } from "yaml";
import type {
  GeneratedPrimitives,
  ResolvedThemeConfig,
  VisorThemeConfig,
} from "./types.js";

// ============================================================
// Default Detection
// ============================================================

const DEFAULT_COLORS = {
  background: "#ffffff",
  surface: "#ffffff",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#0ea5e9",
};

const DEFAULT_RADIUS = { sm: 2, md: 4, lg: 8, xl: 12, pill: 9999 };

const DEFAULT_SHADOWS = {
  xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

const DEFAULT_MOTION = {
  "duration-fast": "100ms",
  "duration-normal": "200ms",
  "duration-slow": "500ms",
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

const DEFAULT_FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DEFAULT_FONT_MONO =
  '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace';

function isDefaultColor(key: string, value: string): boolean {
  return (
    key in DEFAULT_COLORS &&
    value.toLowerCase() === DEFAULT_COLORS[key as keyof typeof DEFAULT_COLORS]
  );
}

// ============================================================
// Export
// ============================================================

/**
 * Extract anchor shade hex from primitives for a given role.
 * Primary/accent anchor at shade 600, neutral/status at shade 500.
 */
function extractAnchorColor(
  primitives: GeneratedPrimitives,
  role: keyof GeneratedPrimitives
): string {
  const anchorShade =
    role === "primary" || role === "accent" ? 600 : 500;
  const scale = primitives[role] as Record<number, string>;
  return scale[anchorShade];
}

/**
 * Export a theme to a minimal .visor.yaml string.
 * Omits values that match defaults to keep output minimal.
 */
export function exportTheme(
  primitives: GeneratedPrimitives,
  config: ResolvedThemeConfig
): string {
  const output: Partial<VisorThemeConfig> = {
    name: config.name,
    version: 1,
  };

  // Colors — always include primary, only include others if non-default
  const colors: Record<string, string> = {
    primary: extractAnchorColor(primitives, "primary"),
  };

  // Accent — include if different from primary
  const accentHex = extractAnchorColor(primitives, "accent");
  if (accentHex.toLowerCase() !== colors.primary.toLowerCase()) {
    colors.accent = accentHex;
  }

  // Neutral — include if not null (null = Tailwind Gray default)
  if (config.colors.neutral !== null) {
    colors.neutral = extractAnchorColor(primitives, "neutral");
  }

  // Background/surface
  if (config.colors.background.toLowerCase() !== DEFAULT_COLORS.background) {
    colors.background = config.colors.background;
  }
  if (config.colors.surface.toLowerCase() !== DEFAULT_COLORS.surface) {
    colors.surface = config.colors.surface;
  }

  // Status colors — include if non-default
  for (const role of ["success", "warning", "error", "info"] as const) {
    const hex = extractAnchorColor(primitives, role);
    if (!isDefaultColor(role, hex)) {
      colors[role] = hex;
    }
  }

  output.colors = colors as VisorThemeConfig["colors"];

  // colors-dark — include if present
  if (config["colors-dark"]) {
    const darkColors: Record<string, string> = {};
    for (const [key, value] of Object.entries(config["colors-dark"])) {
      if (value) darkColors[key] = value;
    }
    if (Object.keys(darkColors).length > 0) {
      output["colors-dark"] =
        darkColors as VisorThemeConfig["colors-dark"];
    }
  }

  // Typography — include if non-default
  const typo: Record<string, unknown> = {};
  if (config.typography.heading.family !== DEFAULT_FONT_SANS) {
    typo.heading = { family: config.typography.heading.family };
  }
  if (config.typography.heading.weight !== 600) {
    typo.heading = { ...(typo.heading as object || {}), weight: config.typography.heading.weight };
  }
  if (config.typography.body.family !== DEFAULT_FONT_SANS) {
    typo.body = { family: config.typography.body.family };
  }
  if (config.typography.body.weight !== 400) {
    typo.body = { ...(typo.body as object || {}), weight: config.typography.body.weight };
  }
  if (config.typography.mono.family !== DEFAULT_FONT_MONO) {
    typo.mono = { family: config.typography.mono.family };
  }
  if (Object.keys(typo).length > 0) {
    output.typography = typo as VisorThemeConfig["typography"];
  }

  // Spacing — include if non-default
  if (config.spacing.base !== 4) {
    output.spacing = { base: config.spacing.base };
  }

  // Radius — include if non-default
  const radius: Record<string, number> = {};
  for (const [key, defaultVal] of Object.entries(DEFAULT_RADIUS)) {
    const val = config.radius[key as keyof typeof config.radius];
    if (val !== defaultVal) {
      radius[key] = val;
    }
  }
  if (Object.keys(radius).length > 0) {
    output.radius = radius as VisorThemeConfig["radius"];
  }

  // Shadows — include if non-default
  const shadows: Record<string, string> = {};
  for (const [key, defaultVal] of Object.entries(DEFAULT_SHADOWS)) {
    const val = config.shadows[key as keyof typeof config.shadows];
    if (val !== defaultVal) {
      shadows[key] = val;
    }
  }
  if (Object.keys(shadows).length > 0) {
    output.shadows = shadows as VisorThemeConfig["shadows"];
  }

  // Motion — include if non-default
  const motion: Record<string, string> = {};
  for (const [key, defaultVal] of Object.entries(DEFAULT_MOTION)) {
    const val = config.motion[key as keyof typeof config.motion];
    if (val !== defaultVal) {
      motion[key] = val;
    }
  }
  if (Object.keys(motion).length > 0) {
    output.motion = motion as VisorThemeConfig["motion"];
  }

  // Overrides — include if present
  if (config.overrides) {
    const overrides: Record<string, unknown> = {};
    if (config.overrides.light && Object.keys(config.overrides.light).length > 0) {
      overrides.light = config.overrides.light;
    }
    if (config.overrides.dark && Object.keys(config.overrides.dark).length > 0) {
      overrides.dark = config.overrides.dark;
    }
    if (Object.keys(overrides).length > 0) {
      output.overrides = overrides as VisorThemeConfig["overrides"];
    }
  }

  return stringifyYaml(output, { lineWidth: 0 });
}
