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

  describe("cross-theme @font-face scoping (VI-354)", () => {
    // The nextjs adapter doesn't emit `size-adjust` on @font-face today, so
    // the literal VI-354 corruption (size-adjust override) can't manifest
    // here yet — but the same global `@font-face` collision substrate
    // exists, and the moment per-theme `size-adjust` (or any other
    // per-theme @font-face property) ships in nextjs output, it would
    // regress. These tests lock in the substrate guarantee so the alias
    // logic doesn't silently drift in this adapter.
    const SHARED_FAMILY_NINETY = `
name: Scale Ninety
version: 1
colors:
  primary: "#2563EB"
typography:
  scale: 0.9
  heading:
    family: "PP Model Mono"
    weight: 400
    weights: [400, 500]
    source: visor-fonts
    org: low-orbit-studio
  body:
    family: "PP Model Mono"
    weight: 400
    weights: [400, 500]
    source: visor-fonts
    org: low-orbit-studio
  mono:
    family: "PP Model Mono"
`;

    const SHARED_FAMILY_EIGHTY = `
name: Scale Eighty
version: 1
colors:
  primary: "#2563EB"
typography:
  scale: 0.8
  heading:
    family: "PP Model Mono"
    weight: 300
    weights: [300, 500]
    source: visor-fonts
    org: low-orbit-studio
  body:
    family: "PP Model Mono"
    weight: 300
    weights: [300, 500]
    source: visor-fonts
    org: low-orbit-studio
  mono:
    family: "PP Model Mono"
`;

    function countMatches(haystack: string, needle: string): number {
      let count = 0;
      let idx = 0;
      while ((idx = haystack.indexOf(needle, idx)) !== -1) {
        count++;
        idx += needle.length;
      }
      return count;
    }

    it("emits aliased @font-face families per theme so co-loaded themes don't collide", () => {
      const css90 = nextjsAdapter(makeInput(SHARED_FAMILY_NINETY));
      const css80 = nextjsAdapter(makeInput(SHARED_FAMILY_EIGHTY));
      const combined = css90 + "\n" + css80;

      expect(css90).toContain('font-family: "PP Model Mono [scale-ninety]"');
      expect(css80).toContain('font-family: "PP Model Mono [scale-eighty]"');

      // No theme emits the bare family inside an @font-face block.
      expect(combined).not.toMatch(
        /@font-face \{\s*\n\s*font-family: "PP Model Mono";/,
      );

      // The wrong theme's alias must not leak across.
      expect(css90).not.toContain("[scale-eighty]");
      expect(css80).not.toContain("[scale-ninety]");
    });

    it("emits 4 distinct @font-face blocks across two themes sharing a family with 2 weights each", () => {
      const combined =
        nextjsAdapter(makeInput(SHARED_FAMILY_NINETY)) +
        "\n" +
        nextjsAdapter(makeInput(SHARED_FAMILY_EIGHTY));

      // 2 weights per theme × 2 themes = 4 @font-face declarations. Each
      // adapter dedupes by family within its own output, so heading + body
      // + mono all pointing to "PP Model Mono" emit once per theme.
      expect(countMatches(combined, "@font-face {")).toBe(4);
      expect(countMatches(combined, 'font-family: "PP Model Mono [scale-ninety]"')).toBe(2);
      expect(countMatches(combined, 'font-family: "PP Model Mono [scale-eighty]"')).toBe(2);
    });

    it("each theme's --font-* stack lists its own aliased family first, then the bare family", () => {
      const css90 = nextjsAdapter(makeInput(SHARED_FAMILY_NINETY));
      const css80 = nextjsAdapter(makeInput(SHARED_FAMILY_EIGHTY));

      // The family-keyed alias map applies to --font-* whose family
      // matches an emitted @font-face family — including --font-mono,
      // whose own slot drops `source` during `resolveConfig` but still
      // resolves to "PP Model Mono".
      expect(css90).toContain('--font-heading: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css90).toContain('--font-sans: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css90).toContain('--font-body: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css90).toContain('--font-mono: "PP Model Mono [scale-ninety]", "PP Model Mono"');

      expect(css80).toContain('--font-heading: "PP Model Mono [scale-eighty]", "PP Model Mono"');
      expect(css80).toContain('--font-sans: "PP Model Mono [scale-eighty]", "PP Model Mono"');
      expect(css80).toContain('--font-body: "PP Model Mono [scale-eighty]", "PP Model Mono"');
      expect(css80).toContain('--font-mono: "PP Model Mono [scale-eighty]", "PP Model Mono"');
    });

    it("single-theme visor-fonts case still emits aliased family (alias is unconditional)", () => {
      const css = nextjsAdapter(makeInput(SHARED_FAMILY_NINETY));
      expect(css).toContain('font-family: "PP Model Mono [scale-ninety]"');
      expect(css).toContain('--font-sans: "PP Model Mono [scale-ninety]", "PP Model Mono"');
    });
  });
});
