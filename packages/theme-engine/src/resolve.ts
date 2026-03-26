/**
 * Config Resolution
 *
 * Takes a raw VisorThemeConfig and fills in all defaults,
 * producing a fully resolved config ready for the pipeline.
 */

import type { VisorThemeConfig, ResolvedThemeConfig } from "./types.js";

// ============================================================
// Default Values (from Visor's primitives.ts)
// ============================================================

const DEFAULT_FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const DEFAULT_FONT_MONO =
  '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace';

const DEFAULTS = {
  colors: {
    background: "#FFFFFF",
    surface: "#FFFFFF",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#0EA5E9",
  },
  typography: {
    heading: { family: DEFAULT_FONT_SANS, weight: 600 },
    body: { family: DEFAULT_FONT_SANS, weight: 400 },
    mono: { family: DEFAULT_FONT_MONO },
  },
  spacing: { base: 4 },
  radius: { sm: 2, md: 4, lg: 8, xl: 12, pill: 9999 },
  shadows: {
    xs: "0 1px 1px 0 rgba(0, 0, 0, 0.04)",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
  },
  motion: {
    "duration-fast": "100ms",
    "duration-normal": "200ms",
    "duration-slow": "500ms",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
} as const;

// ============================================================
// Resolution
// ============================================================

export function resolveConfig(config: VisorThemeConfig): ResolvedThemeConfig {
  const colors = config.colors;

  return {
    name: config.name,
    version: 1,
    colors: {
      primary: colors.primary,
      accent: colors.accent ?? colors.primary,
      neutral: colors.neutral ?? null, // null = use Tailwind Gray verbatim
      background: colors.background ?? DEFAULTS.colors.background,
      surface: colors.surface ?? DEFAULTS.colors.surface,
      success: colors.success ?? DEFAULTS.colors.success,
      warning: colors.warning ?? DEFAULTS.colors.warning,
      error: colors.error ?? DEFAULTS.colors.error,
      info: colors.info ?? DEFAULTS.colors.info,
    },
    "colors-dark": config["colors-dark"],
    typography: {
      heading: {
        family:
          config.typography?.heading?.family ?? DEFAULTS.typography.heading.family,
        weight:
          config.typography?.heading?.weight ?? DEFAULTS.typography.heading.weight,
      },
      body: {
        family:
          config.typography?.body?.family ?? DEFAULTS.typography.body.family,
        weight:
          config.typography?.body?.weight ?? DEFAULTS.typography.body.weight,
      },
      mono: {
        family:
          config.typography?.mono?.family ?? DEFAULTS.typography.mono.family,
      },
    },
    spacing: {
      base: config.spacing?.base ?? DEFAULTS.spacing.base,
    },
    radius: {
      sm: config.radius?.sm ?? DEFAULTS.radius.sm,
      md: config.radius?.md ?? DEFAULTS.radius.md,
      lg: config.radius?.lg ?? DEFAULTS.radius.lg,
      xl: config.radius?.xl ?? DEFAULTS.radius.xl,
      pill: config.radius?.pill ?? DEFAULTS.radius.pill,
    },
    shadows: {
      xs: config.shadows?.xs ?? DEFAULTS.shadows.xs,
      sm: config.shadows?.sm ?? DEFAULTS.shadows.sm,
      md: config.shadows?.md ?? DEFAULTS.shadows.md,
      lg: config.shadows?.lg ?? DEFAULTS.shadows.lg,
      xl: config.shadows?.xl ?? DEFAULTS.shadows.xl,
    },
    motion: {
      "duration-fast":
        config.motion?.["duration-fast"] ?? DEFAULTS.motion["duration-fast"],
      "duration-normal":
        config.motion?.["duration-normal"] ?? DEFAULTS.motion["duration-normal"],
      "duration-slow":
        config.motion?.["duration-slow"] ?? DEFAULTS.motion["duration-slow"],
      easing: config.motion?.easing ?? DEFAULTS.motion.easing,
    },
    overrides: config.overrides,
  };
}
