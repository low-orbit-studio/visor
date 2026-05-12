/**
 * Tests for the `fontshare` source type in .visor.yaml typography (VI-359).
 *
 * Covers: source passthrough in resolveConfig, @import emission in
 * nextjsAdapter and docsAdapter, schema acceptance (no `org` required),
 * Fontshare CSS URL construction, weights aggregation when heading/body
 * share a family.
 */

import { describe, it, expect } from "vitest";
import { resolveConfig } from "../resolve.js";
import { validateConfig } from "../schema.js";
import { resolveThemeFonts } from "../fonts/pipeline.js";
import { buildFontshareCssUrl } from "../fonts/resolve.js";
import { generateThemeDataFromConfig } from "../pipeline.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { docsAdapter } from "../adapters/docs.js";
import type { VisorThemeConfig } from "../types.js";

const minimalConfig: VisorThemeConfig = {
  name: "Test",
  version: 1,
  colors: { primary: "#6BEBA5" },
};

describe("fontshare source — buildFontshareCssUrl", () => {
  it("builds the documented Fontshare API URL with sorted weights", () => {
    const url = buildFontshareCssUrl("Satoshi", [700, 400, 900], false, "swap");
    expect(url).toBe(
      "https://api.fontshare.com/v2/css?f[]=satoshi@400,700,900&display=swap",
    );
  });

  it("slugifies multi-word families to lowercase-hyphenated", () => {
    const url = buildFontshareCssUrl("Clash Display", [400, 700], false, "swap");
    expect(url).toBe(
      "https://api.fontshare.com/v2/css?f[]=clash-display@400,700&display=swap",
    );
  });

  it("prepends italic-weight tokens when italic=true", () => {
    const url = buildFontshareCssUrl("Satoshi", [400, 700], true, "swap");
    expect(url).toBe(
      "https://api.fontshare.com/v2/css?f[]=satoshi@400i,700i,400,700&display=swap",
    );
  });

  it("honors the font-display strategy in the URL", () => {
    const url = buildFontshareCssUrl("Satoshi", [400], false, "block");
    expect(url).toContain("&display=block");
  });
});

describe("fontshare source — resolveConfig passthrough", () => {
  it("preserves source for display, heading, and body slots", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Satoshi", weight: 900, source: "fontshare" },
        heading: { family: "Satoshi", weight: 700, source: "fontshare" },
        body: { family: "Satoshi", weight: 400, source: "fontshare" },
      },
    };
    const resolved = resolveConfig(config);
    expect(resolved.typography.display.source).toBe("fontshare");
    expect(resolved.typography.heading.source).toBe("fontshare");
    expect(resolved.typography.body.source).toBe("fontshare");
  });
});

describe("fontshare source — schema validation", () => {
  it("accepts fontshare source without requiring org", () => {
    const config = {
      name: "test",
      version: 1,
      colors: { primary: "#6BEBA5" },
      typography: {
        heading: { family: "Satoshi", weight: 700, source: "fontshare" },
        body: { family: "Satoshi", weight: 400, source: "fontshare" },
      },
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("fontshare source — resolveThemeFonts", () => {
  it("returns a cssUrl on the resolution and source=fontshare", () => {
    const fontResult = resolveThemeFonts({
      heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
      body: { family: "Satoshi", weight: 400, weights: [400, 700], source: "fontshare" },
    });
    expect(fontResult.heading?.source).toBe("fontshare");
    expect(fontResult.heading?.cssUrl).toMatch(
      /^https:\/\/api\.fontshare\.com\/v2\/css\?f\[\]=satoshi@/,
    );
  });

  it("merges heading + body weights into a single resolution when families match", () => {
    const fontResult = resolveThemeFonts({
      heading: { family: "Satoshi", weight: 700, source: "fontshare" },
      body: { family: "Satoshi", weight: 400, source: "fontshare" },
    });
    // Same family → single merged resolution covering both weights.
    expect(fontResult.heading).toBe(fontResult.body);
    expect(fontResult.heading?.weights.sort()).toEqual([400, 700]);
    expect(fontResult.heading?.cssUrl).toContain("400,700");
  });
});

describe("fontshare source — @import emission", () => {
  it("nextjsAdapter emits @import for fontshare heading + body", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
        body: { family: "Satoshi", weight: 400, weights: [400, 700], source: "fontshare" },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = nextjsAdapter(themeData);
    expect(css).toMatch(/@import url\("https:\/\/api\.fontshare\.com\/v2\/css\?f\[\]=satoshi@[0-9,]+&display=swap"\);/);
    // No per-theme aliasing for fontshare — the bare family name is what
    // Fontshare's hosted CSS publishes, so --font-* references it directly.
    expect(css).toMatch(/--font-heading:\s*Satoshi\b/);
    expect(css).not.toContain('Satoshi [test]');
  });

  it("docsAdapter emits @import for fontshare heading + body", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
        body: { family: "Satoshi", weight: 400, weights: [400, 700], source: "fontshare" },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = docsAdapter({
      primitives: themeData.primitives,
      tokens: themeData.tokens,
      config: themeData.config,
    });
    expect(css).toMatch(/@import url\("https:\/\/api\.fontshare\.com\/v2\/css\?f\[\]=satoshi@[0-9,]+&display=swap"\);/);
  });

  it("deduplicates @import URLs when heading and body resolve to the same URL", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
        body: { family: "Satoshi", weight: 400, weights: [400, 700], source: "fontshare" },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = nextjsAdapter(themeData);
    const matches = css.match(/@import url\("https:\/\/api\.fontshare\.com[^"]+"\);/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("coexists with google-fonts and visor-fonts in the same theme", () => {
    const config: VisorThemeConfig = {
      ...minimalConfig,
      typography: {
        display: { family: "Modern Society", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
        heading: { family: "Satoshi", weight: 700, weights: [400, 700], source: "fontshare" },
        body: { family: "Inter", weight: 400 },
      },
    };
    const themeData = generateThemeDataFromConfig(config);
    const css = nextjsAdapter(themeData);
    // Fontshare @import
    expect(css).toMatch(/@import url\("https:\/\/api\.fontshare\.com/);
    // Google Fonts @import (Inter is in the catalog)
    expect(css).toMatch(/@import url\("https:\/\/fonts\.googleapis\.com/);
    // Visor Fonts @font-face for Modern Society
    expect(css).toMatch(/fonts\.visor\.design\/low-orbit-studio\/modern-society\//);
  });
});
