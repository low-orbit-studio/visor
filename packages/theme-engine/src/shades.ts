/**
 * Shade Scale Generation
 *
 * Generates perceptually uniform shade scales (50-950) from a base hex color
 * using the OKLCH color space. Implements the algorithm from the interchange format spec.
 */

import { hexToOklch, oklchToHex, parseColor, rgbToOklch } from "./color.js";
import type {
  ColorRole,
  FullShadeScale,
  SelectiveShadeScale,
  ShadeStep,
} from "./types.js";

// ============================================================
// Constants
// ============================================================

export const FULL_SHADE_STEPS: ShadeStep[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
];

export const SELECTIVE_SHADE_STEPS: ShadeStep[] = [
  50, 100, 500, 600, 700, 900,
];

/** Target lightness values per shade step (OKLCH L, 0-1). */
const LIGHTNESS_TARGETS: Record<ShadeStep, number> = {
  50: 0.97,
  100: 0.93,
  200: 0.87,
  300: 0.78,
  400: 0.65,
  500: -1, // placeholder — replaced by input L at anchor (brand color lives at 500)
  600: 0.45,
  700: 0.38,
  800: 0.3,
  900: 0.22,
  950: 0.14,
};

/** Chroma multipliers — fraction of input chroma preserved at each step. */
const CHROMA_MULTIPLIERS: Record<ShadeStep, number> = {
  50: 0.15,
  100: 0.25,
  200: 0.45,
  300: 0.7,
  400: 0.9,
  500: 1.0,
  600: 1.0,
  700: 1.0,
  800: 0.85,
  900: 0.7,
  950: 0.5,
};

/** Which shade step the input color anchors to, per role.
 * The brand color (colors.primary) lives at step 500 — this is the contract. */
const ANCHOR_SHADE: Record<ColorRole, ShadeStep> = {
  primary: 500,
  accent: 500,
  neutral: 500,
  success: 500,
  warning: 500,
  error: 500,
  info: 500,
};

/** Roles that generate full 11-step scales vs. selective 6-step scales. */
const FULL_SCALE_ROLES: ColorRole[] = ["primary", "accent", "neutral"];

/** Tailwind Gray — used verbatim when neutral is omitted from .visor.yaml. */
export const TAILWIND_GRAY: FullShadeScale = {
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
  950: "#030712",
};

// ============================================================
// Shade Generation
// ============================================================

/**
 * Compute the target lightness for a shade step, given the input color's lightness
 * and the anchor shade for this role.
 *
 * If the input L doesn't match the expected L at the anchor shade, we interpolate:
 * - Shades lighter than anchor: scale proportionally between input L and 0.97.
 * - Shades darker than anchor: scale proportionally between input L and 0.14.
 */
function computeLightness(
  step: ShadeStep,
  inputL: number,
  anchorShade: ShadeStep
): number {
  // The anchor shade uses the input lightness directly
  if (step === anchorShade) {
    return inputL;
  }

  const anchorTarget =
    anchorShade === 600 ? inputL : LIGHTNESS_TARGETS[anchorShade];
  const stepTarget = LIGHTNESS_TARGETS[step];

  // If the anchor target matches the input, use raw targets
  if (Math.abs(anchorTarget - inputL) < 0.01) {
    return stepTarget;
  }

  // Interpolate to adjust for input L not matching expected anchor L
  if (step < anchorShade) {
    // Lighter shade: interpolate between inputL and 0.97
    const anchorDefaultL =
      anchorShade === 600 ? 0.45 : LIGHTNESS_TARGETS[anchorShade];
    const rawRange = 0.97 - anchorDefaultL;
    const newRange = 0.97 - inputL;
    if (rawRange <= 0) return stepTarget;
    const t = (stepTarget - anchorDefaultL) / rawRange;
    return inputL + t * newRange;
  } else {
    // Darker shade: interpolate between inputL and 0.14
    const anchorDefaultL =
      anchorShade === 600 ? 0.45 : LIGHTNESS_TARGETS[anchorShade];
    const rawRange = anchorDefaultL - 0.14;
    const newRange = inputL - 0.14;
    if (rawRange <= 0) return stepTarget;
    const t = (anchorDefaultL - stepTarget) / rawRange;
    return inputL - t * newRange;
  }
}

/**
 * Generate a shade scale from a base color and a color role.
 * Accepts any supported CSS color format (hex, rgba, hsla, oklch).
 *
 * Primary/accent/neutral produce a full 11-step scale (50-950).
 * Status colors (success/warning/error/info) produce a selective 6-step scale.
 */
export function generateShadeScale(
  color: string,
  role: ColorRole
): FullShadeScale | SelectiveShadeScale {
  const parsed = parseColor(color);
  const [inputL, inputC, inputH] = parsed
    ? rgbToOklch(...parsed.rgb)
    : hexToOklch(color);
  const anchorShade = ANCHOR_SHADE[role];
  const steps = FULL_SCALE_ROLES.includes(role)
    ? FULL_SHADE_STEPS
    : SELECTIVE_SHADE_STEPS;

  // For neutral role, cap chroma to keep it visually gray
  const maxNeutralChroma = 0.02;

  const scale: Partial<Record<ShadeStep, string>> = {};

  for (const step of steps) {
    const targetL = computeLightness(step, inputL, anchorShade);
    let targetC = inputC * CHROMA_MULTIPLIERS[step];

    // Neutral: cap chroma for gray appearance
    if (role === "neutral") {
      targetC = Math.min(targetC, maxNeutralChroma);
    }

    scale[step] = oklchToHex(targetL, targetC, inputH);
  }

  return scale as FullShadeScale | SelectiveShadeScale;
}
