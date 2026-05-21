/**
 * VI-451 — entr theme exposes semantic aliases
 *
 * Asserts the docs-adapter output for the entr theme contains the full
 * semantic alias surface that the organization-management reference build's
 * prototype-overlay.css (lines 14-67) redeclared. Once these aliases ship
 * here + entr's override values ship in visor-themes-private, consumers can
 * `var(--surface-card)`, `var(--primary)`, `var(--hairline)`, `var(--text-14)`,
 * etc. directly without a parallel CSS file.
 *
 * The entr.visor.yaml source-of-truth lives in
 * /Users/justinschier/Code/low-orbit/visor-themes-private/themes/entr/theme.visor.yaml.
 * We inline an equivalent fixture here because this repo can't depend on the
 * private repo at test time.
 */

import { describe, it, expect } from "vitest";
import { generateThemeData } from "../pipeline.js";
import { docsAdapter } from "../adapters/docs.js";
import type { AdapterInput } from "../adapters/types.js";

const ENTR_YAML = `
name: entr
label: ENTR
version: 1
group: Client

colors:
  primary:    "#6BEBA5"
  accent:     "#38C7E0"
  neutral:    "#71717A"
  background: "#FAFCFE"
  surface:    "#FFFFFF"
  error:      "#FE5D8B"

colors-dark:
  primary:    "#6BEBA5"
  accent:     "#38C7E0"
  background: "#131416"
  surface:    "#242628"
  error:      "#FE5D8B"

overrides:
  dark:
    # VI-451 alias surface — pinned to admin-ui reference values
    surface-screen: "#0B0C0D"
    surface-page:   "#131416"
    surface-card:   "#242628"
    surface-subtle: "#2A2D30"
    surface-muted:  "#3A3D40"
    surface-elev:   "#2E3134"
    text-primary:   "#FAFCFE"
    text-secondary: "rgba(250, 252, 254, 0.72)"
    text-tertiary:  "rgba(250, 252, 254, 0.50)"
    text-muted:     "rgba(250, 252, 254, 0.32)"
    primary:        "#6BEBA5"
    primary-text:   "#1E1F21"
    accent:         "#38C7E0"
    success:        "#6BEBA5"
    warning:        "#F0B454"
    destructive:    "#FE5D8B"
    info:           "#38C7E0"
    hairline:         "rgba(255, 255, 255, 0.06)"
    hairline-strong:  "rgba(255, 255, 255, 0.10)"
    border-default: "transparent"
    border-muted:   "transparent"
    border-strong:  "transparent"

radius:
  sm: 6
  md: 8
  lg: 12
  xl: 20
`;

