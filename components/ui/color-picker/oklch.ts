/**
 * OKLCH color-space helpers for ColorPicker.
 *
 * Re-exports the validated OKLCH math from `@loworbitstudio/visor-theme-engine`
 * — the same engine that powers the docs theme creator — and adds a couple of
 * gamut-aware helpers used by the picker's plane / hue canvases. The math
 * itself is *not* re-implemented locally: the theme-engine package is already
 * the single source of truth for color conversions across Visor.
 *
 * Keeping this as a small pure-math module (no React imports) lets the picker
 * stay easy to unit-test and lets consumers swap in their own math if they
 * fork the component.
 */

import {
  hexToOklch,
  oklchToHex,
  clampToSrgb,
  rgbToHex,
  isValidHex,
  normalizeHex,
} from "@loworbitstudio/visor-theme-engine"

/**
 * Maximum chroma rendered on the lightness/chroma plane. Above this, almost
 * every OKLCH triple is out of sRGB gamut — extending past it just shows the
 * dim out-of-gamut blend with no useful color. Documented as intentional;
 * matches the reference engine in `packages/docs/app/create/components/oklch-picker.tsx`.
 */
export const MAX_CHROMA = 0.37

/** Preview lightness for the hue track strip. */
export const HUE_PREVIEW_L = 0.7

/** Preview chroma for the hue track strip. */
export const HUE_PREVIEW_C = 0.15

export type OKLCH = [number, number, number]

/** Parse a hex string, returning a fallback OKLCH if the hex is invalid. */
export function safeHexToOklch(hex: string, fallback: OKLCH = [0.55, 0.15, 260]): OKLCH {
  try {
    return hexToOklch(hex)
  } catch {
    return fallback
  }
}

/**
 * Returns true if the given OKLCH triple falls outside sRGB gamut.
 *
 * Note: this mirrors the reference picker's `clampedHex !== directHex` check.
 * In the current `@loworbitstudio/visor-theme-engine` build, `oklchToHex`
 * routes through `rgbToHex(clampToSrgb(...))` — so this comparison is always
 * false in practice. The helper stays here as a stable seam: a future engine
 * release can distinguish gamut-mapping from clamping (e.g. by exposing the
 * unclamped linear RGB) and the picker's dim-out-of-gamut branch will light
 * up automatically.
 */
export function isOutOfGamut(L: number, C: number, H: number): boolean {
  const clamped = clampToSrgb(L, C, H)
  const clampedHex = rgbToHex(clamped)
  const directHex = oklchToHex(L, C, H)
  return clampedHex !== directHex
}

export {
  hexToOklch,
  oklchToHex,
  clampToSrgb,
  rgbToHex,
  isValidHex,
  normalizeHex,
}
