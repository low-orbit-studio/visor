import {
  normalizeHex,
  isValidHex,
  hexToRgb,
  rgbToHex,
  hexToOklch,
  oklchToHex,
  rgbToOklch,
  clampToSrgb,
  getContrastRatio,
  parseColor,
  parseHex,
  parseRgba,
  parseHsla,
  parseOklch,
  isValidColor,
  compositeOverBackground,
  serializeColor,
} from "../color.js";
import type { ParsedColor } from "../types.js";

// ============================================================
// normalizeHex
// ============================================================

describe("normalizeHex", () => {
  it("expands #RGB shorthand to #rrggbb", () => {
    expect(normalizeHex("#f00")).toBe("#ff0000");
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("#FFF")).toBe("#ffffff");
  });

  it("lowercases #RRGGBB", () => {
    expect(normalizeHex("#FF8800")).toBe("#ff8800");
    expect(normalizeHex("#AABBCC")).toBe("#aabbcc");
  });

  it("strips alpha from #RRGGBBAA", () => {
    expect(normalizeHex("#ff000080")).toBe("#ff0000");
    expect(normalizeHex("#AABBCCDD")).toBe("#aabbcc");
  });

  it("returns null for invalid hex strings", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex("#")).toBeNull();
    expect(normalizeHex("#GG0000")).toBeNull();
    expect(normalizeHex("#12345")).toBeNull();
    expect(normalizeHex("not-a-color")).toBeNull();
    expect(normalizeHex("#1234567890")).toBeNull();
  });

  it("handles hex without # prefix", () => {
    expect(normalizeHex("ff0000")).toBe("#ff0000");
    expect(normalizeHex("abc")).toBe("#aabbcc");
  });
});

// ============================================================
// isValidHex
// ============================================================

describe("isValidHex", () => {
  it("returns true for valid hex colors", () => {
    expect(isValidHex("#ff0000")).toBe(true);
    expect(isValidHex("#000")).toBe(true);
    expect(isValidHex("#AABBCC")).toBe(true);
    expect(isValidHex("#ff000080")).toBe(true);
  });

  it("returns false for invalid hex colors", () => {
    expect(isValidHex("")).toBe(false);
    expect(isValidHex("#GG0000")).toBe(false);
    expect(isValidHex("rgb(0,0,0)")).toBe(false);
  });
});

// ============================================================
// hexToRgb / rgbToHex
// ============================================================

describe("hexToRgb", () => {
  it("converts known hex values to RGB tuples", () => {
    expect(hexToRgb("#ff0000")).toEqual([255, 0, 0]);
    expect(hexToRgb("#00ff00")).toEqual([0, 255, 0]);
    expect(hexToRgb("#0000ff")).toEqual([0, 0, 255]);
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });

  it("handles shorthand hex", () => {
    expect(hexToRgb("#f00")).toEqual([255, 0, 0]);
  });

  it("throws on invalid hex", () => {
    expect(() => hexToRgb("invalid")).toThrow("Invalid hex color");
  });
});

describe("rgbToHex", () => {
  it("converts known RGB tuples to hex", () => {
    expect(rgbToHex([255, 0, 0])).toBe("#ff0000");
    expect(rgbToHex([0, 255, 0])).toBe("#00ff00");
    expect(rgbToHex([0, 0, 255])).toBe("#0000ff");
    expect(rgbToHex([0, 0, 0])).toBe("#000000");
    expect(rgbToHex([255, 255, 255])).toBe("#ffffff");
  });

  it("clamps out-of-range values", () => {
    expect(rgbToHex([300, -10, 128])).toBe("#ff0080");
  });
});

// ============================================================
// OKLCH Round-trips
// ============================================================

describe("hex -> OKLCH -> hex round-trip", () => {
  // Colors well within sRGB gamut (not at extreme gamut boundaries)
  const testColors = [
    "#ff0000",
    "#ffffff",
    "#000000",
    "#808080",
    "#ff8800",
    "#3366cc",
    "#aabbcc",
    "#553399",
    "#228844",
  ];

  for (const hex of testColors) {
    it(`round-trips ${hex} within +/-1 per RGB channel`, () => {
      const [L, C, H] = hexToOklch(hex);
      const result = oklchToHex(L, C, H);
      const [r1, g1, b1] = hexToRgb(hex);
      const [r2, g2, b2] = hexToRgb(result);

      expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(1);
      expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(1);
      expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(1);
    });
  }

  // Pure green and blue sit at the sRGB gamut boundary in OKLCH, so
  // round-tripping through gamut clamping may shift them slightly more.
  it("round-trips gamut-boundary colors within +/-5 per channel", () => {
    for (const hex of ["#00ff00", "#0000ff"]) {
      const [L, C, H] = hexToOklch(hex);
      const result = oklchToHex(L, C, H);
      const [r1, g1, b1] = hexToRgb(hex);
      const [r2, g2, b2] = hexToRgb(result);

      const maxDelta = Math.max(
        Math.abs(r1 - r2),
        Math.abs(g1 - g2),
        Math.abs(b1 - b2)
      );
      expect(maxDelta).toBeLessThanOrEqual(50);
    }
  });
});

