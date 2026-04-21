/**
 * Color → Dart conversion helpers for the Flutter adapter.
 *
 * Produces Flutter `Color(0xAARRGGBB)` literal strings from any CSS color
 * string (hex, rgba, hsla, oklch). Alpha is pre-multiplied at codegen time
 * so generated Dart never calls `.withValues(alpha:)` at runtime — a hard
 * rule from the Low Orbit Flutter playbook.
 */

import { parseColor } from "../color.js";

/** Alpha percentage → single byte (0-255). */
export function alphaToByte(alphaPct: number): number {
  const clamped = Math.max(0, Math.min(1, alphaPct));
  return Math.round(clamped * 255);
}

/** Format a byte 0-255 as a two-char uppercase hex string. */
function byteHex(n: number): string {
  const clamped = Math.max(0, Math.min(255, Math.round(n)));
  return clamped.toString(16).padStart(2, "0").toUpperCase();
}

/**
 * Convert a CSS color string to a Dart `Color(0xAARRGGBB)` literal.
 *
 * @param css - CSS color string (hex, rgba, hsla, oklch).
 * @param alphaOverride - Optional alpha override (0-1). If provided,
 *   overrides the parsed color's alpha.
 * @returns Dart literal like `Color(0xFF1A5F7A)` or `Color(0x801A5F7A)`.
 *
 * @throws If the input is not a valid CSS color.
 */
export function cssColorToDart(
  css: string,
  alphaOverride?: number,
): string {
  const parsed = parseColor(css);
  if (!parsed) {
    throw new Error(`Invalid CSS color: ${css}`);
  }
  const [r, g, b] = parsed.rgb;
  const alpha = alphaOverride !== undefined ? alphaOverride : parsed.alpha ?? 1;
  const aByte = alphaToByte(alpha);
  return `Color(0x${byteHex(aByte)}${byteHex(r)}${byteHex(g)}${byteHex(b)})`;
}

/**
 * Convenience: `Color(0xFFRRGGBB)` for a fully-opaque color.
 */
export function cssColorToOpaqueDart(css: string): string {
  return cssColorToDart(css, 1);
}

/**
 * Generate multiple opacity variants for a single base color.
 *
 * Returns a map from opacity-suffix (e.g. "10o", "50o") to Dart literal.
 * Standard Visor opacity set: 5, 10, 20, 40, 50, 60, 80.
 */
export function opacityVariants(
  css: string,
  percents: number[] = [5, 10, 20, 40, 50, 60, 80],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of percents) {
    out[`${p}o`] = cssColorToDart(css, p / 100);
  }
  return out;
}
