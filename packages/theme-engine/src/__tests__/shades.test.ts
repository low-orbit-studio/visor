import {
  generateShadeScale,
  TAILWIND_GRAY,
  FULL_SHADE_STEPS,
  SELECTIVE_SHADE_STEPS,
} from "../shades.js";
import { hexToOklch } from "../color.js";
import type {
  ColorRole,
  FullShadeScale,
  SelectiveShadeScale,
  ShadeStep,
} from "../types.js";

// ============================================================
// Helper
// ============================================================

function isValidHex6(hex: string): boolean {
  return /^#[0-9a-f]{6}$/.test(hex);
}

// ============================================================
// Scale Size by Role
// ============================================================

describe("scale size by role", () => {
  it("primary role produces exactly 11 shades (full scale)", () => {
    const scale = generateShadeScale("#3366cc", "primary") as FullShadeScale;
    const keys = Object.keys(scale).map(Number);
    expect(keys).toHaveLength(11);
    expect(keys.sort((a, b) => a - b)).toEqual(FULL_SHADE_STEPS);
  });

  it("accent role produces exactly 11 shades (full scale)", () => {
    const scale = generateShadeScale("#cc6633", "accent") as FullShadeScale;
    const keys = Object.keys(scale).map(Number);
    expect(keys).toHaveLength(11);
  });

  it("neutral role produces exactly 11 shades (full scale)", () => {
    const scale = generateShadeScale("#808080", "neutral") as FullShadeScale;
    const keys = Object.keys(scale).map(Number);
    expect(keys).toHaveLength(11);
  });

  const selectiveRoles: ColorRole[] = ["success", "warning", "error", "info"];

  for (const role of selectiveRoles) {
    it(`${role} role produces exactly 6 shades (selective scale)`, () => {
      const scale = generateShadeScale(
        "#22aa44",
        role
      ) as SelectiveShadeScale;
      const keys = Object.keys(scale).map(Number);
      expect(keys).toHaveLength(6);
      expect(keys.sort((a, b) => a - b)).toEqual(SELECTIVE_SHADE_STEPS);
    });
  }
});

// ============================================================
// Hex Validity
// ============================================================

describe("generated hex values", () => {
  it("all shades are valid 6-digit lowercase hex", () => {
    const scale = generateShadeScale("#3366cc", "primary") as FullShadeScale;
    for (const step of FULL_SHADE_STEPS) {
      expect(isValidHex6(scale[step])).toBe(true);
    }
  });

  it("selective scale shades are valid hex", () => {
    const scale = generateShadeScale(
      "#22aa44",
      "success"
    ) as SelectiveShadeScale;
    for (const step of SELECTIVE_SHADE_STEPS) {
      expect(isValidHex6(scale[step as keyof SelectiveShadeScale])).toBe(true);
    }
  });
});

// ============================================================
// Lightness Monotonically Decreases
// ============================================================

describe("lightness monotonically decreases from shade 50 to 950", () => {
  it("primary scale has decreasing L values", () => {
    const scale = generateShadeScale("#3366cc", "primary") as FullShadeScale;
    const lightnessValues = FULL_SHADE_STEPS.map(
      (step) => hexToOklch(scale[step])[0]
    );

    for (let i = 1; i < lightnessValues.length; i++) {
      expect(lightnessValues[i]).toBeLessThan(lightnessValues[i - 1]);
    }
  });

  it("selective scale shade 50 is lightest and shade 900 is darkest", () => {
    const scale = generateShadeScale(
      "#22aa44",
      "success"
    ) as SelectiveShadeScale;

    const l50 = hexToOklch(scale[50])[0];
    const l100 = hexToOklch(scale[100])[0];
    const l900 = hexToOklch(scale[900])[0];

    // Shade 50 is the lightest
    expect(l50).toBeGreaterThan(l100);
    // Shade 900 is the darkest
    expect(l900).toBeLessThan(l50);
    expect(l900).toBeLessThan(l100);
  });
});

// ============================================================
// Anchor Shade Matches Input
// ============================================================

describe("anchor shade approximately matches input", () => {
  it("primary anchor (shade 600) is close to input color in lightness", () => {
    const inputHex = "#3366cc";
    const scale = generateShadeScale(inputHex, "primary") as FullShadeScale;

    const inputL = hexToOklch(inputHex)[0];
    const anchorL = hexToOklch(scale[600])[0];

    expect(Math.abs(inputL - anchorL)).toBeLessThan(0.05);
  });

  it("success anchor (shade 500) is close to input color in lightness", () => {
    const inputHex = "#22aa44";
    const scale = generateShadeScale(
      inputHex,
      "success"
    ) as SelectiveShadeScale;

    const inputL = hexToOklch(inputHex)[0];
    const anchorL = hexToOklch(scale[500])[0];

    expect(Math.abs(inputL - anchorL)).toBeLessThan(0.05);
  });
});

// ============================================================
// Neutral Role: Low Chroma
// ============================================================

describe("neutral role produces low-chroma shades", () => {
  it("all shades have chroma < 0.03", () => {
    const scale = generateShadeScale("#808080", "neutral") as FullShadeScale;

    for (const step of FULL_SHADE_STEPS) {
      const [, C] = hexToOklch(scale[step]);
      expect(C).toBeLessThan(0.03);
    }
  });

  it("neutral with a tinted input still caps chroma", () => {
    const scale = generateShadeScale("#8888aa", "neutral") as FullShadeScale;

    for (const step of FULL_SHADE_STEPS) {
      const [, C] = hexToOklch(scale[step]);
      expect(C).toBeLessThan(0.03);
    }
  });
});

// ============================================================
// Extreme Inputs
// ============================================================

describe("extreme inputs", () => {
  it("handles very light input (#fafafa)", () => {
    const scale = generateShadeScale("#fafafa", "primary") as FullShadeScale;
    for (const step of FULL_SHADE_STEPS) {
      expect(isValidHex6(scale[step])).toBe(true);
    }
  });

  it("handles very dark input (#0a0a0a)", () => {
    const scale = generateShadeScale("#0a0a0a", "primary") as FullShadeScale;
    for (const step of FULL_SHADE_STEPS) {
      expect(isValidHex6(scale[step])).toBe(true);
    }
  });

  it("handles highly saturated input (#ff0000)", () => {
    const scale = generateShadeScale("#ff0000", "primary") as FullShadeScale;
    for (const step of FULL_SHADE_STEPS) {
      expect(isValidHex6(scale[step])).toBe(true);
    }
  });
});

// ============================================================
// TAILWIND_GRAY Constant
// ============================================================

describe("TAILWIND_GRAY", () => {
  it("has all 11 shade steps", () => {
    const keys = Object.keys(TAILWIND_GRAY).map(Number);
    expect(keys).toHaveLength(11);
    expect(keys.sort((a, b) => a - b)).toEqual(FULL_SHADE_STEPS);
  });

  it("has known values for shade 50 and 950", () => {
    expect(TAILWIND_GRAY[50]).toBe("#f9fafb");
    expect(TAILWIND_GRAY[950]).toBe("#030712");
  });

  it("all values are valid hex", () => {
    for (const step of FULL_SHADE_STEPS) {
      expect(isValidHex6(TAILWIND_GRAY[step])).toBe(true);
    }
  });
});
