/**
 * Tests for visor-fonts CDN source support in .visor.yaml typography (VI-115).
 *
 * Covers: source/org passthrough in resolveConfig, @font-face output in nextjsAdapter,
 * and validation of source/org keys.
 */

import { describe, it, expect } from "vitest";
import { resolveConfig } from "../resolve.js";
import { validateConfig } from "../schema.js";
import { resolveThemeFonts } from "../fonts/pipeline.js";
import { generateThemeDataFromConfig } from "../pipeline.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import type { VisorThemeConfig } from "../types.js";

const minimalConfig: VisorThemeConfig = {
  name: "Test",
  version: 1,
  colors: { primary: "#6BEBA5" },
};

describe("visor-fonts source — resolveConfig passthrough", () => {
  it("preserves source and org for display font", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Modern Society", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
        heading: { family: "Outfit", weight: 700 },
        body: { family: "Outfit", weight: 400 },
      },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.display.source).toBe("visor-fonts");
    expect(resolved.typography.display.org).toBe("low-orbit-studio");
    expect(resolved.typography.display.family).toBe("Modern Society");
  });

  it("preserves source and org for heading font", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Custom Heading", weight: 700, source: "visor-fonts", org: "my-org" },
      },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.heading.source).toBe("visor-fonts");
    expect(resolved.typography.heading.org).toBe("my-org");
  });

  it("leaves source undefined when not specified", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: { heading: { family: "Inter", weight: 600 } },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.heading.source).toBeUndefined();
    expect(resolved.typography.heading.org).toBeUndefined();
  });
});

describe("visor-fonts source — schema validation", () => {
  it("accepts source and org keys for typography fonts", () => {
    const config = {
      name: "entr",
      version: 1,
      colors: { primary: "#6BEBA5" },
      typography: {
        display: { family: "Modern Society", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
        heading: { family: "Outfit", weight: 700 },
        body: { family: "Outfit", weight: 400 },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects unknown keys in typography font objects", () => {
    const config = {
      name: "test",
      version: 1,
      colors: { primary: "#6BEBA5" },
      typography: {
        heading: { family: "Outfit", weight: 700, unknownKey: "value" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("unknownKey"))).toBe(true);
  });

  it("requires org when source is visor-fonts", () => {
    const config = {
      name: "test",
      version: 1,
      colors: { primary: "#6BEBA5" },
      typography: {
        display: { family: "Modern Society", weight: 400, source: "visor-fonts" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("typography.display.org") && e.includes("required"))).toBe(true);
  });
});

describe("visor-fonts source — @font-face generation", () => {
  it("generates @font-face for display font with visor-fonts source", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Modern Society", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
        heading: { family: "Outfit", weight: 700 },
        body: { family: "Outfit", weight: 400 },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = nextjsAdapter(themeData);
    expect(css).toContain("@font-face");
    expect(css).toContain('font-family: "Modern Society"');
    expect(css).toContain("fonts.visor.design/low-orbit-studio/modern-society/ModernSociety-Regular.woff2");
  });

  it("generates correct CDN URL for visor-fonts display font", () => {
    const typography = {
      display: { family: "Modern Society", weight: 400, source: "visor-fonts" as const, org: "low-orbit-studio" },
      heading: { family: "Outfit", weight: 700 },
      body: { family: "Outfit", weight: 400 },
    };
    const fontResult = resolveThemeFonts(typography);
    expect(fontResult.display?.source).toBe("visor-fonts");
    expect(fontResult.css).toContain(
      "https://fonts.visor.design/low-orbit-studio/modern-society/ModernSociety-Regular.woff2"
    );
  });
});
