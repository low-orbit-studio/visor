import { describe, it, expect } from "vitest";
import { generatePreloadLinks, generateStylesheetLinks } from "../preload.js";
import type { FontResolution } from "../types.js";

function makeGoogleFont(
  family: string,
  cssUrl: string
): FontResolution {
  return {
    family,
    source: "google-fonts",
    cssUrl,
    weights: [400, 700],
    italic: false,
    display: "swap",
    category: "sans-serif",
    guidance: null,
    org: null,
  };
}

function makeLocalFont(family: string): FontResolution {
  return {
    family,
    source: "local",
    cssUrl: null,
    weights: [400, 700],
    italic: false,
    display: "swap",
    category: "sans-serif",
    guidance: `"${family}" is not available on Google Fonts.`,
    org: null,
  };
}

function makeVisorFont(family: string, org: string, weights: number[] = [400, 700]): FontResolution {
  return {
    family,
    source: "visor-fonts",
    cssUrl: null,
    weights,
    italic: false,
    display: "swap",
    category: "sans-serif",
    guidance: null,
    org,
  };
}

describe("generatePreloadLinks", () => {
  it("generates preconnect links for Google Fonts", () => {
    const links = generatePreloadLinks([
      makeGoogleFont("Inter", "https://fonts.googleapis.com/css2?family=Inter"),
    ]);

    expect(links).toContainEqual(
      expect.stringContaining('rel="preconnect" href="https://fonts.googleapis.com"')
    );
    expect(links).toContainEqual(
      expect.stringContaining('rel="preconnect" href="https://fonts.gstatic.com" crossorigin')
    );
  });

  it("generates preload for Google Fonts CSS URL", () => {
    const cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";
    const links = generatePreloadLinks([makeGoogleFont("Inter", cssUrl)]);

    expect(links).toContainEqual(
      expect.stringContaining(`rel="preload" as="style" href="${cssUrl}"`)
    );
  });

  it("deduplicates preconnect links for multiple Google Fonts", () => {
    const links = generatePreloadLinks([
      makeGoogleFont("Inter", "https://fonts.googleapis.com/css2?family=Inter"),
      makeGoogleFont("Roboto", "https://fonts.googleapis.com/css2?family=Roboto"),
    ]);

    const preconnectLinks = links.filter((l) => l.includes("preconnect"));
    expect(preconnectLinks).toHaveLength(2); // One for each origin
  });

  it("generates preload links for custom font files", () => {
    const customPaths = new Map([
      ["PitchSans", ["/fonts/pitch-sans-regular.woff2", "/fonts/pitch-sans-bold.woff2"]],
    ]);

    const links = generatePreloadLinks(
      [makeLocalFont("PitchSans")],
      customPaths
    );

    expect(links).toContainEqual(
      expect.stringContaining('rel="preload" as="font" type="font/woff2" href="/fonts/pitch-sans-regular.woff2"')
    );
    expect(links).toContainEqual(
      expect.stringContaining('rel="preload" as="font" type="font/woff2" href="/fonts/pitch-sans-bold.woff2"')
    );
  });

  it("returns empty array for empty input", () => {
    const links = generatePreloadLinks([]);
    expect(links).toEqual([]);
  });

  it("skips preconnect when no Google Fonts present", () => {
    const links = generatePreloadLinks([makeLocalFont("Custom")]);

    expect(links.some((l) => l.includes("googleapis.com"))).toBe(false);
  });

  it("generates preconnect for Visor Fonts CDN", () => {
    const links = generatePreloadLinks([
      makeVisorFont("PP Model Plastic", "low-orbit"),
    ]);

    expect(links).toContainEqual(
      expect.stringContaining('rel="preconnect" href="https://fonts.visor.design"')
    );
  });

  it("generates preload links for Visor Fonts woff2 files", () => {
    const links = generatePreloadLinks([
      makeVisorFont("PP Model Plastic", "low-orbit", [400, 700]),
    ]);

    expect(links).toContainEqual(
      expect.stringContaining("fonts.visor.design/low-orbit/pp-model-plastic/PPModelPlastic-Regular.woff2")
    );
    expect(links).toContainEqual(
      expect.stringContaining("fonts.visor.design/low-orbit/pp-model-plastic/PPModelPlastic-Bold.woff2")
    );
  });

  it("deduplicates preconnect for multiple Visor Fonts", () => {
    const links = generatePreloadLinks([
      makeVisorFont("PP Model Plastic", "low-orbit", [400]),
      makeVisorFont("PP Model Mono", "low-orbit", [400]),
    ]);

    const preconnectLinks = links.filter((l) => l.includes("fonts.visor.design") && l.includes("preconnect"));
    expect(preconnectLinks).toHaveLength(1);
  });
});

describe("generateStylesheetLinks", () => {
  it("generates stylesheet links for Google Fonts", () => {
    const cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap";
    const links = generateStylesheetLinks([makeGoogleFont("Inter", cssUrl)]);

    expect(links).toHaveLength(1);
    expect(links[0]).toContain('rel="stylesheet"');
    expect(links[0]).toContain(cssUrl);
  });

  it("skips custom fonts", () => {
    const links = generateStylesheetLinks([makeLocalFont("Custom")]);
    expect(links).toHaveLength(0);
  });
});
