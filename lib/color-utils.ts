/**
 * Color utilities — built on culori for OKLCH-aware color math.
 *
 * Used by ColorSwatch and related specimen components.
 */

import { parse, formatHex, wcagContrast } from "culori"

/**
 * Normalizes any CSS color string (hex, rgb, oklch, hsl, etc.) to a lowercase
 * 6-digit hex string. Returns the original string if parsing fails.
 */
export function toHex(cssColor: string): string {
  const parsed = parse(cssColor.trim())
  if (!parsed) return cssColor
  return formatHex(parsed) ?? cssColor
}

/**
 * Returns true if white text has better WCAG contrast against the given color
 * than black text. Falls back to false (dark text) if color cannot be parsed.
 */
export function needsLightText(cssColor: string): boolean {
  const color = parse(cssColor.trim())
  if (!color) return false
  const white = parse("#ffffff")!
  const black = parse("#000000")!
  return wcagContrast(color, white) >= wcagContrast(color, black)
}
