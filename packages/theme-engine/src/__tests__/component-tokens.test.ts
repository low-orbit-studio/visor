/**
 * VI-625 — the theme engine can emit the component-token contract.
 *
 * D5: "a contract the engine cannot distil into is prose." These tests hold the
 * whole path — `.visor.yaml` → schema validation → resolution → emitted CSS —
 * for both adapters that ship theme files, and they hold the D4 invariant from
 * the engine side: a theme with no `components:` block emits *nothing* extra, so
 * generated theme CSS is byte-identical to what it was before the contract.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseConfig, generateThemeData } from "../pipeline.js";
import { validateConfig } from "../schema.js";
import { nextjsAdapter } from "../adapters/nextjs.js";
import { docsAdapter } from "../adapters/docs.js";
import { exportTheme } from "../export.js";
import { resolveConfig } from "../resolve.js";
import {
  COMPONENT_TOKEN_FAMILIES,
  allComponentTokenNames,
  resolveComponentBindings,
} from "../component-tokens.js";
import { generateComponentTokensCss } from "../adapters/component-tokens-css.js";
import type { AdapterInput } from "../adapters/types.js";
import type { VisorThemeConfig } from "../types.js";

/**
 * Vitest's `threads` pool does not give `import.meta.url` a `file://` URL, and
 * cwd differs between a root `vitest run` and `npm test -w packages/theme-engine`
 * — so repo-relative paths are probed from both anchors.
 */
function repoPath(relative: string): string {
  for (const base of [process.cwd(), join(process.cwd(), "../.."), join(process.cwd(), "packages/theme-engine")]) {
    const candidate = join(base, relative);
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`cannot locate ${relative} from ${process.cwd()}`);
}

const FIXTURE = repoPath("packages/theme-engine/src/__tests__/fixtures/fully-bound-components.visor.yaml");

function loadFullyBound(): VisorThemeConfig {
  return parseConfig(readFileSync(FIXTURE, "utf-8"));
}

function adapterInput(config: VisorThemeConfig): AdapterInput {
  const data = generateThemeData(readFileSync(FIXTURE, "utf-8"));
  return {
    config: resolveConfig(config),
    primitives: data.primitives,
    tokens: data.tokens,
  } as AdapterInput;
}

const MINIMAL = `
name: unbound
version: 1
colors:
  primary: "#6b46ff"
`;

