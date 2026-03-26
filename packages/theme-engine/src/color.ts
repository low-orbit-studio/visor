/**
 * OKLCH Color Math
 *
 * Pure color conversion and gamut mapping utilities with zero external dependencies.
 * Ported from Blacklight's colorMath.ts with improved gamut clamping via binary search.
 */

import type { RGB, OKLCH, ParsedColor, ColorFormat } from "./types.js";

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

export function getContrastRatio(
  color1: string | ParsedColor,
  color2: string | ParsedColor,
  compositeBackground?: RGB
): number {
  const resolved1 = resolveContrastColor(color1, compositeBackground);
  const resolved2 = resolveContrastColor(color2, compositeBackground);
  const l1 = getLuminance(...resolved1);
  const l2 = getLuminance(...resolved2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function resolveContrastColor(
  color: string | ParsedColor,
  compositeBackground?: RGB
): RGB {
  if (typeof color === "string") {
    const parsed = parseColor(color);
    if (!parsed) {
      throw new Error(`Invalid color: ${color}`);
    }
    if (parsed.alpha !== undefined && parsed.alpha < 1 && compositeBackground) {
      return compositeOverBackground(parsed, compositeBackground);
    }
    return parsed.rgb;
  }
  if (color.alpha !== undefined && color.alpha < 1 && compositeBackground) {
    return compositeOverBackground(color, compositeBackground);
  }
  return color.rgb;
}

// ============================================================
// Multi-Format Color Parsing
// ============================================================

/** Parse a hex color string into a ParsedColor. */
export function parseHex(str: string): ParsedColor | null {
  const trimmed = str.trim();
  const stripped = trimmed.replace(/^#/, "");

  // Extract alpha from #RRGGBBAA before normalization
  let alpha: number | undefined;
  if (stripped.length === 8) {
    alpha = parseInt(stripped.slice(6, 8), 16) / 255;
  }

  const normalized = normalizeHex(trimmed);
  if (!normalized) return null;

  return {
    rgb: hexToRgb(normalized),
    alpha,
    format: "hex",
    original: trimmed,
  };
}

const RGBA_RE =
  /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([01]?\.?\d*))?\s*\)$/;

/** Parse an rgb() or rgba() color string into a ParsedColor. */
export function parseRgba(str: string): ParsedColor | null {
  const trimmed = str.trim();
  const m = RGBA_RE.exec(trimmed);
  if (!m) return null;

  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);

  if (r > 255 || g > 255 || b > 255) return null;

  let alpha: number | undefined;
  if (m[4] !== undefined) {
    alpha = parseFloat(m[4]);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) return null;
  }

  return {
    rgb: [r, g, b],
    alpha,
    format: "rgba",
    original: trimmed,
  };
}

const HSLA_RE =
  /^hsla?\(\s*(\d{1,3}(?:\.\d+)?)\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*,\s*(\d{1,3}(?:\.\d+)?)%\s*(?:,\s*([01]?\.?\d*))?\s*\)$/;

/** Convert HSL values to RGB. h: 0-360, s: 0-100, l: 0-100. */
function hslToRgb(h: number, s: number, l: number): RGB {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r1: number, g1: number, b1: number;

  if (h < 60) {
    [r1, g1, b1] = [c, x, 0];
  } else if (h < 120) {
    [r1, g1, b1] = [x, c, 0];
  } else if (h < 180) {
    [r1, g1, b1] = [0, c, x];
  } else if (h < 240) {
    [r1, g1, b1] = [0, x, c];
  } else if (h < 300) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/** Parse an hsl() or hsla() color string into a ParsedColor. */
export function parseHsla(str: string): ParsedColor | null {
  const trimmed = str.trim();
  const m = HSLA_RE.exec(trimmed);
  if (!m) return null;

  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]);
  const l = parseFloat(m[3]);

  if (h > 360 || s > 100 || l > 100) return null;

  let alpha: number | undefined;
  if (m[4] !== undefined) {
    alpha = parseFloat(m[4]);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) return null;
  }

  return {
    rgb: hslToRgb(h, s, l),
    alpha,
    format: "hsla",
    original: trimmed,
  };
}

const OKLCH_RE =
  /^oklch\(\s*([01]?\.?\d+)\s+([0-9]*\.?\d+)\s+([0-9]*\.?\d+)\s*(?:\/\s*([01]?\.?\d*))?\s*\)$/;

