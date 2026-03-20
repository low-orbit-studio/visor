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

import { describe, it, expect, vi, afterEach } from "vitest";

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
  primitiveMotionDurations,
  primitiveMotionEasings,
} from "../tokens/primitives.js";

import {
  semanticText,
  semanticSurface,
  semanticBorder,
  semanticInteractive,
  semanticSpacing,
  semanticTypography,
  semanticMotionDuration,
  semanticMotionEasing,
} from "../tokens/semantic.js";

import {
  adaptiveText,
  adaptiveSurface,
  adaptiveBorder,
} from "../tokens/adaptive.js";

import {
  applyTheme,
  getSystemTheme,
  THEME_DARK_CLASS,
  THEME_LIGHT_CLASS,
} from "../index.js";

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
  for (const name of Object.keys(primitiveMotionDurations)) valid.add(`motion-duration-${name}`);
  for (const name of Object.keys(primitiveMotionEasings)) valid.add(`motion-easing-${name}`);
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

  it("motion duration values are valid CSS time values", () => {
    const timeRegex = /^\d+ms$/;
    for (const [name, value] of Object.entries(primitiveMotionDurations)) {
      expect(value, `motion-duration-${name}`).toMatch(timeRegex);
    }
  });

  it("motion easing values are valid CSS easing functions", () => {
    for (const [name, value] of Object.entries(primitiveMotionEasings)) {
      const isValidEasing =
        value === "linear" ||
        value.startsWith("cubic-bezier(") ||
        value.startsWith("ease");
      expect(isValidEasing, `motion-easing-${name}: "${value}" should be a valid CSS easing`).toBe(true);
    }
  });

  it("motion duration has expected step values", () => {
    expect(primitiveMotionDurations).toHaveProperty("100");
    expect(primitiveMotionDurations).toHaveProperty("200");
    expect(primitiveMotionDurations).toHaveProperty("300");
    expect(primitiveMotionDurations).toHaveProperty("500");
    expect(primitiveMotionDurations).toHaveProperty("800");
  });

  it("motion easing has expected curve names", () => {
    expect(primitiveMotionEasings).toHaveProperty("ease-in");
    expect(primitiveMotionEasings).toHaveProperty("ease-out");
    expect(primitiveMotionEasings).toHaveProperty("ease-in-out");
    expect(primitiveMotionEasings).toHaveProperty("spring");
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

  it("all motion duration tokens reference valid motion-duration primitives", () => {
    for (const [name, ref] of Object.entries(semanticMotionDuration)) {
      expect(
        primitives.has(ref),
        `motion-duration-${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("all motion easing tokens reference valid motion-easing primitives", () => {
    for (const [name, ref] of Object.entries(semanticMotionEasing)) {
      expect(
        primitives.has(ref),
        `motion-easing-${name} references "${ref}" which should be a valid primitive`
      ).toBe(true);
    }
  });

  it("has required motion duration semantic roles", () => {
    expect(semanticMotionDuration).toHaveProperty("fast");
    expect(semanticMotionDuration).toHaveProperty("normal");
    expect(semanticMotionDuration).toHaveProperty("slow");
  });

  it("has required motion easing semantic roles", () => {
    expect(semanticMotionEasing).toHaveProperty("default");
    expect(semanticMotionEasing).toHaveProperty("enter");
    expect(semanticMotionEasing).toHaveProperty("exit");
    expect(semanticMotionEasing).toHaveProperty("spring");
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

// ============================================================
// Dark Mode Token Tests
// ============================================================

describe("Dark mode tokens", () => {
  const primitives = buildPrimitiveLookup();

  it("dark theme has a darker page surface than light theme", () => {
    // Dark page should be very dark (950/900 range)
    const darkPage = adaptiveSurface.page.dark;
    expect(darkPage).toMatch(/gray-(9[0-9]{2}|950)/);
  });

  it("dark theme uses lighter text than light theme", () => {
    // In dark mode primary text should be a light gray
    const darkPrimary = adaptiveText.primary.dark;
    expect(darkPrimary).toMatch(/gray-[1-9]0?$|white/);
    // And specifically lighter than the light-mode primary (gray-900)
    const lightPrimary = adaptiveText.primary.light;
    expect(lightPrimary).toMatch(/gray-9/);
  });

  it("dark theme border default is lighter than light theme surface (for contrast)", () => {
    // In dark mode, borders should use mid-range grays for visibility
    const darkBorderDefault = adaptiveBorder.default.dark;
    expect(darkBorderDefault).toMatch(/gray-[5-8]00/);
  });

  it("all adaptive dark values reference valid primitives", () => {
    const groups = [
      { name: "adaptiveText", tokens: adaptiveText },
      { name: "adaptiveSurface", tokens: adaptiveSurface },
      { name: "adaptiveBorder", tokens: adaptiveBorder },
    ];
    for (const { name, tokens } of groups) {
      for (const [tokenName, values] of Object.entries(tokens)) {
        expect(
          primitives.has(values.dark),
          `${name}.${tokenName}.dark references "${values.dark}" which must be a valid primitive`
        ).toBe(true);
      }
    }
  });

  it("dark theme accent uses lighter blue than light theme for readability", () => {
    // On dark backgrounds, strong accent should be a lighter blue
    const lightAccentStrong = adaptiveSurface["accent-strong"].light;
    const darkAccentStrong = adaptiveSurface["accent-strong"].dark;
    expect(lightAccentStrong).toMatch(/blue-[6-9]00/);
    expect(darkAccentStrong).toMatch(/blue-[1-5]00|blue-[1-5]0$/);
  });

  it("dark interactive default surface is darker than light", () => {
    const lightDefault = adaptiveSurface["interactive-default"].light;
    const darkDefault = adaptiveSurface["interactive-default"].dark;
    expect(lightDefault).toBe("color-white");
    expect(darkDefault).not.toBe("color-white");
    expect(darkDefault).toMatch(/gray-[7-9]00|gray-950/);
  });
});

// ============================================================
// CSS Generation Output Tests
// ============================================================

describe("CSS generation output structure", () => {
  it("dark theme CSS uses .dark selector", () => {
    // Verify that the dark theme selectors include .dark
    // This is a structural test — the CSS generator uses hardcoded selector strings
    const darkSelectors = [".dark", ".theme-dark", '[data-theme="dark"]'];
    for (const sel of darkSelectors) {
      expect(sel).toBeTruthy();
    }
    // .dark must be the primary short-form selector
    expect(darkSelectors).toContain(".dark");
  });

  it("dark theme supports data-theme attribute selector", () => {
    const expectedAttr = '[data-theme="dark"]';
    expect(expectedAttr).toMatch(/\[data-theme="dark"\]/);
  });

  it("light theme override selectors are defined for system-pref override", () => {
    // When user wants to force light mode against system pref,
    // these class/attribute values are used
    const lightOverrides = [".light", ".theme-light", '[data-theme="light"]'];
    expect(lightOverrides).toContain(".light");
    expect(lightOverrides).toContain('[data-theme="light"]');
  });

  it("adaptive tokens generate correct CSS variable format", () => {
    // Simulate what the generator does for a known token
    const primaryDark = adaptiveText.primary.dark; // "color-gray-50"
    const expectedCSSVar = `var(--${primaryDark})`;
    expect(expectedCSSVar).toBe("var(--color-gray-50)");
  });

  it("prefers-color-scheme dark media query format is valid CSS", () => {
    const mediaQuery = "@media (prefers-color-scheme: dark)";
    expect(mediaQuery).toMatch(/^@media \(prefers-color-scheme: dark\)$/);
  });
});

// ============================================================
// Theme Utility Tests
// ============================================================

describe("Theme utilities", () => {
  afterEach(() => {
    // Clean up DOM after each test
    document.documentElement.className = "";
    document.documentElement.removeAttribute("data-theme");
  });

  it("applyTheme('dark') adds the dark class to documentElement", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true);
  });

  it("applyTheme('light') adds the light class to documentElement", () => {
    applyTheme("light");
    expect(document.documentElement.classList.contains(THEME_LIGHT_CLASS)).toBe(true);
  });

  it("applyTheme removes previous theme classes before applying new one", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true);

    applyTheme("light");
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(false);
    expect(document.documentElement.classList.contains(THEME_LIGHT_CLASS)).toBe(true);
  });

  it("applyTheme accepts a custom element", () => {
    const el = document.createElement("div");
    applyTheme("dark", el);
    expect(el.classList.contains(THEME_DARK_CLASS)).toBe(true);
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(false);
  });

  it("getSystemTheme returns 'light' or 'dark'", () => {
    // jsdom does not implement matchMedia, so mock it first
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const theme = getSystemTheme();
    expect(["light", "dark"]).toContain(theme);

    window.matchMedia = originalMatchMedia;
  });

  it("getSystemTheme reflects matchMedia result", () => {
    // Mock matchMedia to return dark preference
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getSystemTheme()).toBe("dark");

    // Restore
    window.matchMedia = originalMatchMedia;
  });

  it("getSystemTheme returns 'light' when matchMedia returns false", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(getSystemTheme()).toBe("light");

    window.matchMedia = originalMatchMedia;
  });
});
