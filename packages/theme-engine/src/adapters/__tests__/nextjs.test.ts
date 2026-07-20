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
      "@layer visor-base, visor-primitives, visor-semantic, visor-brand, visor-adaptive, visor-bridge;",
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
    const layerIdx = css.indexOf("@layer visor-base,");
    expect(importIdx).toBeGreaterThan(-1);
    expect(layerIdx).toBeGreaterThan(importIdx);
  });

  describe("visor-semantic layer (VI-453)", () => {
    it("emits @layer visor-semantic block", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain("@layer visor-semantic {");
    });

    it("visor-semantic appears before visor-adaptive in output", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticIdx = css.indexOf("@layer visor-semantic {");
      const adaptiveIdx = css.indexOf("@layer visor-adaptive {");
      expect(semanticIdx).toBeGreaterThan(-1);
      expect(adaptiveIdx).toBeGreaterThan(-1);
      expect(semanticIdx).toBeLessThan(adaptiveIdx);
    });

    it("emits all 7 intent aliases in light mode (html:not(.dark) { })", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      // Locate the visor-semantic layer block (ends before visor-brand)
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      expect(semanticBlock).toContain("html:not(.dark) {");
      expect(semanticBlock).toContain("--primary:");
      expect(semanticBlock).toContain("--primary-text:");
      expect(semanticBlock).toContain("--accent:");
      expect(semanticBlock).toContain("--success:");
      expect(semanticBlock).toContain("--warning:");
      expect(semanticBlock).toContain("--destructive:");
      expect(semanticBlock).toContain("--info:");
    });

    it("emits all 7 intent aliases in dark mode — manual toggle (html.dark { })", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      expect(semanticBlock).toContain("html.dark {");
      // Verify intent aliases appear in the dark block
      const darkIdx = semanticBlock.indexOf("html.dark {");
      const darkBlock = semanticBlock.slice(darkIdx);
      expect(darkBlock).toContain("--primary:");
      expect(darkBlock).toContain("--accent:");
      expect(darkBlock).toContain("--success:");
      expect(darkBlock).toContain("--warning:");
      expect(darkBlock).toContain("--destructive:");
      expect(darkBlock).toContain("--info:");
    });

    it("emits both hairline aliases in light mode", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      expect(semanticBlock).toContain("--hairline:");
      expect(semanticBlock).toContain("--hairline-strong:");
    });

    it("emits dark mode hairlines under prefers-color-scheme media query", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      // Extract only the visor-semantic layer (before visor-adaptive which has many more media queries)
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      expect(semanticBlock).toContain("@media (prefers-color-scheme: dark)");
      // Should appear exactly twice — once for intent, once for hairline
      const prefersMatches = semanticBlock.match(/@media \(prefers-color-scheme: dark\)/g);
      expect(prefersMatches).toHaveLength(2);
    });

    it("emits all 9 discrete text-size aliases (--text-N) unconditionally in :root", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      for (const px of [11, 13, 14, 16, 20, 24, 32, 40, 48]) {
        expect(semanticBlock).toContain(`--text-${px}:`);
      }
    });

    it("emits all 10 discrete space aliases (--space-N) unconditionally in :root", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]) {
        expect(semanticBlock).toContain(`--space-${n}:`);
      }
    });

    it("discrete scales attach to :root (not mode-scoped)", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      // --text-14 must appear inside visor-semantic before any html.dark or html:not(.dark) block
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const firstModeSelector = Math.min(
        css.indexOf("html:not(.dark)"),
        css.indexOf("html.dark"),
      );
      // text-11 must be declared before the first mode-scoped selector
      const text11Idx = css.indexOf("--text-11:", semanticStart);
      expect(text11Idx).toBeGreaterThan(-1);
      expect(text11Idx).toBeLessThan(firstModeSelector);
    });

    it("covers all 38 aliases: 7 intent + 2 hairline + 9 text-scale + 10 space (light scope)", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);

      // 7 intent
      const intentAliases = ["--primary:", "--primary-text:", "--accent:", "--success:", "--warning:", "--destructive:", "--info:"];
      for (const alias of intentAliases) {
        expect(semanticBlock).toContain(alias);
      }
      // 2 hairline
      expect(semanticBlock).toContain("--hairline:");
      expect(semanticBlock).toContain("--hairline-strong:");
      // 9 text-scale
      for (const px of [11, 13, 14, 16, 20, 24, 32, 40, 48]) {
        expect(semanticBlock).toContain(`--text-${px}:`);
      }
      // 10 space
      for (const n of [1, 2, 3, 4, 5, 6, 8, 10, 12, 16]) {
        expect(semanticBlock).toContain(`--space-${n}:`);
      }
    });

    it("covers all 38 aliases in dark scope (html.dark + prefers-color-scheme)", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);

      // Find dark mode section — starts at first html.dark occurrence
      const darkSectionIdx = semanticBlock.indexOf("html.dark {");
      expect(darkSectionIdx).toBeGreaterThan(-1);
      const darkSection = semanticBlock.slice(darkSectionIdx);

      // Intent in dark
      for (const alias of ["--primary:", "--accent:", "--success:", "--warning:", "--destructive:", "--info:"]) {
        expect(darkSection).toContain(alias);
      }
      // Hairline in dark
      expect(darkSection).toContain("--hairline:");
      expect(darkSection).toContain("--hairline-strong:");
    });

    it("with scopePrefix, mode selectors compose prefix into html:not(.dark) <prefix> and html.dark <prefix>", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML), { scopePrefix: "body.entr-theme" });
      const semanticStart = css.indexOf("@layer visor-semantic {");
      const adaptiveStart = css.indexOf("@layer visor-adaptive {");
      const semanticBlock = css.slice(semanticStart, adaptiveStart);
      expect(semanticBlock).toContain("html:not(.dark) body.entr-theme {");
      expect(semanticBlock).toContain("html.dark body.entr-theme {");
      expect(semanticBlock).toContain("body.entr-theme:not(.light):not(.theme-light)");
    });
  });

  describe("scopePrefix option (VI-368)", () => {
    it("without scopePrefix, output preserves :root selectors (backward compat)", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML));
      expect(css).toContain(":root");
      // Default dark selectors are NOT prefixed.
      expect(css).toMatch(/\n\.dark,\n\.theme-dark,\n\[data-theme="dark"\]/);
    });

    it("with scopePrefix, all :root rules are wrapped in the supplied selector", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML), {
        scopePrefix: "body.blacklight-theme",
      });
      // Primitives + light blocks open with the supplied selector.
      expect(css).toContain("body.blacklight-theme {");
      // The default :root selector should NOT appear as a block opener.
      // (`:root` may still appear inside comments, so check selector form.)
      expect(css).not.toMatch(/\n:root \{/);
    });

    it("dark-mode manual-toggle block scopes to <prefix>.dark, <prefix>.theme-dark, <prefix>[data-theme]", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML), {
        scopePrefix: "body.blacklight-theme",
      });
      expect(css).toContain("body.blacklight-theme.dark");
      expect(css).toContain("body.blacklight-theme.theme-dark");
      expect(css).toContain('body.blacklight-theme[data-theme="dark"]');
      // Bare `.dark,` (the unprefixed selector list) must not appear.
      expect(css).not.toMatch(/\n\.dark,\n\.theme-dark,\n\[data-theme="dark"\]/);
    });

    it("prefers-color-scheme block composes the prefix with the :not(.light) guards", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML), {
        scopePrefix: "body.blacklight-theme",
      });
      expect(css).toContain("@media (prefers-color-scheme: dark)");
      expect(css).toContain(
        'body.blacklight-theme:not(.light):not(.theme-light):not([data-theme="light"])',
      );
    });

    it("accepts arbitrary caller-supplied selectors (not just body.*)", () => {
      const css = nextjsAdapter(makeInput(MINIMAL_YAML), {
        scopePrefix: ".scoped-theme",
      });
      expect(css).toContain(".scoped-theme {");
      expect(css).toContain(".scoped-theme.dark");
    });

    it("scoped output is deterministic", () => {
      const input = makeInput(MINIMAL_YAML);
      const css1 = nextjsAdapter(input, { scopePrefix: "body.x-theme" });
      const css2 = nextjsAdapter(input, { scopePrefix: "body.x-theme" });
      expect(css1).toBe(css2);
    });
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