/** Parse an oklch() color string into a ParsedColor. */
export function parseOklch(str: string): ParsedColor | null {
  const trimmed = str.trim();
  const m = OKLCH_RE.exec(trimmed);
  if (!m) return null;

  const L = parseFloat(m[1]);
  const C = parseFloat(m[2]);
  const H = parseFloat(m[3]);

  if (isNaN(L) || isNaN(C) || isNaN(H)) return null;
  if (L < 0 || L > 1) return null;

  let alpha: number | undefined;
  if (m[4] !== undefined) {
    alpha = parseFloat(m[4]);
    if (isNaN(alpha) || alpha < 0 || alpha > 1) return null;
  }

  return {
    rgb: clampToSrgb(L, C, H),
    alpha,
    format: "oklch",
    original: trimmed,
  };
}

/**
 * Parse any supported CSS color string into a ParsedColor.
 * Supports hex, rgba(), hsla(), and oklch().
 * Returns null if the string is not a recognized format.
 */
export function parseColor(str: string): ParsedColor | null {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();

  // Try hex first (most common case) — require # prefix for valid CSS
  if (trimmed.startsWith("#")) {
    return parseHex(trimmed);
  }
  if (trimmed.startsWith("rgb")) {
    return parseRgba(trimmed);
  }
  if (trimmed.startsWith("hsl")) {
    return parseHsla(trimmed);
  }
  if (trimmed.startsWith("oklch")) {
    return parseOklch(trimmed);
  }

  return null;
}

/** Returns true if the string is a valid CSS color in any supported format. */
export function isValidColor(str: string): boolean {
  return parseColor(str) !== null;
}

/**
 * Alpha-composite a color with alpha onto an opaque background.
 * Returns the composited RGB value.
 */
export function compositeOverBackground(
  color: ParsedColor,
  background: RGB
): RGB {
  const a = color.alpha ?? 1;
  return [
    Math.round(a * color.rgb[0] + (1 - a) * background[0]),
    Math.round(a * color.rgb[1] + (1 - a) * background[1]),
    Math.round(a * color.rgb[2] + (1 - a) * background[2]),
  ];
}

// ============================================================
// Color Serialization (for round-trip export)
// ============================================================

/** Convert RGB to an rgb()/rgba() string. */
function rgbToRgbaString(rgb: RGB, alpha?: number): string {
  if (alpha !== undefined) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

/** Convert RGB to an hsl()/hsla() string. */
function rgbToHslaString(rgb: RGB, alpha?: number): string {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }

  const hRound = Math.round(h);
  const sRound = Math.round(s * 100);
  const lRound = Math.round(l * 100);

  if (alpha !== undefined) {
    return `hsla(${hRound}, ${sRound}%, ${lRound}%, ${alpha})`;
  }
  return `hsl(${hRound}, ${sRound}%, ${lRound}%)`;
}

/** Convert RGB to an oklch() string. */
function rgbToOklchString(rgb: RGB, alpha?: number): string {
  const [L, C, H] = rgbToOklch(...rgb);
  const lStr = L.toFixed(4);
  const cStr = C.toFixed(4);
  const hStr = H.toFixed(2);

  if (alpha !== undefined) {
    return `oklch(${lStr} ${cStr} ${hStr} / ${alpha})`;
  }
  return `oklch(${lStr} ${cStr} ${hStr})`;
}

/**
 * Serialize a ParsedColor back to a CSS string in its original format.
 * For non-hex formats, returns the original string to avoid lossy round-trips
 * (especially oklch, where gamut clamping makes RGB→OKLCH irreversible).
 * Falls back to re-deriving from RGB only for hex format.
 */
export function serializeColor(parsed: ParsedColor): string {
  // For non-hex formats, prefer the original string to avoid lossy conversion
  if (parsed.format !== "hex" && parsed.original) {
    return parsed.original;
  }

  switch (parsed.format) {
    case "hex": {
      if (parsed.alpha !== undefined) {
        const alphaHex = Math.round(parsed.alpha * 255)
          .toString(16)
          .padStart(2, "0");
        return `${rgbToHex(parsed.rgb)}${alphaHex}`;
      }
      return rgbToHex(parsed.rgb);
    }
    case "rgba":
      return rgbToRgbaString(parsed.rgb, parsed.alpha);
    case "hsla":
      return rgbToHslaString(parsed.rgb, parsed.alpha);
    case "oklch":
      return rgbToOklchString(parsed.rgb, parsed.alpha);
  }
}
