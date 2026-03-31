import { describe, it, expect } from "vitest";
import { resolveThemeFonts } from "../pipeline.js";
import type { VisorTypography } from "../types.js";

describe("resolveThemeFonts", () => {
  it("resolves a complete typography config with Google Fonts", () => {
    const typography: VisorTypography = {
      heading: { family: "Playfair Display", weight: 700 },
      body: { family: "Inter", weight: 400 },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading).not.toBeNull();
    expect(result.heading!.source).toBe("google-fonts");
    expect(result.heading!.family).toBe("Playfair Display");

    expect(result.body).not.toBeNull();
    expect(result.body!.source).toBe("google-fonts");
    expect(result.body!.family).toBe("Inter");

    expect(result.warnings).toHaveLength(0);
  });

  it("generates preload links for Google Fonts", () => {
    const typography: VisorTypography = {
      heading: { family: "Poppins" },
      body: { family: "Roboto" },
    };

    const result = resolveThemeFonts(typography);

    expect(result.preloadLinks.length).toBeGreaterThan(0);
    expect(result.preloadLinks.some((l) => l.includes("preconnect"))).toBe(
      true
    );
    expect(result.preloadLinks.some((l) => l.includes("Poppins"))).toBe(true);
    expect(result.preloadLinks.some((l) => l.includes("Roboto"))).toBe(true);
  });

  it("generates CSS custom property overrides", () => {
    const typography: VisorTypography = {
      heading: { family: "Montserrat", weight: 700 },
      body: { family: "Open Sans", weight: 400 },
    };

    const result = resolveThemeFonts(typography);

    expect(result.css).toContain("--font-heading");
    expect(result.css).toContain("Montserrat");
    expect(result.css).toContain("--font-body");
    expect(result.css).toContain("Open Sans");
    expect(result.css).toContain("--weight-heading: 700");
    expect(result.css).toContain("--weight-body: 400");
  });

  it("warns for local/commercial fonts", () => {
    const typography: VisorTypography = {
      heading: { family: "PP Model Plastic", weight: 500 },
      body: { family: "PP Model Mono", weight: 300 },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading!.source).toBe("local");
    expect(result.body!.source).toBe("local");
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0]).toContain("PP Model Plastic");
    expect(result.warnings[1]).toContain("PP Model Mono");
  });

  it("handles mixed Google + local fonts", () => {
    const typography: VisorTypography = {
      heading: { family: "PP Model Plastic" },
      body: { family: "Inter" },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading!.source).toBe("local");
    expect(result.body!.source).toBe("google-fonts");
    expect(result.warnings).toHaveLength(1);
    expect(result.preloadLinks.some((l) => l.includes("Inter"))).toBe(true);
  });

  it("resolves visor-fonts with CDN @font-face blocks", () => {
    const typography: VisorTypography = {
      heading: {
        family: "PP Model Plastic",
        weight: 500,
        source: "visor-fonts",
        org: "low-orbit",
      },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading!.source).toBe("visor-fonts");
    expect(result.heading!.org).toBe("low-orbit");
    expect(result.warnings).toHaveLength(0);
    expect(result.css).toContain("@font-face {");
    expect(result.css).toContain("fonts.visor.design/low-orbit/pp-model-plastic/");
    expect(result.css).toContain('font-family: "PP Model Plastic"');
  });

  it("generates correct CDN URLs for visor-fonts weights", () => {
    const typography: VisorTypography = {
      heading: {
        family: "PP Model Plastic",
        weight: 700,
        source: "visor-fonts",
        org: "low-orbit",
      },
    };

    const result = resolveThemeFonts(typography);

    expect(result.css).toContain("PPModelPlastic-Bold.woff2");
  });

  it("handles mixed visor-fonts + Google Fonts", () => {
    const typography: VisorTypography = {
      heading: {
        family: "PP Model Plastic",
        weight: 500,
        source: "visor-fonts",
        org: "low-orbit",
      },
      body: { family: "Inter", weight: 400 },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading!.source).toBe("visor-fonts");
    expect(result.body!.source).toBe("google-fonts");
    expect(result.warnings).toHaveLength(0);
    expect(result.css).toContain("fonts.visor.design");
    expect(result.css).toContain("--font-heading");
    expect(result.css).toContain("--font-body");
  });

  it("handles typography with only heading font", () => {
    const typography: VisorTypography = {
      heading: { family: "Lato" },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading).not.toBeNull();
    expect(result.body).toBeNull();
    expect(result.css).toContain("--font-heading");
    expect(result.css).not.toContain("--font-body");
  });

  it("handles empty typography", () => {
    const result = resolveThemeFonts({});

    expect(result.heading).toBeNull();
    expect(result.body).toBeNull();
    expect(result.preloadLinks).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("merges weights when heading and body use same font", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter", weight: 700 },
      body: { family: "Inter", weight: 300 },
    };

    const result = resolveThemeFonts(typography);

    // Both should point to the same merged resolution
    expect(result.heading).toBe(result.body);

    // Merged weights should include heading (700) + body (300, 400, 700)
    expect(result.heading!.weights).toContain(300);
    expect(result.heading!.weights).toContain(400);
    expect(result.heading!.weights).toContain(700);

    // CSS URL should have all weights
    expect(result.heading!.cssUrl).toContain("300");
    expect(result.heading!.cssUrl).toContain("400");
    expect(result.heading!.cssUrl).toContain("700");

    // Only one set of preload links
    const interLinks = result.preloadLinks.filter((l) => l.includes("Inter"));
    expect(interLinks).toHaveLength(2);
  });

  it("applies custom font-display strategy", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter" },
    };

    const result = resolveThemeFonts(typography, { display: "optional" });

    expect(result.heading!.display).toBe("optional");
    expect(result.heading!.cssUrl).toContain("display=optional");
  });

  it("generates @font-face placeholder for custom fonts in CSS", () => {
    const typography: VisorTypography = {
      heading: { family: "CustomBrand" },
    };

    const result = resolveThemeFonts(typography);

    expect(result.css).toContain("@font-face");
    expect(result.css).toContain("CustomBrand");
  });

  it("generates size-adjusted fallback @font-face for FOUC prevention", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter" },
      body: { family: "Roboto" },
    };

    const result = resolveThemeFonts(typography);

    expect(result.css).toContain('font-family: "Inter Fallback"');
    expect(result.css).toContain('font-family: "Roboto Fallback"');
    expect(result.css).toContain("size-adjust:");
    expect(result.css).toContain("ascent-override:");
  });

  it("includes size-adjusted fallback in font stack", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter" },
      body: { family: "Roboto" },
    };

    const result = resolveThemeFonts(typography);

    expect(result.css).toContain('"Inter Fallback"');
    expect(result.css).toContain('"Roboto Fallback"');
  });

  it("uses category-appropriate fallback stacks", () => {
    const typography: VisorTypography = {
      heading: { family: "Playfair Display" },
      body: { family: "Source Code Pro" },
    };

    const result = resolveThemeFonts(typography);

    // Serif heading → Georgia-based fallback
    expect(result.css).toContain("Georgia");
    // Monospace body → monospace fallback
    expect(result.css).toContain("monospace");
  });

  it("deduplicates fallback @font-face when heading and body share a font", () => {
    const typography: VisorTypography = {
      heading: { family: "Inter", weight: 700 },
      body: { family: "Inter", weight: 400 },
    };

    const result = resolveThemeFonts(typography);

    const matches = result.css.match(/font-family: "Inter Fallback"/g);
    expect(matches).toHaveLength(1);
  });
});
