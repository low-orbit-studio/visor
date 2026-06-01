/**
 * VI-493 — Brand pass-through tokens.
 *
 * Unrecognized `overrides` keys must emit as bare `--<key>` custom properties
 * inside @layer visor-brand, in both the nextjs and docs adapters, with
 * mode-specific values (light keys under the light selector, dark keys under
 * the dark toggle + prefers-color-scheme media query). Recognized semantic
 * tokens must remain unaffected.
 */

import { generateThemeData } from "../pipeline.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { docsAdapter } from "../adapters/docs.js";
import { generateBrandPassthroughCss } from "../adapters/brand-passthrough.js";
import type { AdapterInput } from "../adapters/types.js";

// Strata-style theme: 15 brand keys live in `overrides` and were previously
// dropped silently. Two modes, mode-specific values.
const STRATA_YAML = `
name: Strata
version: 1
colors:
  primary: "#2563EB"
overrides:
  light:
    strata-abyss: "#0a1a2f"
    strata-deep-tide: "#16324a"
    text-primary: "#101820"
  dark:
    strata-abyss: "#04101c"
    strata-deep-tide: "#0c2233"
    text-primary: "#f2f6fa"
`.trim();

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("nextjs adapter — brand pass-through", () => {
  const css = nextjsAdapter(makeInput(STRATA_YAML), {
    includeFontImports: false,
    includeFowt: false,
  });

  it("emits a visor-brand layer", () => {
    expect(css).toContain("@layer visor-brand {");
  });

  it("emits --strata-abyss inside @layer visor-brand with mode-specific values", () => {
    const start = css.indexOf("@layer visor-brand {");
    const end = css.indexOf("}", css.lastIndexOf("--strata"));
    const brandLayer = css.slice(start, end);
    expect(brandLayer).toContain("--strata-abyss: #0a1a2f;"); // light
    expect(brandLayer).toContain("--strata-abyss: #04101c;"); // dark
    expect(brandLayer).toContain("--strata-deep-tide: #16324a;"); // light
    expect(brandLayer).toContain("--strata-deep-tide: #0c2233;"); // dark
  });

  it("scopes light pass-through vars to :root and dark to the dark toggle selectors", () => {
    expect(css).toMatch(/:root\s*\{[^}]*--strata-abyss: #0a1a2f;/s);
    expect(css).toMatch(/\.dark[^{]*\{[^}]*--strata-abyss: #04101c;/s);
    expect(css).toContain("@media (prefers-color-scheme: dark)");
  });

  it("does NOT emit recognized semantic override keys into the brand layer", () => {
    const start = css.indexOf("@layer visor-brand {");
    const end = css.indexOf("@layer visor-adaptive {");
    const brandLayer = css.slice(start, end);
    // text-primary is a recognized semantic token → flows through visor-adaptive, not brand.
    expect(brandLayer).not.toContain("--text-primary");
  });

  it("recognized semantic override still reaches the adaptive layer", () => {
    expect(css).toContain("--text-primary: #101820;"); // light override applied
    expect(css).toContain("--text-primary: #f2f6fa;"); // dark override applied
  });

  it("omits the brand layer entirely when there are no pass-through tokens", () => {
    const plain = nextjsAdapter(
      makeInput('name: Plain\nversion: 1\ncolors:\n  primary: "#2563EB"'),
      { includeFontImports: false, includeFowt: false },
    );
    expect(plain).not.toContain("@layer visor-brand {");
  });
});

describe("docs adapter — brand pass-through", () => {
  const css = docsAdapter(makeInput(STRATA_YAML), { includeFontImports: false });

  it("appends pass-through vars into the existing visor-brand layer", () => {
    expect(css).toContain("@layer visor-brand {");
    expect(css).toContain("--strata-abyss: #0a1a2f;"); // light
    expect(css).toContain("--strata-abyss: #04101c;"); // dark
  });

  it("scopes pass-through vars to the theme class", () => {
    expect(css).toMatch(/html:not\(\.dark\) \.strata-theme\s*\{[^}]*--strata-abyss: #0a1a2f;/s);
    expect(css).toMatch(/\.dark \.strata-theme\s*\{[^}]*--strata-abyss: #04101c;/s);
  });

  it("does not leak recognized semantic keys into the brand layer", () => {
    const start = css.indexOf("@layer visor-brand {");
    // Scope to the brand layer only: from its opening to the next @layer block.
    const next = css.indexOf("@layer ", start + 1);
    const brandLayer = next === -1 ? css.slice(start) : css.slice(start, next);
    expect(brandLayer).not.toContain("--text-primary");
  });
});

describe("end-to-end via generateThemeData + nextjs adapter (strata)", () => {
  it("all strata-* keys survive to the brand layer in both modes", () => {
    const css = nextjsAdapter(makeInput(STRATA_YAML), {
      includeFontImports: false,
      includeFowt: false,
    });
    for (const value of ["#0a1a2f", "#04101c", "#16324a", "#0c2233"]) {
      expect(css).toContain(value);
    }
  });
});

describe("generateBrandPassthroughCss — fail-loud (D3)", () => {
  const ORIGINAL_ENV = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_ENV;
  });

  const selectors = {
    light: ":root",
    dark: ".dark",
    prefers: ":root:not(.light)",
  };

  it("returns empty string when there are no pass-through tokens", () => {
    expect(
      generateBrandPassthroughCss({ light: {}, dark: {} }, selectors),
    ).toBe("");
  });

  it("dev build: emits sentinel comment naming every pass-through token", () => {
    process.env.NODE_ENV = "development";
    const out = generateBrandPassthroughCss(
      { light: { "strata-abyss": "#0a1a2f" }, dark: { "strata-tide": "#0c2233" } },
      selectors,
    );
    expect(out).toContain("/* [visor-brand] 2 passthrough:");
    expect(out).toContain("--strata-abyss");
    expect(out).toContain("--strata-tide");
  });

  it("dev build: renders an unresolved (empty) value as bright sentinel color", () => {
    process.env.NODE_ENV = "development";
    const out = generateBrandPassthroughCss(
      { light: { "strata-missing": "   " }, dark: {} },
      selectors,
    );
    expect(out).toContain("--strata-missing: #ff00ff;");
    expect(out).toContain("UNRESOLVED");
  });

  it("production build: no sentinel comment", () => {
    process.env.NODE_ENV = "production";
    const out = generateBrandPassthroughCss(
      { light: { "strata-abyss": "#0a1a2f" }, dark: {} },
      selectors,
    );
    expect(out).not.toContain("passthrough:");
    expect(out).toContain("--strata-abyss: #0a1a2f;");
  });
});