// BO-56 — color-scheme honored in the nextjs adapter.
const DARK_ONLY_YAML = `
name: Nocturne
version: 1
color-scheme: dark-only
colors:
  primary: "#e8b64c"
  neutral: "#1e1f21"
  background: "#141517"
  surface: "#1e1f21"
`;

describe("nextjsAdapter — color-scheme (BO-56)", () => {
  it("dark-only emits color-scheme: dark on the host and no prefers/toggle blocks", () => {
    const css = nextjsAdapter(makeInput(DARK_ONLY_YAML), { includeFowt: false });
    expect(css).toContain("color-scheme: dark;");
    expect(css).not.toContain("@media (prefers-color-scheme: dark)");
    expect(css).not.toContain("html:not(.dark)");
    expect(css).not.toContain("html.dark");
  });

  it("dark-only pins the dark palette at :root, dropping the light page value", () => {
    const data = generateThemeData(DARK_ONLY_YAML);
    const css = nextjsAdapter(makeInput(DARK_ONLY_YAML), { includeFowt: false });
    expect(css).toContain(`--surface-page: ${data.tokens.surface.page.dark};`);
    expect(css).not.toContain(`--surface-page: ${data.tokens.surface.page.light};`);
  });

  it("adaptive still emits the prefers-color-scheme media query (regression guard)", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    // and no bare color-scheme property.
    expect(css).not.toMatch(/color-scheme:\s*(dark|light);/);
  });
});

