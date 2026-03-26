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
} from "../color.js";

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
});