describe("VI-625 component-token emission", () => {
  describe("the fixture theme", () => {
    it("parses and validates", () => {
      const config = loadFullyBound();
      const result = validateConfig(config);
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    });

    it("binds every token in the contract — no family half-covered", () => {
      const config = loadFullyBound();
      const resolved = resolveComponentBindings(config.components);
      const missing = allComponentTokenNames().filter((n) => resolved.light[n] === undefined);
      expect(missing).toEqual([]);
    });

    it("survives a round-trip through exportTheme", () => {
      const config = loadFullyBound();
      const data = generateThemeData(readFileSync(FIXTURE, "utf-8"));
      const yaml = exportTheme(data.primitives, resolveConfig(config));
      const reparsed = parseConfig(yaml);
      expect(reparsed.components?.table?.["head-height"]).toBe("37px");
      expect(validateConfig(reparsed).errors).toEqual([]);
    });
  });

  describe("schema validation", () => {
    it("rejects an unknown family", () => {
      const result = validateConfig({
        name: "x",
        version: 1,
        colors: { primary: "#6b46ff" },
        components: { tabel: { "head-height": "2rem" } },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join("\n")).toContain("Unknown key 'components.tabel'");
    });

    it("rejects an unknown token key", () => {
      const result = validateConfig({
        name: "x",
        version: 1,
        colors: { primary: "#6b46ff" },
        components: { table: { "head-heigth": "2rem" } },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join("\n")).toContain("Unknown key 'components.table.head-heigth'");
    });

    it("accepts a real binding", () => {
      const result = validateConfig({
        name: "x",
        version: 1,
        colors: { primary: "#6b46ff" },
        components: { table: { "head-height": "2.5rem", "head-bg": { dark: "#111" } } },
      });
      expect(result.errors).toEqual([]);
    });
  });

  describe("generateComponentTokensCss", () => {
    const selectors = { light: ":root", dark: ".dark", prefers: ":root:not(.light)" };

    it("emits nothing when nothing is bound — the D4 invariant", () => {
      expect(generateComponentTokensCss({ light: {}, dark: {} }, selectors)).toBe("");
    });

    it("emits light on the host and dark on the toggle + prefers query", () => {
      const css = generateComponentTokensCss(
        { light: { "table-head-bg": "#fff" }, dark: { "table-head-bg": "#111" } },
        selectors,
      );
      expect(css).toContain(":root {\n  --table-head-bg: #fff;\n}");
      expect(css).toContain(".dark {\n  --table-head-bg: #111;\n}");
      expect(css).toContain("@media (prefers-color-scheme: dark)");
      expect(css).toContain(":root:not(.light)");
    });

    it("collapses a dark-only brand onto the host selector", () => {
      const css = generateComponentTokensCss(
        { light: { "table-head-bg": "#fff" }, dark: { "table-head-bg": "#111" } },
        selectors,
        "dark-only",
      );
      expect(css).toContain(":root {\n  --table-head-bg: #111;\n}");
      expect(css).not.toContain(".dark {");
      expect(css).not.toContain("prefers-color-scheme");
    });

    it("collapses a light-only brand onto the host selector", () => {
      const css = generateComponentTokensCss(
        { light: { "table-head-bg": "#fff" }, dark: { "table-head-bg": "#111" } },
        selectors,
        "light-only",
      );
      expect(css).toContain(":root {\n  --table-head-bg: #fff;\n}");
      expect(css).not.toContain("prefers-color-scheme");
    });

    it("emits a mode-asymmetric binding in that mode only", () => {
      const css = generateComponentTokensCss(
        { light: {}, dark: { "table-head-bg": "#111" } },
        selectors,
      );
      expect(css).toContain(".dark {");
      expect(css).not.toContain(":root {\n  --table-head-bg");
    });

    it("emits declarations in a stable (sorted) order", () => {
      const css = generateComponentTokensCss(
        { light: { "zz-b": "2px", "aa-a": "1px" }, dark: {} },
        selectors,
      );
      expect(css.indexOf("--aa-a")).toBeLessThan(css.indexOf("--zz-b"));
    });
  });

  describe("nextjs adapter", () => {
    it("emits every bound token inside the visor-adaptive layer", () => {
      const config = loadFullyBound();
      const css = nextjsAdapter(adapterInput(config)) as string;
      const missing = allComponentTokenNames().filter((n) => !css.includes(`--${n}:`));
      expect(missing).toEqual([]);
      expect(css).toContain("Component tokens (VI-625)");
      expect(css).toContain("@layer visor-adaptive {");
    });

    it("emits a representative value from every family", () => {
      const config = loadFullyBound();
      const css = nextjsAdapter(adapterInput(config)) as string;
      for (const family of COMPONENT_TOKEN_FAMILIES) {
        const first = family.tokens[0];
        expect(css, `family ${family.family} missing from output`).toContain(
          `--${family.prefix}-${first.key}:`,
        );
      }
    });

    it("emits no component-token block for a theme that binds nothing", () => {
      const data = generateThemeData(MINIMAL);
      const css = nextjsAdapter({
        config: resolveConfig(parseConfig(MINIMAL)),
        primitives: data.primitives,
        tokens: data.tokens,
      } as AdapterInput) as string;
      expect(css).not.toContain("Component tokens (VI-625)");
      for (const name of allComponentTokenNames()) {
        expect(css).not.toContain(`--${name}:`);
      }
    });
  });

  describe("docs adapter", () => {
    it("emits every bound token, scoped to the theme class", () => {
      const config = loadFullyBound();
      const out = docsAdapter(adapterInput(config));
      const css = typeof out === "string" ? out : Object.values(out).join("\n");
      const missing = allComponentTokenNames().filter((n) => !css.includes(`--${n}:`));
      expect(missing).toEqual([]);
      expect(css).toContain(".fully-bound-components-theme");
    });

    it("emits no component-token block for a theme that binds nothing", () => {
      const data = generateThemeData(MINIMAL);
      const out = docsAdapter({
        config: resolveConfig(parseConfig(MINIMAL)),
        primitives: data.primitives,
        tokens: data.tokens,
      } as AdapterInput);
      const css = typeof out === "string" ? out : Object.values(out).join("\n");
      expect(css).not.toContain("Component tokens (VI-625)");
      for (const name of allComponentTokenNames()) {
        expect(css).not.toContain(`--${name}:`);
      }
    });
  });

  describe("stock themes stay unbound", () => {
    // Fleet-safety: adding a *default* would shift pixels for every project on a
    // Visor theme. No stock theme may bind a component token without a
    // deliberate capture re-bless, so the absence is asserted.
    const stock = ["blackout", "borderless", "modern-minimal", "neutral", "space"];
    for (const slug of stock) {
      it(`${slug} binds no component tokens`, () => {
        const yaml = readFileSync(repoPath(`themes/${slug}.visor.yaml`), "utf-8");
        const config = parseConfig(yaml);
        const resolved = resolveComponentBindings(config.components);
        expect(Object.keys(resolved.light)).toEqual([]);
        expect(Object.keys(resolved.dark)).toEqual([]);
      });
    }
  });
});