function makeInput(): AdapterInput {
  const data = generateThemeData(ENTR_YAML);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

describe("VI-451 — entr alias surface", () => {
  const css = docsAdapter(makeInput());

  describe("cascade layer placement", () => {
    it("declares visor-semantic layer", () => {
      expect(css).toContain("@layer visor-semantic {");
    });

    it("emits visor-semantic before visor-adaptive (cascade order)", () => {
      const semanticIdx = css.indexOf("@layer visor-semantic {");
      const adaptiveIdx = css.indexOf("@layer visor-adaptive {");
      expect(semanticIdx).toBeGreaterThan(-1);
      expect(adaptiveIdx).toBeGreaterThan(-1);
      expect(semanticIdx).toBeLessThan(adaptiveIdx);
    });
  });

  describe("surface scale (6 aliases)", () => {
    it.each([
      ["--surface-screen", "#0B0C0D"],
      ["--surface-page", "#131416"],
      ["--surface-card", "#242628"],
      ["--surface-subtle", "#2A2D30"],
      ["--surface-muted", "#3A3D40"],
      ["--surface-elev", "#2E3134"],
    ])("emits %s with entr dark value %s", (token, value) => {
      expect(css).toContain(`${token}: ${value};`);
    });
  });

  describe("text scale (4 aliases — alpha ramp)", () => {
    it.each([
      ["--text-primary", "#FAFCFE"],
      ["--text-secondary", "rgba(250, 252, 254, 0.72)"],
      ["--text-tertiary", "rgba(250, 252, 254, 0.50)"],
      ["--text-muted", "rgba(250, 252, 254, 0.32)"],
    ])("emits %s with entr dark value %s", (token, value) => {
      expect(css).toContain(`${token}: ${value};`);
    });
  });

  describe("intent scale (7 bare-name aliases)", () => {
    it.each([
      ["--primary", "#6BEBA5"],
      ["--primary-text", "#1E1F21"],
      ["--accent", "#38C7E0"],
      ["--success", "#6BEBA5"],
      ["--warning", "#F0B454"],
      ["--destructive", "#FE5D8B"],
      ["--info", "#38C7E0"],
    ])("emits %s with entr dark value %s", (token, value) => {
      expect(css).toContain(`${token}: ${value};`);
    });
  });

  describe("hairline aliases (2)", () => {
    it.each([
      ["--hairline", "rgba(255, 255, 255, 0.06)"],
      ["--hairline-strong", "rgba(255, 255, 255, 0.10)"],
    ])("emits %s with entr dark value %s", (token, value) => {
      expect(css).toContain(`${token}: ${value};`);
    });
  });

  describe("discrete text-size scale (9 admin-ui aliases)", () => {
    it.each([11, 13, 14, 16, 20, 24, 32, 40, 48])("emits --text-%i: %ipx", (px) => {
      expect(css).toContain(`--text-${px}: ${px}px;`);
    });
  });

  describe("discrete space scale (10 4px-grid aliases)", () => {
    it.each([
      [1, 4], [2, 8], [3, 12], [4, 16], [5, 20],
      [6, 24], [8, 32], [10, 40], [12, 48], [16, 64],
    ])("emits --space-%i: %ipx", (m, px) => {
      expect(css).toContain(`--space-${m}: ${px}px;`);
    });
  });

  describe("radius scale (4 — already engine-native)", () => {
    it.each([
      ["--radius-sm", "0.375rem"], // 6 / 16
      ["--radius-md", "0.5rem"],   // 8 / 16
      ["--radius-lg", "0.75rem"],  // 12 / 16
      ["--radius-xl", "1.25rem"],  // 20 / 16
    ])("emits %s with entr value %s", (token, value) => {
      expect(css).toContain(`${token}: ${value};`);
    });
  });

  describe("dark-mode scoping", () => {
    it("emits intent aliases under .dark .entr-theme (manual toggle)", () => {
      // The block under `.dark .entr-theme` should contain --primary
      const darkBlockMatch = css.match(/\.dark\s+\.entr-theme\s*\{[\s\S]*?--primary:\s*#6BEBA5;[\s\S]*?\}/);
      expect(darkBlockMatch).not.toBeNull();
    });

    it("emits hairline aliases under prefers-color-scheme: dark", () => {
      // Pattern: `@media (prefers-color-scheme: dark)` wrapping a block that
      // contains --hairline with the dark rgba value.
      expect(css).toMatch(
        /@media \(prefers-color-scheme: dark\)\s*\{[\s\S]*?--hairline:\s*rgba\(255,\s*255,\s*255,\s*0\.06\);/,
      );
    });
  });

  describe("alias count gate", () => {
    it("emits all 38 alias tokens documented in the ticket", () => {
      // 6 surface + 4 text + 7 intent + 2 hairline + 9 text-N + 10 space-N = 38
      // (Radius + shadow already covered by existing primitives layer.)
      const required = [
        "--surface-screen", "--surface-page", "--surface-card",
        "--surface-subtle", "--surface-muted", "--surface-elev",
        "--text-primary", "--text-secondary", "--text-tertiary", "--text-muted",
        "--primary", "--primary-text", "--accent",
        "--success", "--warning", "--destructive", "--info",
        "--hairline", "--hairline-strong",
        "--text-11", "--text-13", "--text-14", "--text-16", "--text-20",
        "--text-24", "--text-32", "--text-40", "--text-48",
        "--space-1", "--space-2", "--space-3", "--space-4", "--space-5",
        "--space-6", "--space-8", "--space-10", "--space-12", "--space-16",
      ];
      expect(required).toHaveLength(38);
      const missing = required.filter((token) => !css.includes(`${token}:`));
      expect(missing).toEqual([]);
    });
  });
});
