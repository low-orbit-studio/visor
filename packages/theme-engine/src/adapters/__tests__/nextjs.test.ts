import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateThemeData } from "../../pipeline.js";
import { nextjsAdapter } from "../nextjs.js";
import type { AdapterInput } from "../types.js";

const MINIMAL_YAML = readFileSync(
  resolve(__dirname, "../../__tests__/fixtures/minimal.visor.yaml"),
  "utf-8",
);

const FULL_YAML = readFileSync(
  resolve(__dirname, "../../__tests__/fixtures/full.visor.yaml"),
  "utf-8",
);

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("nextjsAdapter", () => {
  it("outputs @layer order declaration", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain(
      "@layer visor-primitives, visor-semantic, visor-adaptive, visor-bridge;",
    );
  });

  it("wraps primitives in @layer visor-primitives", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("@layer visor-primitives {");
  });

  it("wraps adaptive tokens in @layer visor-adaptive", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("@layer visor-adaptive {");
  });

  it("includes .dark selector for dark mode", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain(".dark");
  });

  it("includes prefers-color-scheme media query", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("prefers-color-scheme: dark");
  });

  it("includes all semantic token categories", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("--text-primary:");
    expect(css).toContain("--surface-page:");
    expect(css).toContain("--border-default:");
    expect(css).toContain("--interactive-primary-bg:");
  });

  it("includes Google Fonts @import for non-system fonts", () => {
    const css = nextjsAdapter(makeInput(FULL_YAML));
    expect(css).toContain("@import url(");
    expect(css).toContain("fonts.googleapis.com");
  });

  it("includes next/font note when Google Fonts are imported", () => {
    const css = nextjsAdapter(makeInput(FULL_YAML));
    expect(css).toContain("next/font");
  });

  it("omits Google Fonts @import for system fonts", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).not.toContain("@import url(");
  });

  it("omits Google Fonts when includeFontImports is false", () => {
    const css = nextjsAdapter(makeInput(FULL_YAML), { includeFontImports: false });
    expect(css).not.toContain("@import url(");
  });

  it("includes FOWT comment by default", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("FOWT Prevention");
  });

  it("omits FOWT comment when includeFowt is false", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML), { includeFowt: false });
    expect(css).not.toContain("FOWT Prevention");
  });

  it("is deterministic (same input = same output)", () => {
    const input = makeInput(MINIMAL_YAML);
    const css1 = nextjsAdapter(input);
    const css2 = nextjsAdapter(input);
    expect(css1).toBe(css2);
  });

  it("@import appears before @layer declaration", () => {
    const css = nextjsAdapter(makeInput(FULL_YAML));
    const importIdx = css.indexOf("@import url(");
    const layerIdx = css.indexOf("@layer visor-primitives,");
    expect(importIdx).toBeGreaterThan(-1);
    expect(layerIdx).toBeGreaterThan(importIdx);
  });
});
