/**
 * Per-theme CDN routing for visor-fonts (VI-445).
 *
 * Themes can declare `typography.cdn-overrides.visor-fonts` to route
 * `source: visor-fonts` URLs to their own bucket — required for
 * EULA-scoped licensed fonts (Hoefler Gotham → fonts.knowmentum.ai).
 * The override applies to every visor-fonts slot, can drop the per-slot
 * org segment, and surfaces in @font-face declarations + preconnect hints.
 *
 * Default-path tests stay in visor-fonts-source.test.ts; this file focuses
 * on the override path and regression coverage that themes without an
 * override keep resolving to fonts.visor.design.
 */

import { describe, it, expect } from "vitest";
import { resolveFont, buildVisorFontUrl } from "../resolve.js";
import { resolveThemeFonts } from "../pipeline.js";
import { generatePreloadLinks } from "../preload.js";
import { validateConfig } from "../../schema.js";
import { nextjsAdapter } from "../../adapters/nextjs.js";
import { generateThemeDataFromConfig } from "../../pipeline.js";
import type { VisorThemeConfig } from "../../types.js";
import type { VisorTypography } from "../types.js";

const minimalColors: VisorThemeConfig["colors"] = { primary: "#6BEBA5" };

describe("buildVisorFontUrl — cdnBase override", () => {
  it("uses cdnBase argument instead of the default fonts.visor.design", () => {
    const url = buildVisorFontUrl(
      "low-orbit-studio",
      "Gotham",
      400,
      "https://fonts.knowmentum.ai",
    );
    expect(url).toBe(
      "https://fonts.knowmentum.ai/low-orbit-studio/gotham/Gotham-Book.woff2",
    );
  });

  it("drops the org path segment when org is empty", () => {
    const url = buildVisorFontUrl(
      "",
      "Gotham",
      400,
      "https://fonts.knowmentum.ai",
    );
    expect(url).toBe(
      "https://fonts.knowmentum.ai/gotham/Gotham-Book.woff2",
    );
  });

  it("falls back to fonts.visor.design when cdnBase is null/undefined", () => {
    expect(
      buildVisorFontUrl("low-orbit-studio", "Inter", 400, null),
    ).toBe("https://fonts.visor.design/low-orbit-studio/inter/Inter-Regular.woff2");
    expect(
      buildVisorFontUrl("low-orbit-studio", "Inter", 400),
    ).toBe("https://fonts.visor.design/low-orbit-studio/inter/Inter-Regular.woff2");
  });
});

describe("resolveFont — cdnBase propagation", () => {
  it("attaches cdnBase to visor-fonts resolutions", () => {
    const resolution = resolveFont("Gotham", {
      source: "visor-fonts",
      org: "low-orbit-studio",
      cdnBase: "https://fonts.knowmentum.ai",
      weights: [400],
    });
    expect(resolution.source).toBe("visor-fonts");
    expect(resolution.cdnBase).toBe("https://fonts.knowmentum.ai");
    expect(resolution.org).toBe("low-orbit-studio");
  });

  it("leaves cdnBase null on non-visor-fonts resolutions", () => {
    const google = resolveFont("Inter", { weights: [400] });
    expect(google.source).toBe("google-fonts");
    expect(google.cdnBase).toBeNull();

    const local = resolveFont("LocalOnly", { source: "local" });
    expect(local.cdnBase).toBeNull();
  });
});

describe("resolveThemeFonts — typography.cdn-overrides.visor-fonts", () => {
  it("threads the override CDN through to @font-face URLs (Knowmentum case)", () => {
    const typography: VisorTypography = {
      "cdn-overrides": {
        "visor-fonts": "https://fonts.knowmentum.ai",
      },
      display: {
        family: "Gotham",
        weight: 400,
        weights: [300, 400, 500],
        source: "visor-fonts",
        org: "",
      },
      heading: {
        family: "Gotham",
        weight: 400,
        weights: [300, 400, 500],
        source: "visor-fonts",
        org: "",
      },
      body: {
        family: "Gotham",
        weight: 400,
        weights: [300, 400, 500],
        source: "visor-fonts",
        org: "",
      },
    };

    const result = resolveThemeFonts(typography);

    expect(result.heading?.cdnBase).toBe("https://fonts.knowmentum.ai");
    expect(result.display?.cdnBase).toBe("https://fonts.knowmentum.ai");
    expect(result.body?.cdnBase).toBe("https://fonts.knowmentum.ai");

    expect(result.css).toContain(
      "https://fonts.knowmentum.ai/gotham/Gotham-Book.woff2",
    );
    expect(result.css).toContain(
      "https://fonts.knowmentum.ai/gotham/Gotham-Light.woff2",
    );
    expect(result.css).toContain(
      "https://fonts.knowmentum.ai/gotham/Gotham-Medium.woff2",
    );
    // Belt-and-suspenders: the default CDN must not appear when an override
    // is in play (no accidental dual-host serving).
    expect(result.css).not.toContain("fonts.visor.design");
  });

  it("default path: themes without an override still resolve to fonts.visor.design", () => {
    const typography: VisorTypography = {
      display: {
        family: "Modern Society",
        weight: 400,
        source: "visor-fonts",
        org: "low-orbit-studio",
      },
    };

    const result = resolveThemeFonts(typography);

    expect(result.display?.cdnBase).toBeNull();
    expect(result.css).toContain(
      "https://fonts.visor.design/low-orbit-studio/modern-society/ModernSociety-Regular.woff2",
    );
    expect(result.css).not.toContain("fonts.knowmentum.ai");
  });
});

