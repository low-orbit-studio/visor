import { describe, it, expect } from "vitest";
import { validateFontCoverage, formatFontCoverageError } from "../validate-coverage.js";
import { docsAdapter } from "../../adapters/docs.js";
import { generateThemeData } from "../../pipeline.js";
import { resolveThemeFonts } from "../pipeline.js";

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

  it("treats Fontshare @import as coverage for the imported family", () => {
    const css = `
      @import url("https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap");

      .theme {
        --font-heading: "Satoshi", sans-serif;
        --font-body: Satoshi, sans-serif;
      }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("decodes hyphenated Fontshare slugs back to multi-word families", () => {
    const css = `
      @import url("https://api.fontshare.com/v2/css?f[]=clash-display@400,700&display=swap");
      .theme { --font-heading: "Clash Display", sans-serif; }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("treats Fontshare @import as coverage even when the URL uses %5B%5D encoding", () => {
    const css = `
      @import url("https://api.fontshare.com/v2/css?f%5B%5D=satoshi@400&display=swap");
      .theme { --font-heading: "Satoshi", sans-serif; }
    `;
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("flags a Satoshi declaration with no Fontshare @import (negative case)", () => {
    const css = `
      .theme { --font-heading: "Satoshi", sans-serif; }
    `;
    const result = validateFontCoverage(css);
    expect(result.errors.some((e) => e.family === "Satoshi")).toBe(true);
  });

  it("passes after the VI-359 fix via docsAdapter (source: fontshare)", () => {
    const yaml = `
name: blackout-fontshare
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  heading:
    family: Satoshi
    weight: 700
    source: fontshare
  body:
    family: Satoshi
    weight: 400
    source: fontshare
`;
    const data = generateThemeData(yaml);
    const css = docsAdapter({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
    const result = validateFontCoverage(css);
    expect(result.errors).toEqual([]);
    expect(css).toMatch(/@import url\("https:\/\/api\.fontshare\.com\/v2\/css\?f\[\]=satoshi@/);
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

describe("formatFontCoverageError", () => {
  it("appends the engine + CLI version requirement when the failing slot is mono", () => {
    const msg = formatFontCoverageError("blacklight-underground.visor.yaml", "--font-mono", "PP Model Mono");
    expect(msg).toContain("blacklight-underground.visor.yaml");
    expect(msg).toContain("--font-mono");
    expect(msg).toContain("PP Model Mono");
    expect(msg).toContain("typography.mono.source");
    expect(msg).toContain("@loworbitstudio/visor-theme-engine ≥ 0.5.0");
    expect(msg).toContain("@loworbitstudio/visor ≥ 0.10.0");
    expect(msg).toContain("CLI bundles its own engine copy");
  });

  it("omits the mono-specific version note for non-mono slots", () => {
    const msg = formatFontCoverageError("space.visor.yaml", "--font-heading", "Satoshi");
    expect(msg).toContain("--font-heading");
    expect(msg).toContain("Satoshi");
    expect(msg).toContain("typography.<slot>.source");
    expect(msg).not.toContain("@loworbitstudio/visor-theme-engine");
    expect(msg).not.toContain("CLI bundles its own engine copy");
  });
});

describe("VI-367 mono source/org inheritance", () => {
  function buildCss(yaml: string): string {
    const data = generateThemeData(yaml);
    return docsAdapter({
      primitives: data.primitives,
      tokens: data.tokens,
      config: data.config,
    });
  }

  it("inherits source/org from body when mono.family matches body.family and mono.source is unset", () => {
    const yaml = `
name: inherit-from-body
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  body:
    family: PP Model Mono
    weight: 400
    source: visor-fonts
    org: low-orbit-studio
  mono:
    family: PP Model Mono
    weight: 400
`;
    const css = buildCss(yaml);
    expect(validateFontCoverage(css).errors).toEqual([]);
    expect(css).toMatch(/@font-face\s*\{[^}]*font-family:\s*"PP Model Mono[^"]*"/);
  });

  it("inherits source/org from heading when mono.family matches heading.family", () => {
    const yaml = `
name: inherit-from-heading
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  heading:
    family: PP Model Plastic
    weight: 700
    source: visor-fonts
    org: low-orbit-studio
  body:
    family: Inter
    weight: 400
  mono:
    family: PP Model Plastic
    weight: 400
`;
    const css = buildCss(yaml);
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("inherits fontshare source from a matching slot (no org required)", () => {
    const yaml = `
name: inherit-fontshare
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  body:
    family: Satoshi
    weight: 400
    source: fontshare
  mono:
    family: Satoshi
    weight: 400
`;
    const css = buildCss(yaml);
    expect(validateFontCoverage(css).errors).toEqual([]);
  });

  it("does NOT inherit when mono.family is unique — still errors without explicit source", () => {
    const yaml = `
name: unique-mono
version: 1
group: Visor
colors:
  primary: "#666666"
  neutral: "#333333"
typography:
  body:
    family: Inter
    weight: 400
  mono:
    family: PP Model Mono
    weight: 400
`;
    const css = buildCss(yaml);
    const errors = validateFontCoverage(css).errors;
    expect(errors.some((e) => e.declaredAt === "--font-mono" && e.family === "PP Model Mono")).toBe(true);
  });

  it("does NOT override explicit mono.source even when family matches another slot", () => {
    const result = resolveThemeFonts({
      heading: { family: "PP Model Mono", weight: 700, source: "visor-fonts", org: "low-orbit-studio" },
      body: { family: "PP Model Mono", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
      mono: { family: "PP Model Mono", weight: 400, source: "fontshare" },
    });
    expect(result.mono?.source).toBe("fontshare");
  });

  it("matches family case-insensitively", () => {
    const result = resolveThemeFonts({
      body: { family: "PP Model Mono", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
      mono: { family: "pp model mono", weight: 400 },
    });
    expect(result.mono?.source).toBe("visor-fonts");
    expect(result.mono?.org).toBe("low-orbit-studio");
  });

  it("prefers heading over display over body when multiple slots match", () => {
    const result = resolveThemeFonts({
      heading: { family: "Inter", weight: 700, source: "google-fonts" },
      display: { family: "Inter", weight: 700, source: "fontshare" },
      body: { family: "Inter", weight: 400, source: "visor-fonts", org: "low-orbit-studio" },
      mono: { family: "Inter", weight: 400 },
    });
    expect(result.mono?.source).toBe("google-fonts");
  });
});
