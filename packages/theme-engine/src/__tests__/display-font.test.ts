/**
 * Tests for the display font slot (VI-118).
 *
 * Covers: resolution, CSS output, fallback-to-heading, deduplication,
 * extraction, and validation.
 */

import { describe, it, expect } from "vitest";
import { resolveConfig } from "../resolve.js";
import { resolveThemeFonts } from "../fonts/pipeline.js";
import { generateThemeDataFromConfig } from "../pipeline.js";
import { extractFromCSS } from "../extract.js";
import { validate } from "../validate.js";
import type { VisorThemeConfig } from "../types.js";
import type { VisorTypography } from "../fonts/types.js";

const minimalConfig: VisorThemeConfig = {
  name: "Test",
  version: 1,
  colors: { primary: "#2563EB" },
};

describe("display font — resolution", () => {
  it("defaults display to heading family when omitted", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Inter", weight: 600 },
      },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.display.family).toBe("Inter");
    expect(resolved.typography.display.weight).toBe(400);
  });

  it("defaults display to system font stack when no heading specified", () => {
    const resolved = resolveConfig(minimalConfig);
    expect(resolved.typography.display.family).toContain("BlinkMacSystemFont");
    expect(resolved.typography.display.weight).toBe(400);
  });

  it("uses explicit display family when provided", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Inter", weight: 600 },
        display: { family: "Playfair Display", weight: 700 },
      },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.display.family).toBe("Playfair Display");
    expect(resolved.typography.display.weight).toBe(700);
  });

  it("heading never falls back to display", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Playfair Display" },
      },
    };
    const resolved = resolveConfig(config);
    // Heading should use system default, not Playfair Display
    expect(resolved.typography.heading.family).toContain("BlinkMacSystemFont");
    expect(resolved.typography.display.family).toBe("Playfair Display");
  });
});

describe("display font — CSS output", () => {
  it("generates --font-display CSS custom property", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Inter" },
        display: { family: "Playfair Display" },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = themeData.output.primitivesCss;
    expect(css).toContain("--font-display: Playfair Display;");
    expect(css).toContain("--font-heading: Inter;");
  });

  it("generates --weight-display CSS custom property", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Playfair Display", weight: 300 },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = themeData.output.primitivesCss;
    expect(css).toContain("--weight-display: 300;");
  });

  it("display default weight is 400", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Playfair Display" },
      },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.display.weight).toBe(400);
    const themeData = generateThemeDataFromConfig(config);
    const css = themeData.output.primitivesCss;
    expect(css).toContain("--weight-display: 400;");
  });
});

describe("display font — font pipeline", () => {
  it("resolves display font with correct family in CSS output", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter", weight: 600 },
      display: { family: "Playfair Display", weight: 400 },
      body: { family: "Inter", weight: 400 },
    };
    const result = resolveThemeFonts(typography);
    expect(result.display).not.toBeNull();
    expect(result.display?.family).toBe("Playfair Display");
    expect(result.css).toContain("--font-display:");
  });

  it("theme without display font falls back — no separate display in result", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter", weight: 600 },
      body: { family: "Inter", weight: 400 },
    };
    const result = resolveThemeFonts(typography);
    expect(result.display).toBeNull();
  });

  it("deduplicates Google Fonts import when display === heading family", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter", weight: 600 },
      display: { family: "Inter", weight: 400 },
      body: { family: "Roboto", weight: 400 },
    };
    const result = resolveThemeFonts(typography);
    // Display should share resolution with heading (same family)
    expect(result.display).toBe(result.heading);
    // The merged resolution should include both weights
    expect(result.heading?.weights).toContain(600);
    expect(result.heading?.weights).toContain(400);
  });

  it("generates @font-face for display with visor-fonts source", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter" },
      display: {
        family: "ModernSociety",
        weight: 400,
        source: "visor-fonts",
        org: "low-orbit",
      },
      body: { family: "Inter" },
    };
    const result = resolveThemeFonts(typography);
    expect(result.display).not.toBeNull();
    expect(result.display?.source).toBe("visor-fonts");
    expect(result.css).toContain("ModernSociety");
    expect(result.css).toContain("@font-face");
  });

  it("includes --weight-display in CSS output when display weight is specified", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter", weight: 600 },
      display: { family: "Playfair Display", weight: 300 },
    };
    const result = resolveThemeFonts(typography);
    expect(result.css).toContain("--weight-display: 300;");
  });
});

describe("display font — extraction", () => {
  it("extracts --font-display to display slot (not heading)", () => {
    const result = extractFromCSS(
      [
        {
          path: "test.css",
          content: `:root {
            --font-heading: "Inter";
            --font-display: "Playfair Display";
            --font-body: "Roboto";
          }`,
        },
      ],
      "test-theme",
    );
    expect(result.config.typography?.display?.family).toBe("Playfair Display");
    expect(result.config.typography?.heading?.family).toBe("Inter");
  });

  it("extracts --weight-display to display weight", () => {
    const result = extractFromCSS(
      [
        {
          path: "test.css",
          content: `:root {
            --font-display: "Playfair Display";
            --weight-display: 300;
          }`,
        },
      ],
      "test-theme",
    );
    expect(result.config.typography?.display?.weight).toBe(300);
  });
});

describe("display font — validation", () => {
  it("validates display weight between 100 and 900", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { display: { family: "Inter", weight: 1000 } },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.code === "INVALID_WEIGHT" && e.message.includes("display"),
      ),
    ).toBe(true);
  });

  it("validates display family is a non-empty string", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: { display: { family: "" } },
    } as unknown);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) =>
          e.code === "INVALID_FONT_FAMILY" && e.message.includes("display"),
      ),
    ).toBe(true);
  });

  it("accepts valid display font configuration", () => {
    const result = validate({
      name: "Test",
      version: 1,
      colors: { primary: "#2563EB" },
      typography: {
        heading: { family: "Inter", weight: 600 },
        display: { family: "Playfair Display", weight: 400 },
        body: { family: "Inter", weight: 400 },
      },
    });
    expect(result.valid).toBe(true);
  });
});
