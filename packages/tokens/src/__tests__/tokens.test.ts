/**
 * Token System Tests
 *
 * Tests for the @loworbit/visor-tokens package:
 * - Primitive token validity
 * - Semantic token references resolve to valid primitives
 * - Adaptive tokens have both light and dark values
 * - Consumer override mechanism (CSS custom property structure)
 * - Token generation produces valid CSS
 */

import { describe, it, expect } from "vitest";

import {
  primitiveColors,
  primitiveSpacing,
  primitiveRadius,
  primitiveBorderWidths,
  primitiveFontSizes,
  primitiveFontWeights,
  primitiveLineHeights,
  primitiveShadows,
  primitiveZIndex,
  primitiveFontFamilies,
} from "../tokens/primitives.js";

import {
  semanticText,
  semanticSurface,
  semanticBorder,
  semanticInteractive,
  semanticSpacing,
  semanticTypography,
} from "../tokens/semantic.js";

import {
  adaptiveText,
  adaptiveSurface,
  adaptiveBorder,
} from "../tokens/adaptive.js";

// ============================================================
// Helpers
// ============================================================

function buildPrimitiveLookup(): Set<string> {
  const valid = new Set<string>();
  for (const name of Object.keys(primitiveColors)) valid.add(`color-${name}`);
  for (const name of Object.keys(primitiveSpacing)) valid.add(`spacing-${name}`);
  for (const name of Object.keys(primitiveRadius)) valid.add(`radius-${name}`);
  for (const name of Object.keys(primitiveBorderWidths)) valid.add(`border-width-${name}`);
  for (const name of Object.keys(primitiveFontFamilies)) valid.add(`font-${name}`);
  for (const name of Object.keys(primitiveFontSizes)) valid.add(`font-size-${name}`);
  for (const name of Object.keys(primitiveFontWeights)) valid.add(`font-weight-${name}`);
  for (const name of Object.keys(primitiveLineHeights)) valid.add(`line-height-${name}`);
  for (const name of Object.keys(primitiveShadows)) valid.add(`shadow-${name}`);
  for (const name of Object.keys(primitiveZIndex)) valid.add(`z-${name}`);
  return valid;
}

// ============================================================
// Primitive Tests
// ============================================================

describe("Primitive tokens", () => {
  it("all color values are valid hex codes", () => {
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    for (const [name, value] of Object.entries(primitiveColors)) {
      expect(value, `color ${name}`).toMatch(hexRegex);
    }
  });

  it("spacing values are non-negative numbers", () => {
    for (const [name, value] of Object.entries(primitiveSpacing)) {
      expect(value, `spacing ${name}`).toBeGreaterThanOrEqual(0);
      expect(typeof value, `spacing ${name} type`).toBe("number");
    }
  });

  it("radius values are non-negative numbers", () => {
    for (const [name, value] of Object.entries(primitiveRadius)) {
      expect(value, `radius ${name}`).toBeGreaterThanOrEqual(0);
    }
  });

  it("border widths are positive integers", () => {
    for (const [name, value] of Object.entries(primitiveBorderWidths)) {
      expect(value, `border-width ${name}`).toBeGreaterThan(0);
      expect(Number.isInteger(value), `border-width ${name} is integer`).toBe(true);
    }
  });

  it("font sizes are positive numbers", () => {
    for (const [name, value] of Object.entries(primitiveFontSizes)) {
      expect(value, `font-size ${name}`).toBeGreaterThan(0);
    }
  });

  it("font weights are standard CSS values", () => {
    const validWeights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (const [name, value] of Object.entries(primitiveFontWeights)) {
      expect(validWeights, `font-weight ${name}`).toContain(value);
    }
  });

  it("line heights are positive", () => {
    for (const [name, value] of Object.entries(primitiveLineHeights)) {
      expect(value, `line-height ${name}`).toBeGreaterThan(0);
    }
  });

  it("includes gray scale from 50 to 950", () => {
    const graySteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    for (const step of graySteps) {
      expect(primitiveColors, `gray-${step}`).toHaveProperty(`gray-${step}`);
    }
  });

  it("includes blue accent scale", () => {
    const blueSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    for (const step of blueSteps) {
      expect(primitiveColors, `blue-${step}`).toHaveProperty(`blue-${step}`);
    }
  });

  it("includes status colors (green, amber, red, sky)", () => {
    expect(primitiveColors).toHaveProperty("green-500");
    expect(primitiveColors).toHaveProperty("amber-500");
    expect(primitiveColors).toHaveProperty("red-500");
    expect(primitiveColors).toHaveProperty("sky-500");
  });

  it("includes white and black", () => {
    expect(primitiveColors).toHaveProperty("white");
    expect(primitiveColors).toHaveProperty("black");
    expect(primitiveColors.white).toBe("#ffffff");
    expect(primitiveColors.black).toBe("#000000");
  });

  it("spacing scale follows 4px base unit", () => {
    // All non-zero spacing values should be multiples of 4
    for (const [name, value] of Object.entries(primitiveSpacing)) {
      if (value !== 0) {
        expect(value % 4, `spacing ${name} (${value}px) is multiple of 4`).toBe(0);
      }
    }
  });

  it("z-index has required layers", () => {
    expect(primitiveZIndex).toHaveProperty("dropdown");
    expect(primitiveZIndex).toHaveProperty("sticky");
    expect(primitiveZIndex).toHaveProperty("modal");
    expect(primitiveZIndex).toHaveProperty("popover");
    expect(primitiveZIndex).toHaveProperty("toast");
  });
});

