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

    it("does not wrap in @layer", () => {
      const css = docsAdapter(makeInput(MINIMAL_YAML));
      expect(css).not.toContain("@layer");
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
      expect(css).toContain("html:not(.light) .minimal-theme");
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

    it("generates @font-face for visor-fonts sources", () => {
      const css = docsAdapter(makeInput(VISOR_FONT_YAML));
      expect(css).toContain("@font-face");
      expect(css).toContain('font-family: "Modern Society"');
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
});
