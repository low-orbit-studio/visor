import { describe, it, expect } from "vitest";
import { resolveFont } from "../resolve.js";

describe("resolveFont", () => {
  describe("Google Fonts resolution", () => {
    it("resolves a known Google Font to a CSS URL", () => {
      const result = resolveFont("Inter");

      expect(result.source).toBe("google-fonts");
      expect(result.family).toBe("Inter");
      expect(result.cssUrl).toContain("fonts.googleapis.com/css2");
      expect(result.cssUrl).toContain("family=Inter");
      expect(result.guidance).toBeNull();
    });

    it("uses canonical casing from the catalog", () => {
      const result = resolveFont("open sans");

      expect(result.family).toBe("Open Sans");
      expect(result.cssUrl).toContain("family=Open+Sans");
    });

    it("defaults to weights 400 and 700", () => {
      const result = resolveFont("Roboto");

      expect(result.weights).toEqual([400, 700]);
      expect(result.cssUrl).toContain("wght@400;700");
    });

    it("filters requested weights to those available", () => {
      // Abel only has weight 400
      const result = resolveFont("Abel", { weights: [400, 700] });

      expect(result.weights).toEqual([400]);
      expect(result.cssUrl).toContain("wght@400");
    });

    it("falls back to all available weights if none match", () => {
      // Abel only has 400, requesting 300 which doesn't exist
      const result = resolveFont("Abel", { weights: [300] });

      expect(result.weights).toEqual([400]);
    });

    it("applies font-display strategy", () => {
      const result = resolveFont("Inter", { display: "optional" });

      expect(result.display).toBe("optional");
      expect(result.cssUrl).toContain("display=optional");
    });

    it("defaults font-display to swap", () => {
      const result = resolveFont("Inter");

      expect(result.display).toBe("swap");
      expect(result.cssUrl).toContain("display=swap");
    });

    it("includes italic axis when requested and available", () => {
      const result = resolveFont("Inter", { italic: true });

      expect(result.italic).toBe(true);
      expect(result.cssUrl).toContain("ital,wght@");
      expect(result.cssUrl).toContain("0,400");
      expect(result.cssUrl).toContain("1,400");
    });

    it("does not include italic when unavailable", () => {
      // Oswald has no italic styles
      const result = resolveFont("Oswald", { italic: true });

      expect(result.italic).toBe(false);
      expect(result.cssUrl).not.toContain("ital");
    });

    it("handles custom weights", () => {
      const result = resolveFont("Inter", { weights: [300, 500, 800] });

      expect(result.weights).toEqual([300, 500, 800]);
      expect(result.cssUrl).toContain("wght@300;500;800");
    });

    it("preserves font category from catalog", () => {
      expect(resolveFont("Inter").category).toBe("sans-serif");
      expect(resolveFont("Playfair Display").category).toBe("serif");
      expect(resolveFont("Fira Code").category).toBe("monospace");
    });

    it("sorts weights in the CSS URL for API compliance", () => {
      const result = resolveFont("Inter", { weights: [700, 300, 500] });

      expect(result.cssUrl).toContain("wght@300;500;700");
    });
  });

  describe("visor-fonts resolution", () => {
    it("resolves visor-fonts source with org", () => {
      const result = resolveFont("PP Model Plastic", {
        source: "visor-fonts",
        org: "low-orbit",
      });

      expect(result.source).toBe("visor-fonts");
      expect(result.family).toBe("PP Model Plastic");
      expect(result.org).toBe("low-orbit");
      expect(result.cssUrl).toBeNull();
      expect(result.guidance).toBeNull();
    });

    it("preserves requested weights for visor-fonts", () => {
      const result = resolveFont("PP Model Plastic", {
        source: "visor-fonts",
        org: "low-orbit",
        weights: [300, 400, 700],
      });

      expect(result.weights).toEqual([300, 400, 700]);
    });

    it("skips Google Fonts lookup when source is visor-fonts", () => {
      // "Inter" is in Google Fonts, but explicit source should override
      const result = resolveFont("Inter", {
        source: "visor-fonts",
        org: "test-org",
      });

      expect(result.source).toBe("visor-fonts");
      expect(result.cssUrl).toBeNull();
    });

    it("defaults to sans-serif category for visor-fonts", () => {
      const result = resolveFont("CustomFont", {
        source: "visor-fonts",
        org: "test-org",
      });
      expect(result.category).toBe("sans-serif");
    });
  });

  describe("local font resolution", () => {
    it("flags unknown fonts as local", () => {
      const result = resolveFont("PP Model Plastic");

      expect(result.source).toBe("local");
      expect(result.cssUrl).toBeNull();
      expect(result.guidance).toBeTruthy();
      expect(result.guidance).toContain("not available on Google Fonts");
    });

    it("resolves explicit local source", () => {
      const result = resolveFont("CustomBrand", { source: "local" });

      expect(result.source).toBe("local");
      expect(result.guidance).toContain("local font");
    });

    it("preserves requested weights for local fonts", () => {
      const result = resolveFont("PitchSans", { weights: [400, 500, 700] });

      expect(result.weights).toEqual([400, 500, 700]);
    });

    it("includes setup instructions in guidance", () => {
      const result = resolveFont("CustomBrand");

      expect(result.guidance).toContain("public/fonts/");
      expect(result.guidance).toContain("@font-face");
    });

    it("defaults local fonts to sans-serif category", () => {
      const result = resolveFont("CustomBrand");
      expect(result.category).toBe("sans-serif");
    });

    it("accepts category override for local fonts", () => {
      const result = resolveFont("CustomSerif", { category: "serif" });
      expect(result.category).toBe("serif");
    });
  });
});