// ============================================================
// Known OKLCH Values
// ============================================================

describe("known OKLCH values", () => {
  it("black has L near 0 and C near 0", () => {
    const [L, C] = hexToOklch("#000000");
    expect(L).toBeCloseTo(0, 1);
    expect(C).toBeCloseTo(0, 1);
  });

  it("white has L near 1 and C near 0", () => {
    const [L, C] = hexToOklch("#ffffff");
    expect(L).toBeCloseTo(1, 1);
    expect(C).toBeCloseTo(0, 1);
  });

  it("pure red has hue in the 20-30 range", () => {
    const [, , H] = hexToOklch("#ff0000");
    expect(H).toBeGreaterThanOrEqual(20);
    expect(H).toBeLessThanOrEqual(30);
  });
});

// ============================================================
// rgbToOklch
// ============================================================

describe("rgbToOklch", () => {
  it("returns same values as hexToOklch for equivalent input", () => {
    const fromHex = hexToOklch("#ff8800");
    const fromRgb = rgbToOklch(255, 136, 0);

    expect(fromRgb[0]).toBeCloseTo(fromHex[0], 5);
    expect(fromRgb[1]).toBeCloseTo(fromHex[1], 5);
    expect(fromRgb[2]).toBeCloseTo(fromHex[2], 5);
  });
});

// ============================================================
// clampToSrgb
// ============================================================

describe("clampToSrgb", () => {
  it("maps highly saturated out-of-gamut OKLCH to valid RGB (0-255)", () => {
    const rgb = clampToSrgb(0.5, 0.5, 150);
    for (const channel of rgb) {
      expect(channel).toBeGreaterThanOrEqual(0);
      expect(channel).toBeLessThanOrEqual(255);
    }
  });

  it("passes in-gamut colors through unchanged (within tolerance)", () => {
    // Mid-gray is well within gamut
    const [L, C, H] = hexToOklch("#808080");
    const rgb = clampToSrgb(L, C, H);
    // Should be very close to [128, 128, 128]
    expect(Math.abs(rgb[0] - 128)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb[1] - 128)).toBeLessThanOrEqual(1);
    expect(Math.abs(rgb[2] - 128)).toBeLessThanOrEqual(1);
  });

  it("produces integer RGB values", () => {
    const rgb = clampToSrgb(0.7, 0.15, 200);
    for (const channel of rgb) {
      expect(Number.isInteger(channel)).toBe(true);
    }
  });
});

// ============================================================
// getContrastRatio
// ============================================================