describe("generatePreloadLinks — cdn-overrides", () => {
  it("preconnects to the override CDN, not the default, when override is in play", () => {
    const typography: VisorTypography = {
      "cdn-overrides": {
        "visor-fonts": "https://fonts.knowmentum.ai",
      },
      display: {
        family: "Gotham",
        weight: 400,
        weights: [400],
        source: "visor-fonts",
        org: "",
      },
    };
    const result = resolveThemeFonts(typography);
    const links = generatePreloadLinks(
      [result.display, result.heading, result.body, result.mono].filter(
        (r): r is NonNullable<typeof r> => r !== null,
      ),
    );

    expect(
      links.some((l) => l.includes('preconnect" href="https://fonts.knowmentum.ai"')),
    ).toBe(true);
    expect(
      links.some((l) => l.includes('preconnect" href="https://fonts.visor.design"')),
    ).toBe(false);
    expect(
      links.some((l) =>
        l.includes(
          'preload" as="font" type="font/woff2" href="https://fonts.knowmentum.ai/gotham/Gotham-Book.woff2"',
        ),
      ),
    ).toBe(true);
  });
});

describe("validateConfig — cdn-overrides", () => {
  it("accepts a valid cdn-overrides.visor-fonts URL", () => {
    const config = {
      name: "knowmentum",
      version: 1,
      colors: minimalColors,
      typography: {
        "cdn-overrides": { "visor-fonts": "https://fonts.knowmentum.ai" },
        display: { family: "Gotham", weight: 400, source: "visor-fonts", org: "" },
      },
    };
    const result = validateConfig(config);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("relaxes the org requirement for visor-fonts slots when override is set", () => {
    const config = {
      name: "knowmentum",
      version: 1,
      colors: minimalColors,
      typography: {
        "cdn-overrides": { "visor-fonts": "https://fonts.knowmentum.ai" },
        display: { family: "Gotham", weight: 400, source: "visor-fonts" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
  });

  it("still requires org when no override is set", () => {
    const config = {
      name: "test",
      version: 1,
      colors: minimalColors,
      typography: {
        display: { family: "Modern Society", weight: 400, source: "visor-fonts" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.includes("typography.display.org") && e.includes("required"),
      ),
    ).toBe(true);
  });

  it("rejects an empty-string override URL", () => {
    const config = {
      name: "test",
      version: 1,
      colors: minimalColors,
      typography: {
        "cdn-overrides": { "visor-fonts": "" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes("typography.cdn-overrides.visor-fonts") &&
        e.includes("not be empty"),
      ),
    ).toBe(true);
  });

  it("rejects unknown keys under cdn-overrides", () => {
    const config = {
      name: "test",
      version: 1,
      colors: minimalColors,
      typography: {
        "cdn-overrides": { "google-fonts": "https://example.com" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes("typography.cdn-overrides.google-fonts"),
      ),
    ).toBe(true);
  });
});

describe("nextjsAdapter — cdn-overrides end-to-end", () => {
  it("emits @font-face src pointing at the override CDN", () => {
    const config: VisorThemeConfig = {
      name: "knowmentum-test",
      version: 1,
      colors: minimalColors,
      typography: {
        "cdn-overrides": { "visor-fonts": "https://fonts.knowmentum.ai" },
        display: {
          family: "Gotham",
          weight: 400,
          weights: [400],
          source: "visor-fonts",
          org: "",
        },
        heading: {
          family: "Gotham",
          weight: 400,
          weights: [400],
          source: "visor-fonts",
          org: "",
        },
        body: {
          family: "Gotham",
          weight: 400,
          weights: [400],
          source: "visor-fonts",
          org: "",
        },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = nextjsAdapter(themeData);

    expect(css).toContain(
      'src: url("https://fonts.knowmentum.ai/gotham/Gotham-Book.woff2")',
    );
    expect(css).not.toContain("fonts.visor.design");
  });
});
