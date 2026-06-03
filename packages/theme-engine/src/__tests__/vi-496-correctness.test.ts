/**
 * VI-496 — Schema and Mode Correctness Bundle
 *
 * Tests for four independent correctness fixes from the architecture audit:
 *   D1: JSON schema adds `label` + `default-mode` properties
 *   D2: docs adapter uses triple-negation prefers-color-scheme selector
 *   D3: generator threads `defaultMode` (tested via switcher + PrivateThemeEntry)
 *   D4: `--primary-text` is a single-source alias of `--interactive-primary-text`
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";
import { describe, it, expect } from "vitest";
import { generateThemeData } from "../pipeline.js";
import { docsAdapter } from "../adapters/docs.js";
import type { AdapterInput } from "../adapters/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Shared YAML fixtures ─────────────────────────────────────────────────────

const MINIMAL_YAML = `
name: Correctness Test
version: 1
colors:
  primary: "#2563EB"
`.trim();

const YAML_WITH_DEFAULT_MODE = `
name: Dark Locked
version: 1
label: Dark Locked Theme
default-mode: dark
colors:
  primary: "#6366F1"
`.trim();

const ENTR_YAML_EXCERPT = `
name: ENTR Override
version: 1
colors:
  primary: "#6BEBA5"
overrides:
  dark:
    primary-text: "#1E1F21"
`.trim();

function makeInput(yaml: string): AdapterInput {
  const data = generateThemeData(yaml);
  return { primitives: data.primitives, tokens: data.tokens, config: data.config };
}

// ── D1: JSON Schema accepts `label` and `default-mode` ───────────────────────

describe("D1 — visor-theme.schema.json (both copies)", () => {
  const schemaFiles = [
    resolvePath(__dirname, "../visor-theme.schema.json"),
    resolvePath(__dirname, "../../../../docs/visor-theme.schema.json"),
  ];

  for (const schemaPath of schemaFiles) {
    const relativePath = schemaPath.includes("docs/") ? "docs copy" : "theme-engine copy";

    it(`${relativePath}: contains 'label' property`, () => {
      const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
      expect(schema.properties).toHaveProperty("label");
      expect(schema.properties.label.type).toBe("string");
    });

    it(`${relativePath}: contains 'default-mode' property`, () => {
      const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
      expect(schema.properties).toHaveProperty("default-mode");
      expect(schema.properties["default-mode"].type).toBe("string");
      expect(schema.properties["default-mode"].enum).toContain("light");
      expect(schema.properties["default-mode"].enum).toContain("dark");
    });

    it(`${relativePath}: additionalProperties is false (strictness preserved)`, () => {
      const schema = JSON.parse(readFileSync(schemaPath, "utf-8"));
      expect(schema.additionalProperties).toBe(false);
    });
  }
});

// ── D2: docs adapter uses triple-negation prefers-color-scheme selector ───────

describe("D2 — docs adapter prefers-color-scheme selector", () => {
  const css = docsAdapter(makeInput(MINIMAL_YAML));
  const TRIPLE_NEG = '.correctness-test-theme:not(.light):not(.theme-light):not([data-theme="light"])';

  it("emits the triple-negation selector inside prefers-color-scheme: dark media queries", () => {
    expect(css).toContain(TRIPLE_NEG);
  });

  it("does NOT use single-negation in the visor-adaptive prefers-color-scheme blocks", () => {
    // The visor-adaptive layer's @media blocks were using single-negation (inert on
    // the scope class). Verify the pattern that used to appear there is absent from
    // those blocks. Note: visor-brand still uses single-negation (separate concern,
    // not in D2 scope) — we only assert the adaptive + semantic layers are fixed.
    const adaptiveLayerMatch = css.match(/@layer visor-adaptive \{([\s\S]*?)\n\}(?=\n|$)/);
    const adaptiveLayer = adaptiveLayerMatch ? adaptiveLayerMatch[1] : "";
    // The adaptive layer's @media blocks should NOT have the bare single-negation.
    expect(adaptiveLayer).not.toMatch(/\.correctness-test-theme:not\(\.light\)\s*\{/);

    const semanticLayerMatch = css.match(/@layer visor-semantic \{([\s\S]*?)\n\}(?=\n|$)/);
    const semanticLayer = semanticLayerMatch ? semanticLayerMatch[1] : "";
    expect(semanticLayer).not.toMatch(/\.correctness-test-theme:not\(\.light\)\s*\{/);
  });

  it("all four prefers-color-scheme blocks use the triple-negation selector", () => {
    // Text, Surface, Border, Interactive adaptive blocks + intent + hairline
    // semantics = at least 4 uses of the triple-neg selector inside media queries.
    const mediaBlocks = css.split("@media (prefers-color-scheme: dark)");
    // Remove first element (before first @media) to get only @media contents.
    const blocksWithTripleNeg = mediaBlocks
      .slice(1)
      .filter((block) => block.includes(TRIPLE_NEG));
    expect(blocksWithTripleNeg.length).toBeGreaterThanOrEqual(4);
  });
});

// ── D3: schema.ts accepts `label` + `default-mode` at the config level ───────
// (Generator threading is integration-tested via generate-private-themes.test.ts;
//  here we verify the pipeline parses the fields without errors.)

describe("D3 — label + default-mode parse cleanly through generateThemeData", () => {
  it("parses a theme YAML with label and default-mode without throwing", () => {
    expect(() => generateThemeData(YAML_WITH_DEFAULT_MODE)).not.toThrow();
  });

  it("config carries the label value", () => {
    const data = generateThemeData(YAML_WITH_DEFAULT_MODE);
    expect(data.config.label).toBe("Dark Locked Theme");
  });

  it("config carries the default-mode value", () => {
    const data = generateThemeData(YAML_WITH_DEFAULT_MODE);
    expect(data.config["default-mode"]).toBe("dark");
  });
});

// ── D4: --primary-text is a single-source alias of --interactive-primary-text ─

describe("D4 — --primary-text is a single-source alias of --interactive-primary-text", () => {
  it("emits --primary-text: var(--interactive-primary-text) in the default case (no override)", () => {
    const css = docsAdapter(makeInput(MINIMAL_YAML));
    expect(css).toContain("--primary-text: var(--interactive-primary-text);");
  });

  it("does NOT emit a bare #ffffff constant for --primary-text (no longer duplicated)", () => {
    const css = docsAdapter(makeInput(MINIMAL_YAML));
    // The alias should not appear as the old hardcoded #ffffff constant.
    expect(css).not.toContain("--primary-text: #ffffff;");
  });

  it("--interactive-primary-text emits white in the visor-adaptive layer (VI-375: now derived from text-on-dark default for the dark blue button bg)", () => {
    const css = docsAdapter(makeInput(MINIMAL_YAML));
    // VI-375: primary-text is no longer a hardcoded #ffffff constant — it now
    // derives from the paired primary-bg luminance. The minimal blue theme's
    // button bg is dark enough that the auto-pick selects the `text-on-dark`
    // default (#FFFFFF, uppercase from the default), so the rendered text is
    // still white. (Case differs from the old lowercase constant.)
    expect(css).toContain("--interactive-primary-text: #FFFFFF;");
  });

  it("override replaces the alias value (ENTR-style dark override)", () => {
    const css = docsAdapter(makeInput(ENTR_YAML_EXCERPT));
    // ENTR overrides primary-text to graphite in dark mode — override wins.
    expect(css).toContain("--primary-text: #1E1F21;");
    // Light mode remains the alias (no light override in the YAML excerpt).
    expect(css).toContain("--primary-text: var(--interactive-primary-text);");
  });
});
