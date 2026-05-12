import { describe, it, expect } from "vitest";
import { validateFontCoverage } from "../validate-coverage.js";
import { docsAdapter } from "../../adapters/docs.js";
import { generateThemeData } from "../../pipeline.js";

describe("validateFontCoverage", () => {
  it("returns no errors when every --font-* declaration has a matching @font-face", () => {
    const css = `
      @font-face {
        font-family: "Inter";
        src: url("/inter.woff2") format("woff2");
      }
      .theme {
        --font-heading: "Inter", "Inter Fallback", sans-serif;
        --font-body: "Inter", "Inter Fallback", sans-serif;
      }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("flags the VI-358 bug: --font-heading: Satoshi with no matching @font-face", () => {
    const css = `
      .blackout-theme {
        --font-heading: "Satoshi", "Satoshi Fallback", system-ui, sans-serif;
        --font-body: "Satoshi", "Satoshi Fallback", system-ui, sans-serif;
      }
    `;
    const result = validateFontCoverage(css);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
    expect(result.errors.some((e) => e.family === "Satoshi")).toBe(true);
  });

  it("does not count size-adjusted Fallback faces as real coverage", () => {
    const css = `
      @font-face {
        font-family: "Inter Fallback";
        src: local("Arial");
        size-adjust: 107%;
      }
      .theme {
        --font-heading: "Inter", "Inter Fallback", sans-serif;
      }
    `;
    const result = validateFontCoverage(css);
    expect(result.errors).toEqual([
      { family: "Inter", declaredAt: "--font-heading" },
    ]);
  });

  it("ignores --font-* declarations that name only system fonts (no quoted primary)", () => {
    const css = `
      .neutral-theme {
        --font-heading: system-ui, -apple-system, sans-serif;
        --font-body: system-ui, sans-serif;
        --font-mono: ui-monospace, monospace;
      }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("deduplicates errors per slot+family pairing", () => {
    const css = `
      .theme {
        --font-heading: "Satoshi", sans-serif;
        --font-body: "Satoshi", sans-serif;
        --font-display: "Satoshi", sans-serif;
      }
    `;
    const result = validateFontCoverage(css);
    expect(result.errors.length).toBe(3);
    expect(new Set(result.errors.map((e) => e.declaredAt))).toEqual(
      new Set(["--font-heading", "--font-body", "--font-display"]),
    );
  });

  it("reproduces the VI-358 bug end-to-end via docsAdapter (source: local)", () => {
    const yaml = `
name: blackout-test
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  heading:
    family: Satoshi
    weight: 700
    source: local
  body:
    family: Satoshi
    weight: 400
    source: local
`;
    const data = generateThemeData(yaml);
    const css = docsAdapter({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    const result = validateFontCoverage(css);
    expect(result.errors.some((e) => e.family === "Satoshi")).toBe(true);
  });

  it("treats Google Fonts @import as coverage for the imported family", () => {
    const css = `
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap");

      .theme {
        --font-heading: "Inter", sans-serif;
        --font-body: Inter, sans-serif;
      }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("handles multi-word Google Fonts families (plus-encoded URLs)", () => {
    const css = `
      @import url("https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400&display=swap");
      .theme { --font-mono: "Source Code Pro", monospace; }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("passes after the VI-358 fix via docsAdapter (source: visor-fonts)", () => {
    const yaml = `
name: blackout-fixed
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  heading:
    family: Satoshi
    weight: 700
    source: visor-fonts
    org: low-orbit-studio
  body:
    family: Satoshi
    weight: 400
    source: visor-fonts
    org: low-orbit-studio
`;
    const data = generateThemeData(yaml);
    const css = docsAdapter({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    const result = validateFontCoverage(css);
    expect(result.errors).toEqual([]);
  });
});