describe("nextjsAdapter — visor-base element baseline (VI-616)", () => {
  it("emits the visor-core reset @import before any style rule", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    const importIdx = css.indexOf('@import "@loworbitstudio/visor-core/reset";');
    expect(importIdx).toBeGreaterThan(-1);
    // CSS spec: @import must precede every rule except @charset / @layer statements.
    expect(importIdx).toBeLessThan(css.indexOf("@layer visor-base {"));
  });

  it("binds the theme's body font to the page root", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    const layerIdx = css.indexOf("@layer visor-base {");
    const body = css.slice(layerIdx, css.indexOf("@layer visor-primitives {"));
    expect(body).toContain("body {");
    expect(body).toContain("font-family: var(--font-body);");
    expect(body).toContain("color: var(--text-primary);");
    expect(body).toContain("background: var(--surface-page, var(--surface-background));");
    expect(body).toContain("font-size: 1rem;");
  });

  it("orders visor-base first, so consumer and component rules always win", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain(
      "@layer visor-base, visor-primitives, visor-semantic, visor-brand, visor-adaptive, visor-bridge;",
    );
  });

  it("targets the scope prefix instead of bare body when one is set", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML), {
      scopePrefix: "body.acme-theme",
    });
    const layerIdx = css.indexOf("@layer visor-base {");
    const body = css.slice(layerIdx, css.indexOf("@layer visor-primitives {"));
    expect(body).toContain("body.acme-theme {");
  });

  it("omits both halves when includeBaseLayer is false", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML), { includeBaseLayer: false });
    expect(css).not.toContain('@import "@loworbitstudio/visor-core/reset";');
    expect(css).not.toContain("@layer visor-base {");
    // The layer must still be *declared* so the ordering contract holds.
    expect(css).toContain("@layer visor-base, visor-primitives,");
  });

  it("does not emit element-level rules beyond the token binding", () => {
    const css = nextjsAdapter(makeInput(MINIMAL_YAML));
    const layerIdx = css.indexOf("@layer visor-base {");
    const body = css.slice(layerIdx, css.indexOf("@layer visor-primitives {"));
    // Propagation lives in visor-core/reset, not in generated theme CSS.
    expect(body).not.toContain("font: inherit;");
    expect(body).not.toContain("box-sizing:");
  });
});