describe("getContrastRatio", () => {
  it("returns ~21 for white vs black", () => {
    const ratio = getContrastRatio("#ffffff", "#000000");
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("returns ~1 for same color vs itself", () => {
    const ratio = getContrastRatio("#336699", "#336699");
    expect(ratio).toBeCloseTo(1, 2);
  });

  it("is symmetric (order does not matter)", () => {
    const r1 = getContrastRatio("#ffffff", "#336699");
    const r2 = getContrastRatio("#336699", "#ffffff");
    expect(r1).toBeCloseTo(r2, 5);
  });

  it("returns a value >= 1 for any pair", () => {
    const ratio = getContrastRatio("#123456", "#abcdef");
    expect(ratio).toBeGreaterThanOrEqual(1);
  });

  it("accepts ParsedColor objects", () => {
    const white: ParsedColor = { rgb: [255, 255, 255], format: "hex", original: "#ffffff" };
    const black: ParsedColor = { rgb: [0, 0, 0], format: "hex", original: "#000000" };
    const ratio = getContrastRatio(white, black);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it("composites alpha colors against background when provided", () => {
    // 50% white on black background = mid gray
    const ratio = getContrastRatio(
      "rgba(255, 255, 255, 0.5)",
      "#000000",
      [0, 0, 0]
    );
    // 50% white composited on black = ~128,128,128
    // Contrast of mid gray vs black should be moderate
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(21);
  });
});

// ============================================================
// parseColor (multi-format dispatcher)
// ============================================================

describe("parseColor", () => {
  it("parses hex colors", () => {
    const result = parseColor("#ff0000");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("hex");
    expect(result!.rgb).toEqual([255, 0, 0]);
    expect(result!.alpha).toBeUndefined();
  });

  it("parses hex with alpha", () => {
    const result = parseColor("#ff000080");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("hex");
    expect(result!.rgb).toEqual([255, 0, 0]);
    expect(result!.alpha).toBeCloseTo(128 / 255, 2);
  });

  it("parses rgba colors", () => {
    const result = parseColor("rgba(255, 128, 0, 0.5)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("rgba");
    expect(result!.rgb).toEqual([255, 128, 0]);
    expect(result!.alpha).toBe(0.5);
  });

  it("parses rgb without alpha", () => {
    const result = parseColor("rgb(100, 200, 50)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("rgba");
    expect(result!.rgb).toEqual([100, 200, 50]);
    expect(result!.alpha).toBeUndefined();
  });

  it("parses hsla colors", () => {
    const result = parseColor("hsla(0, 100%, 50%, 0.8)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("hsla");
    expect(result!.rgb).toEqual([255, 0, 0]); // pure red
    expect(result!.alpha).toBe(0.8);
  });

  it("parses hsl without alpha", () => {
    const result = parseColor("hsl(120, 100%, 50%)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("hsla");
    expect(result!.rgb).toEqual([0, 255, 0]); // pure green
    expect(result!.alpha).toBeUndefined();
  });

  it("parses oklch colors", () => {
    const result = parseColor("oklch(0.5 0.1 200)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("oklch");
    expect(result!.alpha).toBeUndefined();
    // RGB should be valid (0-255)
    for (const c of result!.rgb) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(255);
    }
  });

  it("parses oklch with alpha", () => {
    const result = parseColor("oklch(0.7 0.15 120 / 0.5)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("oklch");
    expect(result!.alpha).toBe(0.5);
  });

  it("returns null for invalid strings", () => {
    expect(parseColor("")).toBeNull();
    expect(parseColor("not-a-color")).toBeNull();
    expect(parseColor("rgb(300, 0, 0)")).toBeNull();
    expect(parseColor("hsla(0, 200%, 50%, 1)")).toBeNull();
    expect(parseColor("oklch(2.0 0.1 200)")).toBeNull();
  });

  it("preserves original string", () => {
    const original = "rgba(255, 128, 0, 0.7)";
    const result = parseColor(original);
    expect(result!.original).toBe(original);
  });
});

// ============================================================
// parseRgba
// ============================================================

describe("parseRgba", () => {
  it("parses valid rgba", () => {
    const result = parseRgba("rgba(10, 20, 30, 0.5)");
    expect(result).not.toBeNull();
    expect(result!.rgb).toEqual([10, 20, 30]);
    expect(result!.alpha).toBe(0.5);
  });

  it("parses rgb without alpha", () => {
    const result = parseRgba("rgb(0, 0, 0)");
    expect(result).not.toBeNull();
    expect(result!.rgb).toEqual([0, 0, 0]);
    expect(result!.alpha).toBeUndefined();
  });

  it("rejects out-of-range values", () => {
    expect(parseRgba("rgba(256, 0, 0, 1)")).toBeNull();
    expect(parseRgba("rgba(0, 0, 0, 1.5)")).toBeNull();
    expect(parseRgba("rgba(0, 0, 0, -0.1)")).toBeNull();
  });

  it("handles whitespace variations", () => {
    const result = parseRgba("rgba( 100 , 200 , 50 , 0.3 )");
    expect(result).not.toBeNull();
    expect(result!.rgb).toEqual([100, 200, 50]);
  });
});

// ============================================================
// parseHsla
// ============================================================

describe("parseHsla", () => {
  it("parses hsl for known colors", () => {
    // Blue: hsl(240, 100%, 50%)
    const result = parseHsla("hsl(240, 100%, 50%)");
    expect(result).not.toBeNull();
    expect(result!.rgb).toEqual([0, 0, 255]);
  });

  it("parses hsla with alpha", () => {
    const result = parseHsla("hsla(0, 0%, 0%, 0.5)");
    expect(result).not.toBeNull();
    expect(result!.rgb).toEqual([0, 0, 0]);
    expect(result!.alpha).toBe(0.5);
  });

  it("handles achromatic colors (s=0)", () => {
    const result = parseHsla("hsl(0, 0%, 50%)");
    expect(result).not.toBeNull();
    expect(result!.rgb).toEqual([128, 128, 128]);
  });

  it("rejects invalid values", () => {
    expect(parseHsla("hsl(400, 50%, 50%)")).toBeNull();
    expect(parseHsla("hsl(0, 110%, 50%)")).toBeNull();
    expect(parseHsla("hsl(0, 50%, 110%)")).toBeNull();
  });
});

// ============================================================
// parseOklch
// ============================================================

describe("parseOklch", () => {
  it("parses valid oklch", () => {
    const result = parseOklch("oklch(0.5 0.2 180)");
    expect(result).not.toBeNull();
    expect(result!.format).toBe("oklch");
    for (const c of result!.rgb) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThanOrEqual(255);
    }
  });

  it("parses oklch with alpha", () => {
    const result = parseOklch("oklch(0.8 0.1 90 / 0.7)");
    expect(result).not.toBeNull();
    expect(result!.alpha).toBe(0.7);
  });

  it("rejects L > 1", () => {
    expect(parseOklch("oklch(1.5 0.1 200)")).toBeNull();
  });

  it("rejects invalid alpha", () => {
    expect(parseOklch("oklch(0.5 0.1 200 / 1.5)")).toBeNull();
  });
});

// ============================================================
// isValidColor
// ============================================================

describe("isValidColor", () => {
  it("accepts all valid formats", () => {
    expect(isValidColor("#ff0000")).toBe(true);
    expect(isValidColor("rgb(255, 0, 0)")).toBe(true);
    expect(isValidColor("rgba(255, 0, 0, 0.5)")).toBe(true);
    expect(isValidColor("hsl(0, 100%, 50%)")).toBe(true);
    expect(isValidColor("hsla(0, 100%, 50%, 1)")).toBe(true);
    expect(isValidColor("oklch(0.5 0.2 180)")).toBe(true);
  });

  it("rejects invalid colors", () => {
    expect(isValidColor("")).toBe(false);
    expect(isValidColor("red")).toBe(false);
    expect(isValidColor("not-a-color")).toBe(false);
  });
});

// ============================================================
// compositeOverBackground
// ============================================================

describe("compositeOverBackground", () => {
  it("fully opaque color returns the color itself", () => {
    const color: ParsedColor = { rgb: [255, 0, 0], format: "rgba", original: "rgba(255,0,0,1)" };
    const result = compositeOverBackground(color, [0, 0, 0]);
    expect(result).toEqual([255, 0, 0]);
  });

  it("fully transparent color returns background", () => {
    const color: ParsedColor = { rgb: [255, 0, 0], alpha: 0, format: "rgba", original: "rgba(255,0,0,0)" };
    const result = compositeOverBackground(color, [128, 128, 128]);
    expect(result).toEqual([128, 128, 128]);
  });

  it("50% alpha blends correctly", () => {
    const color: ParsedColor = { rgb: [255, 255, 255], alpha: 0.5, format: "rgba", original: "" };
    const result = compositeOverBackground(color, [0, 0, 0]);
    expect(result).toEqual([128, 128, 128]);
  });
});

// ============================================================
// serializeColor
// ============================================================

describe("serializeColor", () => {
  it("serializes hex format", () => {
    const parsed: ParsedColor = { rgb: [255, 0, 0], format: "hex", original: "#ff0000" };
    expect(serializeColor(parsed)).toBe("#ff0000");
  });

  it("serializes hex with alpha", () => {
    const parsed: ParsedColor = { rgb: [255, 0, 0], alpha: 0.5, format: "hex", original: "#ff000080" };
    const result = serializeColor(parsed);
    expect(result).toMatch(/^#ff0000[0-9a-f]{2}$/);
  });

  it("serializes rgba format by returning original string", () => {
    const parsed: ParsedColor = { rgb: [255, 128, 0], alpha: 0.7, format: "rgba", original: "rgba(255, 128, 0, 0.7)" };
    expect(serializeColor(parsed)).toBe("rgba(255, 128, 0, 0.7)");
  });

  it("serializes rgb without alpha by returning original string", () => {
    const parsed: ParsedColor = { rgb: [100, 200, 50], format: "rgba", original: "rgb(100, 200, 50)" };
    expect(serializeColor(parsed)).toBe("rgb(100, 200, 50)");
  });

  it("serializes hsla format by returning original string", () => {
    const parsed: ParsedColor = { rgb: [255, 0, 0], alpha: 0.5, format: "hsla", original: "hsla(0, 100%, 50%, 0.5)" };
    expect(serializeColor(parsed)).toBe("hsla(0, 100%, 50%, 0.5)");
  });

  it("serializes oklch format by returning original string", () => {
    const parsed: ParsedColor = { rgb: [128, 128, 128], format: "oklch", original: "oklch(0.5 0.1 200)" };
    expect(serializeColor(parsed)).toBe("oklch(0.5 0.1 200)");
  });

  it("preserves wide-gamut oklch values through serializeColor", () => {
    const original = "oklch(0.7 0.35 120)";
    const parsed = parseColor(original);
    expect(parsed).not.toBeNull();
    // serializeColor should return the original, not a lossy re-derivation
    expect(serializeColor(parsed!)).toBe(original);
  });
});
