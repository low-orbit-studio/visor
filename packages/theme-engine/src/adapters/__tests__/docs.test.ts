import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { generateThemeData } from "../../pipeline.js";
import { docsAdapter } from "../docs.js";
import type { AdapterInput } from "../types.js";

const MINIMAL_YAML = readFileSync(
  resolve(__dirname, "../../__tests__/fixtures/minimal.visor.yaml"),
  "utf-8",
);

const FULL_YAML = readFileSync(
  resolve(__dirname, "../../__tests__/fixtures/full.visor.yaml"),
  "utf-8",
);

const VISOR_FONT_YAML = `
name: Custom Font Theme
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: "Modern Society"
    source: visor-fonts
    org: low-orbit-studio
    weight: 400
  body:
    family: Inter
`;

const GOOGLE_FONT_YAML = `
name: Google Font Theme
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: Inter
    source: google-fonts
    weight: 700
  body:
    family: Inter
    source: google-fonts
    weight: 400
`;

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("docsAdapter", () => {
  describe("CSS scoping", () => {
    it("scopes all tokens under .{slug}-theme class", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain(".minimal-theme {");
    });

    it("uses dark mode scoping under .dark .{slug}-theme", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain(".dark .minimal-theme {");
    });

    it("uses light mode scoping under html:not(.dark) .{slug}-theme", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("html:not(.dark) .minimal-theme {");
    });

    it("does not use :root selectors", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).not.toMatch(/\n:root\s*\{/);
    });

    it("declares the visor layer order", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain(
        "@layer visor-primitives, visor-semantic, visor-adaptive, visor-bridge;",
      );
    });

    it("wraps theme rule content in @layer visor-adaptive", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("@layer visor-adaptive {");
    });

    it("keeps @import statements outside the @layer block (CSS spec)", () => {
      const css = docsAdapter(makeInput(FULL_YAML));
      const importIdx = css.indexOf("@import url(");
      const layerIdx = css.indexOf("@layer visor-adaptive {");
      expect(importIdx).toBeGreaterThan(-1);
      expect(layerIdx).toBeGreaterThan(-1);
      expect(importIdx).toBeLessThan(layerIdx);
    });

    it("produces deterministic output", () => {
      const input = makeInput(MINIMAL_YAML);
      expect(docsAdapter(input)).toBe(docsAdapter(input));
    });

    it("derives slug from multi-word theme name", () => {
      const css = docsAdapter(makeInput(FULL_YAML));
      expect(css).toContain(".full-theme-theme {");
    });
  });

  describe("primitives", () => {
    it("includes color primitives", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--color-primary-500:");
      expect(css).toContain("--color-neutral-50:");
    });

    it("includes spacing primitives", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--spacing-4:");
    });

    it("includes border radius primitives", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--radius-sm:");
      expect(css).toContain("--radius-2xl:");
      expect(css).toContain("--radius-3xl:");
    });

    it("includes typography tokens (font-body, font-heading)", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--font-body:");
      expect(css).toContain("--font-heading:");
    });

    it("includes shadow primitives", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--shadow-xs:");
      expect(css).toContain("--shadow-sm:");
      expect(css).toContain("--shadow-md:");
      expect(css).toContain("--shadow-lg:");
      expect(css).toContain("--shadow-xl:");
    });

    it("includes motion primitives", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--motion-duration-100:");
      expect(css).toContain("--motion-easing-ease-in-out:");
      expect(css).toContain("--motion-easing-spring:");
    });

    it("includes misc primitives (border widths, z-index, overlay, focus ring)", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--border-width-1:");
      expect(css).toContain("--z-modal:");
      expect(css).toContain("--overlay-bg:");
      expect(css).toContain("--focus-ring-width:");
    });
  });

  describe("semantic tokens", () => {
    it("includes dark semantic tokens under .dark .{slug}-theme", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      // Dark tokens appear in multiple per-category blocks; check the full CSS
      expect(css).toContain(".dark .minimal-theme {");
      expect(css).toContain("--text-primary:");
      expect(css).toContain("--surface-page:");
      expect(css).toContain("--border-default:");
      expect(css).toContain("--interactive-primary-bg:");
    });

    it("includes light semantic tokens under html:not(.dark) .{slug}-theme", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("html:not(.dark) .minimal-theme {");
      // Light tokens appear in per-category blocks; check the full CSS
      expect(css).toContain("--text-primary:");
      expect(css).toContain("--surface-page:");
    });

    it("includes prefers-color-scheme dark media query", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("@media (prefers-color-scheme: dark)");
      expect(css).toContain(".minimal-theme:not(.light)");
    });
  });

  describe("fumadocs bridge", () => {
    it("includes fumadocs bridge tokens scoped to .dark .{slug}-theme", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("--color-fd-background:");
      expect(css).toContain("--color-fd-foreground:");
      expect(css).toContain("--color-fd-ring:");
    });

    it("scopes fumadocs bridge to theme class, not bare .dark", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      // The bridge should use .dark .minimal-theme, not standalone .dark
      const lines = css.split("\n");
      const fdBackgroundLine = lines.find((l) => l.includes("--color-fd-background:"));
      expect(fdBackgroundLine).toBeDefined();
      // Should appear inside .dark .minimal-theme or html:not(.dark) .minimal-theme blocks
      // Not inside a bare .dark { block
      expect(css).not.toMatch(/^\.dark \{[^}]*--color-fd-background/s);
    });

    it("includes fumadocs bridge for both dark and light modes", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      // Count occurrences of --color-fd-background — should appear twice (dark + light)
      const matches = css.match(/--color-fd-background:/g);
      expect(matches).toHaveLength(2);
    });
  });

  describe("font imports", () => {
    it("suppresses font imports when includeFontImports is false", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML), { includeFontImports: false });
      expect(css).not.toContain("@import url(");
      expect(css).not.toContain("@font-face");
    });

    it("generates @font-face for visor-fonts sources with aliased family name", () => {
      const css = docsAdapter(makeInput(VISOR_FONT_YAML));
      expect(css).toContain("@font-face");
      // VI-354: @font-face family is aliased per theme so co-loaded themes
      // sharing a family don't overwrite each other's @font-face properties.
      expect(css).toContain('font-family: "Modern Society [custom-font-theme]"');
      // --font-heading falls back to the bare family for consumer code
      // that references it directly. (Heading slot uses visor-fonts here;
      // body slot is Inter, which is not visor-fonts so stays bare.)
      expect(css).toContain('--font-heading: var(--font-sans);');
    });

    it("emits size-adjust on visor-fonts @font-face when scale < 1", () => {
      const scaledYaml = `
name: Scaled Theme
version: 1
colors:
  primary: "#2563EB"
typography:
  scale: 0.8
  heading:
    family: "PP Model Mono"
    weight: 500
    weights: [500]
    source: visor-fonts
    org: low-orbit-studio
`;
      const css = docsAdapter(makeInput(scaledYaml));
      expect(css).toContain("size-adjust: 80%;");
    });

    it("does not emit size-adjust when scale is 1 (default)", () => {
      const css = docsAdapter(makeInput(VISOR_FONT_YAML));
      expect(css).not.toContain("size-adjust");
    });

    it("respects explicit weights array for visor-fonts", () => {
      const yaml = `
name: Custom Weights Theme
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: "PP Model Mono"
    weight: 400
    weights: [300, 500]
    source: visor-fonts
    org: low-orbit-studio
`;
      const css = docsAdapter(makeInput(yaml));
      // Should include Light (300) and Medium (500), not Regular (400) or Bold (700)
      expect(css).toContain("PPModelMono-Light.woff2");
      expect(css).toContain("PPModelMono-Medium.woff2");
      expect(css).not.toContain("PPModelMono-Regular.woff2");
      expect(css).not.toContain("PPModelMono-Bold.woff2");
    });
  });

  describe("cross-theme @font-face scoping (VI-354)", () => {
    // Two themes that share `PP Model Mono` as a visor-fonts family with
    // different `typography.scale` values. Before VI-354, both themes
    // emitted `@font-face { font-family: "PP Model Mono"; size-adjust: ... }`,
    // and the later block silently overwrote the earlier one for shared
    // weights. After VI-354, each theme's @font-face uses an aliased
    // family name so they coexist without collision.
    const SCALE_90_YAML = `
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

    const SCALE_80_YAML = `
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
      const css90 = docsAdapter(makeInput(SCALE_90_YAML));
      const css80 = docsAdapter(makeInput(SCALE_80_YAML));
      const combined = css90 + "\n" + css80;

      // Each theme's @font-face uses its own aliased family name.
      expect(css90).toContain('font-family: "PP Model Mono [scale-ninety]"');
      expect(css80).toContain('font-family: "PP Model Mono [scale-eighty]"');

      // No theme emits the bare family inside an @font-face block.
      // (The bare family appears only as a fallback in `--font-*` stacks.)
      expect(combined).not.toMatch(
        /@font-face \{\s*\n\s*font-family: "PP Model Mono";/,
      );

      // size-adjust is preserved per theme (the original bug: 80% used to
      // overwrite 90% via shared `@font-face` for "PP Model Mono").
      expect(css90).toContain("size-adjust: 90%;");
      expect(css80).toContain("size-adjust: 80%;");
      expect(css90).not.toContain("size-adjust: 80%;");
      expect(css80).not.toContain("size-adjust: 90%;");
    });

    it("emits 4 distinct @font-face blocks across two themes sharing a family with 2 weights each", () => {
      const combined = docsAdapter(makeInput(SCALE_90_YAML)) + "\n" + docsAdapter(makeInput(SCALE_80_YAML));

      // 2 weights per theme × 2 themes = 4 @font-face declarations.
      // Each theme dedupes by family within its own output, so heading +
      // body + mono all pointing to "PP Model Mono" emit once per theme.
      expect(countMatches(combined, "@font-face {")).toBe(4);

      // 2 blocks per aliased family.
      expect(countMatches(combined, 'font-family: "PP Model Mono [scale-ninety]"')).toBe(2);
      expect(countMatches(combined, 'font-family: "PP Model Mono [scale-eighty]"')).toBe(2);
    });

    it("each theme's --font-* stack lists its own aliased family first, then the bare family", () => {
      const css90 = docsAdapter(makeInput(SCALE_90_YAML));
      const css80 = docsAdapter(makeInput(SCALE_80_YAML));

      // The alias map is keyed by family name — every --font-* whose family
      // matches an emitted @font-face family picks up the alias, even when
      // that var's own slot doesn't carry the visor-fonts source. This is
      // the load-bearing detail for --font-mono in the original bug repro:
      // the mono slot's `source` is dropped during `resolveConfig`, but
      // the heading/body slots emit "PP Model Mono" with an alias, so
      // --font-mono still picks it up via family match.
      expect(css90).toContain('--font-sans: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css90).toContain('--font-body: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css90).toContain('--font-mono: "PP Model Mono [scale-ninety]", "PP Model Mono"');

      expect(css80).toContain('--font-sans: "PP Model Mono [scale-eighty]", "PP Model Mono"');
      expect(css80).toContain('--font-body: "PP Model Mono [scale-eighty]", "PP Model Mono"');
      expect(css80).toContain('--font-mono: "PP Model Mono [scale-eighty]", "PP Model Mono"');

      // The wrong theme's alias must not leak across.
      expect(css90).not.toContain("[scale-eighty]");
      expect(css80).not.toContain("[scale-ninety]");
    });

    it("single-theme visor-fonts case still emits aliased family (alias is unconditional)", () => {
      // Confirms aliasing isn't gated on "two themes detected" — every
      // visor-fonts @font-face is aliased so the substrate is consistent
      // whether one theme or many are co-loaded.
      const css = docsAdapter(makeInput(SCALE_90_YAML));
      expect(css).toContain('font-family: "PP Model Mono [scale-ninety]"');
      expect(css).toContain('--font-sans: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css).toContain('--font-body: "PP Model Mono [scale-ninety]", "PP Model Mono"');
      expect(css).toContain('--font-mono: "PP Model Mono [scale-ninety]", "PP Model Mono"');
    });

    it("non-visor-fonts slots keep bare family in --font-* (no alias to point at)", () => {
      // Google Fonts and local fonts don't emit per-theme @font-face from
      // the engine — they'd have nothing to alias to. Their --font-* vars
      // stay as bare families.
      const yaml = `
name: Mixed Sources
version: 1
colors:
  primary: "#2563EB"
typography:
  heading:
    family: Inter
    source: google-fonts
  body:
    family: Inter
    source: google-fonts
  mono:
    family: "PP Model Mono"
`;
      const css = docsAdapter(makeInput(yaml));
      // Body is Google Fonts → bare in stack.
      expect(css).toMatch(/--font-sans: Inter;/);
      // mono.family has no `source`, so it's treated as bare (not visor-fonts).
      expect(css).toMatch(/--font-mono: PP Model Mono;/);
    });
  });
});
