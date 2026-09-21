import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import {
  VISOR_CORE_SEMANTIC_ALIASES,
  collectDeclaredProperties,
  generateSemanticAliasDecls,
} from "../semantic-aliases.js";
import { generateThemeData } from "../pipeline.js";
import { nextjsAdapter } from "../adapters/nextjs.js";

/**
 * VI-648 — visor-core's semantic aliases are declared on `:root` as
 * `--X: var(--Y)`. Substitution resolves where a property is declared, so on a
 * `scopePrefix` theme those never see the theme's primitives on a descendant
 * scope selector. The adapter re-declares them on the scope.
 *
 * The rendered proof lives in `scripts/rules/scoped-theme-alias-resolution.ts`
 * (real browser `getComputedStyle`). These tests cover the emission contract.
 */

const REPO_ROOT = join(__dirname, "..", "..", "..", "..");
const THEMES_DIR = join(REPO_ROOT, "themes");

const themeSlugs = readdirSync(THEMES_DIR)
  .filter((f) => f.endsWith(".visor.yaml"))
  .map((f) => f.replace(".visor.yaml", ""))
  .sort();

const readTheme = (slug: string) =>
  generateThemeData(readFileSync(join(THEMES_DIR, `${slug}.visor.yaml`), "utf-8"));

const SCOPE = "body.probe";

describe("collectDeclaredProperties", () => {
  it("finds properties declared at the start of a block", () => {
    expect(collectDeclaredProperties(":root {\n  --a: 1;\n}")).toContain("a");
  });

  it("finds properties after a semicolon on the same line", () => {
    const found = collectDeclaredProperties(":root { --a: 1; --b: 2; }");
    expect([...found].sort()).toEqual(["a", "b"]);
  });

  it("does not mistake a var() reference for a declaration", () => {
    const found = collectDeclaredProperties(":root { --a: var(--b); }");
    expect(found.has("a")).toBe(true);
    expect(found.has("b")).toBe(false);
  });
});

describe("generateSemanticAliasDecls", () => {
  it("emits an alias whose referent is declared", () => {
    expect(generateSemanticAliasDecls(new Set(["color-primary-500"])))
      .toContain("--chart-1: var(--color-primary-500);");
  });

  it("skips an alias the theme already declares itself", () => {
    // The live case: the engine emits --font-body as a concrete family in
    // visor-primitives. Re-aliasing it in visor-semantic would win the layer
    // contest and resolve to a token the theme never emitted.
    const declared = new Set(["font-weight-heading", "weight-heading"]);
    expect(generateSemanticAliasDecls(declared)).not.toContain(
      "--weight-heading: var(--font-weight-heading);",
    );
  });

  it("skips an alias whose referent the theme does not declare", () => {
    // Nothing to re-resolve against — inheriting visor-core's :root value is
    // correct, and re-emitting would replace it with an invalid one.
    expect(generateSemanticAliasDecls(new Set())).toEqual([]);
  });

  it("emits nothing at all for an empty declaration set", () => {
    expect(generateSemanticAliasDecls(new Set())).toHaveLength(0);
  });

  it("covers every alias when every referent is declared", () => {
    const allReferents = new Set(Object.values(VISOR_CORE_SEMANTIC_ALIASES));
    const decls = generateSemanticAliasDecls(allReferents);
    expect(decls).toHaveLength(Object.keys(VISOR_CORE_SEMANTIC_ALIASES).length);
  });
});

describe("VISOR_CORE_SEMANTIC_ALIASES", () => {
  it("never maps an alias to itself (which would be a circular reference)", () => {
    for (const [alias, referent] of Object.entries(VISOR_CORE_SEMANTIC_ALIASES)) {
      expect(alias, `${alias} resolves through itself`).not.toBe(referent);
    }
  });

  it("names no alias that is also a referent (no two-hop chains to re-resolve)", () => {
    const referents = new Set(Object.values(VISOR_CORE_SEMANTIC_ALIASES));
    for (const alias of Object.keys(VISOR_CORE_SEMANTIC_ALIASES)) {
      expect(referents.has(alias), `${alias} is both an alias and a referent`).toBe(false);
    }
  });

  it("includes the token VI-648 was filed on", () => {
    expect(VISOR_CORE_SEMANTIC_ALIASES["weight-heading"]).toBe("font-weight-heading");
  });
});

describe.each(themeSlugs)("nextjs adapter — %s", (slug) => {
  it("re-declares the aliases on the scope selector when scoped", () => {
    const css = nextjsAdapter(readTheme(slug), { scopePrefix: SCOPE });
    expect(css).toContain("visor-core alias re-substitution at theme scope (VI-648)");
    expect(css).toContain("--weight-heading: var(--font-weight-heading);");
  });

  it("emits every referent it aliases through, so no re-declaration is invalid", () => {
    // The two-sided filter guarantees this, but assert it per theme: an alias
    // pointing at a token the theme never emits would compute to nothing.
    const css = nextjsAdapter(readTheme(slug), { scopePrefix: SCOPE });
    const declared = collectDeclaredProperties(css);
    for (const line of generateSemanticAliasDecls(declared)) {
      const referent = line.match(/var\(--([a-z0-9-]+)\)/)![1];
      expect(declared.has(referent), `${line} — referent not emitted`).toBe(true);
    }
  });

  it("puts the re-substitution inside the visor-semantic layer", () => {
    const css = nextjsAdapter(readTheme(slug), { scopePrefix: SCOPE });
    const semanticStart = css.indexOf("@layer visor-semantic {");
    const adaptiveStart = css.indexOf("@layer visor-adaptive {");
    const blockStart = css.indexOf("alias re-substitution at theme scope");
    expect(semanticStart).toBeGreaterThan(-1);
    expect(blockStart).toBeGreaterThan(semanticStart);
    expect(blockStart).toBeLessThan(adaptiveStart);
  });

  it("emits nothing new for a :root-scoped theme", () => {
    // A :root theme declares its primitives on the same element visor-core
    // aliases from, so substitution already sees them. Output must not move.
    const css = nextjsAdapter(readTheme(slug));
    expect(css).not.toContain("alias re-substitution at theme scope");
    for (const alias of Object.keys(VISOR_CORE_SEMANTIC_ALIASES)) {
      expect(css, `${alias} leaked into :root output`).not.toContain(`--${alias}: var(`);
    }
  });

  it("adds the scoped block and removes nothing else", () => {
    const scoped = nextjsAdapter(readTheme(slug), { scopePrefix: SCOPE });
    const decls = generateSemanticAliasDecls(collectDeclaredProperties(scoped));
    // Every line the fix contributes is present exactly once.
    for (const line of decls) {
      expect(scoped.split(line).length - 1, `${line} emitted more than once`).toBe(1);
    }
  });
});