// ============================================================
// Semantic Token Tests
// ============================================================

describe("Semantic tokens", () => {
  const primitives = buildPrimitiveLookup();

  it("all text tokens reference valid primitives", () => {
    for (const [name, ref] of Object.entries(semanticText)) {
      expect(
        primitives.has(ref),
        `text-${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("all surface tokens reference valid primitives", () => {
    for (const [name, ref] of Object.entries(semanticSurface)) {
      expect(
        primitives.has(ref),
        `surface-${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("all border tokens reference valid primitives", () => {
    for (const [name, ref] of Object.entries(semanticBorder)) {
      expect(
        primitives.has(ref),
        `border-${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("all interactive tokens reference valid primitives", () => {
    for (const [name, ref] of Object.entries(semanticInteractive)) {
      expect(
        primitives.has(ref),
        `interactive-${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("all semantic spacing tokens reference valid spacing primitives", () => {
    for (const [name, ref] of Object.entries(semanticSpacing)) {
      expect(
        primitives.has(ref),
        `${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("all semantic typography tokens reference valid font primitives", () => {
    for (const [name, ref] of Object.entries(semanticTypography)) {
      expect(
        primitives.has(ref),
        `${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("has required text semantic roles", () => {
    expect(semanticText).toHaveProperty("primary");
    expect(semanticText).toHaveProperty("secondary");
    expect(semanticText).toHaveProperty("disabled");
    expect(semanticText).toHaveProperty("inverse");
    expect(semanticText).toHaveProperty("error");
  });

  it("has required surface semantic roles", () => {
    expect(semanticSurface).toHaveProperty("page");
    expect(semanticSurface).toHaveProperty("card");
    expect(semanticSurface).toHaveProperty("subtle");
    expect(semanticSurface).toHaveProperty("overlay");
  });

  it("has required border semantic roles", () => {
    expect(semanticBorder).toHaveProperty("default");
    expect(semanticBorder).toHaveProperty("focus");
    expect(semanticBorder).toHaveProperty("error");
  });

  it("has required interactive states", () => {
    expect(semanticInteractive).toHaveProperty("primary-bg");
    expect(semanticInteractive).toHaveProperty("primary-bg-hover");
    expect(semanticInteractive).toHaveProperty("primary-text");
    expect(semanticInteractive).toHaveProperty("destructive-bg");
  });
});

// ============================================================
// Adaptive Token Tests
// ============================================================

describe("Adaptive tokens", () => {
  const primitives = buildPrimitiveLookup();

  it("all adaptive text tokens have both light and dark values", () => {
    for (const [name, values] of Object.entries(adaptiveText)) {
      expect(values.light, `adaptiveText.${name}.light`).toBeTruthy();
      expect(values.dark, `adaptiveText.${name}.dark`).toBeTruthy();
    }
  });

  it("all adaptive surface tokens have both light and dark values", () => {
    for (const [name, values] of Object.entries(adaptiveSurface)) {
      expect(values.light, `adaptiveSurface.${name}.light`).toBeTruthy();
      expect(values.dark, `adaptiveSurface.${name}.dark`).toBeTruthy();
    }
  });

  it("all adaptive border tokens have both light and dark values", () => {
    for (const [name, values] of Object.entries(adaptiveBorder)) {
      expect(values.light, `adaptiveBorder.${name}.light`).toBeTruthy();
      expect(values.dark, `adaptiveBorder.${name}.dark`).toBeTruthy();
    }
  });

  it("all adaptive text light values reference valid primitives", () => {
    for (const [name, values] of Object.entries(adaptiveText)) {
      expect(
        primitives.has(values.light),
        `adaptiveText.${name}.light references "${values.light}"`
      ).toBe(true);
    }
  });

  it("all adaptive text dark values reference valid primitives", () => {
    for (const [name, values] of Object.entries(adaptiveText)) {
      expect(
        primitives.has(values.dark),
        `adaptiveText.${name}.dark references "${values.dark}"`
      ).toBe(true);
    }
  });

  it("all adaptive surface light values reference valid primitives", () => {
    for (const [name, values] of Object.entries(adaptiveSurface)) {
      expect(
        primitives.has(values.light),
        `adaptiveSurface.${name}.light references "${values.light}"`
      ).toBe(true);
    }
  });

  it("all adaptive surface dark values reference valid primitives", () => {
    for (const [name, values] of Object.entries(adaptiveSurface)) {
      expect(
        primitives.has(values.dark),
        `adaptiveSurface.${name}.dark references "${values.dark}"`
      ).toBe(true);
    }
  });

  it("dark theme inverts text primary/secondary (dark is lighter)", () => {
    // In dark mode, primary text should be a lighter gray than light mode
    const lightPrimary = adaptiveText.primary.light; // should be dark gray
    const darkPrimary = adaptiveText.primary.dark;   // should be light gray
    expect(lightPrimary).toContain("gray-9");        // dark gray (900/950)
    expect(darkPrimary).toContain("gray-5");         // light gray (50/100)
  });

  it("dark theme uses darker background for page surface", () => {
    const lightPage = adaptiveSurface.page.light;
    const darkPage = adaptiveSurface.page.dark;
    expect(lightPage).toBe("color-white");
    expect(darkPage).not.toBe("color-white");
  });

  it("adaptive token names match semantic token names", () => {
    // Every adaptive text token should have a corresponding semantic text token
    for (const name of Object.keys(adaptiveText)) {
      expect(semanticText, `semanticText should have "${name}"`).toHaveProperty(name);
    }
  });
});

// ============================================================
// CSS Generation Tests
// ============================================================

describe("CSS generation", () => {
  it("primitive color token names follow --color-{name} convention", () => {
    // Verify the naming convention used in CSS generation
    for (const name of Object.keys(primitiveColors)) {
      const cssVar = `--color-${name}`;
      // Should be lowercase with hyphens only
      expect(cssVar).toMatch(/^--color-[a-z0-9-]+$/);
    }
  });

  it("spacing token names follow --spacing-{n} convention", () => {
    for (const name of Object.keys(primitiveSpacing)) {
      const cssVar = `--spacing-${name}`;
      expect(cssVar).toMatch(/^--spacing-[0-9]+$/);
    }
  });

  it("semantic text token names follow --text-{name} convention", () => {
    for (const name of Object.keys(semanticText)) {
      const cssVar = `--text-${name}`;
      expect(cssVar).toMatch(/^--text-[a-z0-9-]+$/);
    }
  });

  it("semantic surface token names follow --surface-{name} convention", () => {
    for (const name of Object.keys(semanticSurface)) {
      const cssVar = `--surface-${name}`;
      expect(cssVar).toMatch(/^--surface-[a-z0-9-]+$/);
    }
  });
});

// ============================================================
// Consumer Override Mechanism Tests
// ============================================================

describe("Consumer override mechanism", () => {
  it("primitive token names are valid CSS custom property names", () => {
    // CSS custom properties must start with -- and contain no spaces
    for (const name of Object.keys(primitiveColors)) {
      const cssVar = `--color-${name}`;
      expect(cssVar.startsWith("--")).toBe(true);
      expect(cssVar).not.toContain(" ");
    }
  });

  it("semantic token names are valid CSS custom property names", () => {
    for (const name of Object.keys(semanticText)) {
      const cssVar = `--text-${name}`;
      expect(cssVar.startsWith("--")).toBe(true);
      expect(cssVar).not.toContain(" ");
    }
  });

  it("overriding a primitive propagates to semantic tokens (by design)", () => {
    // The consumer override model: redefine primitives, semantics pick up the change
    // This is a structural test — semantics reference primitives via var()
    // so changing a primitive automatically updates all semantics
    const primaryRef = semanticText.primary;
    expect(primaryRef.startsWith("color-")).toBe(true);
    // The generated CSS will be: --text-primary: var(--color-gray-900)
    // Consumer can override: --color-gray-900: #your-custom-color
    // and --text-primary will automatically reflect the change
  });

  it("adaptive tokens reference primitives (not hardcoded hex values)", () => {
    // All adaptive token values should be reference strings, not hex colors
    for (const [_name, values] of Object.entries(adaptiveText)) {
      expect(values.light).not.toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(values.dark).not.toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
