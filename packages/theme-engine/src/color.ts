/**
 * OKLCH Color Math
 *
 * Pure color conversion and gamut mapping utilities with zero external dependencies.
 * Ported from Blacklight's colorMath.ts with improved gamut clamping via binary search.
 */

import type { RGB, OKLCH } from "./types.js";

// ============================================================
// Hex Validation & Normalization
// ============================================================

/**
 * Normalize a hex color to lowercase 6-digit format.
 * Accepts #RGB, #RRGGBB, or #RRGGBBAA (alpha is stripped).
 * Returns null if invalid.
 */
export function normalizeHex(hex: string): string | null {
  let color = hex.replace(/^#/, "");

  // Handle shorthand #RGB
  if (color.length === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }

  // Handle #RRGGBBAA — strip alpha
  if (color.length === 8) {
    color = color.slice(0, 6);
  }

  if (!/^[0-9a-fA-F]{6}$/.test(color)) {
    return null;
  }

  return `#${color.toLowerCase()}`;
}

export function isValidHex(hex: string): boolean {
  return normalizeHex(hex) !== null;
}

// ============================================================
// Color Conversions
// ============================================================

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex);
  if (!normalized) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

export function rgbToHex(rgb: RGB): string {
  const [r, g, b] = rgb.map((c) => Math.round(Math.max(0, Math.min(255, c))));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** sRGB gamma → linear */
function toLinear(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear → sRGB gamma */
function fromLinear(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * Convert RGB (0-255) to OKLCH.
 * Returns [L, C, H] where L: 0-1, C: chroma (0+), H: degrees 0-360.
 */
export function rgbToOklch(r: number, g: number, b: number): OKLCH {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  // Linear RGB → XYZ D65
  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb;

  // XYZ → OKLAB
  const l_ = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m_ = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s_ = 0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z;

  const lCbrt = Math.cbrt(l_);
  const mCbrt = Math.cbrt(m_);
  const sCbrt = Math.cbrt(s_);

  const L =
    0.2104542553 * lCbrt + 0.793617785 * mCbrt - 0.0040720468 * sCbrt;
  const a =
    1.9779984951 * lCbrt - 2.428592205 * mCbrt + 0.4505937099 * sCbrt;
  const okb =
    0.0259040371 * lCbrt + 0.7827717662 * mCbrt - 0.808675766 * sCbrt;

  // OKLAB → OKLCH (polar)
  const C = Math.sqrt(a * a + okb * okb);
  let H = Math.atan2(okb, a) * (180 / Math.PI);
  if (H < 0) H += 360;

  return [L, C, H];
}

export function hexToOklch(hex: string): OKLCH {
  return rgbToOklch(...hexToRgb(hex));
}

/**
 * Convert OKLCH to linear RGB (unbounded — may be out of gamut).
 * Returns [r, g, b] as linear-light values (not gamma-corrected, not clamped).
 */
function oklchToLinearRgb(
  L: number,
  C: number,
  H: number
): [number, number, number] {
  const hRad = H * (Math.PI / 180);
  const a = C * Math.cos(hRad);
  const okb = C * Math.sin(hRad);

  // OKLAB → LMS (cubed)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * okb;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * okb;
  const s_ = L - 0.0894841775 * a - 1.291485548 * okb;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS → linear RGB
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return [lr, lg, lb];
}

/** Check if linear RGB values are within the sRGB gamut (with small tolerance). */
function isInGamut(lr: number, lg: number, lb: number): boolean {
  const eps = 0.0001;
  return (
    lr >= -eps &&
    lr <= 1 + eps &&
    lg >= -eps &&
    lg <= 1 + eps &&
    lb >= -eps &&
    lb <= 1 + eps
  );
}

/**
 * Gamut-map an OKLCH color into sRGB by reducing chroma via binary search.
 * Preserves lightness and hue — only chroma is adjusted.
 */
export function clampToSrgb(L: number, C: number, H: number): RGB {
  // Check if already in gamut
  const [lr, lg, lb] = oklchToLinearRgb(L, C, H);
  if (isInGamut(lr, lg, lb)) {
    return [
      Math.round(fromLinear(Math.max(0, Math.min(1, lr))) * 255),
      Math.round(fromLinear(Math.max(0, Math.min(1, lg))) * 255),
      Math.round(fromLinear(Math.max(0, Math.min(1, lb))) * 255),
    ];
  }

  // Binary search: find max chroma that stays in gamut
  let lo = 0;
  let hi = C;
  const tolerance = 0.001;

  while (hi - lo > tolerance) {
    const mid = (lo + hi) / 2;
    const [r, g, b] = oklchToLinearRgb(L, mid, H);
    if (isInGamut(r, g, b)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const [r, g, b] = oklchToLinearRgb(L, lo, H);
  return [
    Math.round(fromLinear(Math.max(0, Math.min(1, r))) * 255),
    Math.round(fromLinear(Math.max(0, Math.min(1, g))) * 255),
    Math.round(fromLinear(Math.max(0, Math.min(1, b))) * 255),
  ];
}

/**
 * Convert OKLCH to hex, with gamut clamping.
 */
export function oklchToHex(L: number, C: number, H: number): string {
  return rgbToHex(clampToSrgb(L, C, H));
}

// ============================================================
// Contrast (WCAG 2.1)
// ============================================================

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
