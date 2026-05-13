/**
 * Tests for the font weight-name alias registry (VI-352).
 *
 * Covers:
 *   - lookupFontWeightAlias direct lookups for aliased + unaliased families
 *   - buildVisorFontUrl uses aliases when present and falls back to standard
 *     WEIGHT_NAMES otherwise, with no regression for Google-Fonts-style families
 */

import { describe, it, expect } from "vitest";
import { buildVisorFontUrl } from "../resolve.js";
import { FONT_WEIGHT_ALIASES, lookupFontWeightAlias } from "../font-aliases.js";

describe("lookupFontWeightAlias", () => {
  it("returns the aliased PostScript suffix for an aliased family + weight", () => {
    expect(lookupFontWeightAlias("PP Model Mono", 400)).toBe("Book");
    expect(lookupFontWeightAlias("PP Model Mono", 800)).toBe("Super");
    expect(lookupFontWeightAlias("PP Model Sans", 400)).toBe("Book");
    expect(lookupFontWeightAlias("PP Model Sans", 800)).toBe("Super");
    expect(lookupFontWeightAlias("PP Model Plastic", 400)).toBe("Book");
    expect(lookupFontWeightAlias("PP Model Plastic", 800)).toBe("Super");
  });

  it("returns null for an unaliased family", () => {
    expect(lookupFontWeightAlias("Inter", 400)).toBeNull();
    expect(lookupFontWeightAlias("Outfit", 700)).toBeNull();
  });

  it("returns null for an aliased family at an unaliased weight", () => {
    // PP Model Mono only overrides 400 and 800 — 500 should fall through.
    expect(lookupFontWeightAlias("PP Model Mono", 500)).toBeNull();
    expect(lookupFontWeightAlias("PP Model Mono", 700)).toBeNull();
  });

  it("seeds the registry with all three PP Model families (VI-373)", () => {
    expect(FONT_WEIGHT_ALIASES["PP Model Mono"]).toEqual({
      400: "Book",
      800: "Super",
    });
    expect(FONT_WEIGHT_ALIASES["PP Model Sans"]).toEqual({
      400: "Book",
      800: "Super",
    });
    expect(FONT_WEIGHT_ALIASES["PP Model Plastic"]).toEqual({
      400: "Book",
      800: "Super",
    });
  });
});

describe("buildVisorFontUrl — alias resolution", () => {
  it("uses the alias for PP Model Mono weight 400 (Book, not Regular)", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Mono", 400);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-mono/PPModelMono-Book.woff2"
    );
  });

  it("uses the alias for PP Model Mono weight 800 (Super, not ExtraBold)", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Mono", 800);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-mono/PPModelMono-Super.woff2"
    );
  });

  it("uses the alias for PP Model Sans weight 400 (Book, not Regular)", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Sans", 400);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-sans/PPModelSans-Book.woff2"
    );
  });

  it("uses the alias for PP Model Sans weight 800 (Super, not ExtraBold)", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Sans", 800);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-sans/PPModelSans-Super.woff2"
    );
  });

  it("uses the alias for PP Model Plastic weight 400 (Book)", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Plastic", 400);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-plastic/PPModelPlastic-Book.woff2"
    );
  });

  it("uses the alias for PP Model Plastic weight 800 (Super)", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Plastic", 800);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-plastic/PPModelPlastic-Super.woff2"
    );
  });

  it("falls back to WEIGHT_NAMES at an unaliased weight on an aliased family", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "PP Model Mono", 500);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/pp-model-mono/PPModelMono-Medium.woff2"
    );
  });
});

describe("buildVisorFontUrl — no regression for unaliased families", () => {
  it("still maps Inter weight 400 to Regular", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "Inter", 400);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/inter/Inter-Regular.woff2"
    );
  });

  it("still maps Modern Society weight 400 to Regular", () => {
    const url = buildVisorFontUrl(
      "low-orbit-studio",
      "Modern Society",
      400
    );
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/modern-society/ModernSociety-Regular.woff2"
    );
  });

  it("still maps Outfit weight 700 to Bold", () => {
    const url = buildVisorFontUrl("low-orbit-studio", "Outfit", 700);
    expect(url).toBe(
      "https://fonts.visor.design/low-orbit-studio/outfit/Outfit-Bold.woff2"
    );
  });
});
