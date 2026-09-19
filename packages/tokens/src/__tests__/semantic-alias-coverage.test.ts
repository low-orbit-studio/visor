import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import {
  generateThemeData,
  VISOR_CORE_SEMANTIC_ALIASES,
  collectDeclaredProperties,
} from "@loworbitstudio/visor-theme-engine";
import { nextjsAdapter } from "@loworbitstudio/visor-theme-engine/adapters";

/**
 * semantic-alias-coverage (VI-648).
 *
 * `VISOR_CORE_SEMANTIC_ALIASES` lives in `@loworbitstudio/visor-theme-engine`
 * because this package already depends on the engine (its build calls
 * `generateThemeData` + `docsAdapter`), so the reverse import would be a build
 * cycle. That puts the table one package away from the semantic tables that
 * generate it, which is exactly the kind of split that drifts.
 *
 * This is the guard. It compares the table against the **emitted** `tokens.css`
 * rather than against `src/tokens/semantic.ts` — a stronger check, because it
 * measures what actually ships rather than what a constant claims.
 *
 * The invariant: for every `--X: var(--Y)` alias visor-core emits, **either**
 * the theme engine emits `--X` itself on a scoped theme (so the alias is
 * already correct there), **or** `--X` is in the table (so the adapter
 * re-declares it on the scope). An alias satisfying neither is silently pinned
 * to visor-core's `:root` default on every `scopePrefix` theme — the VI-648 bug.
 *
 * Adding an alias to `src/tokens/semantic.ts` without adding it to the engine's
 * table fails here, naming the alias.
 */

const REPO_ROOT = join(__dirname, "..", "..", "..", "..");
const TOKENS_CSS = join(__dirname, "..", "..", "dist", "tokens.css");
const THEMES_DIR = join(REPO_ROOT, "themes");

/** Extract a balanced `@layer <name> { ... }` body. */
function sliceLayer(css: string, name: string): string {
  const start = css.indexOf(`@layer ${name} {`);
  if (start < 0) return "";
  let depth = 0;
  const open = css.indexOf("{", start);
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  return "";
}

/** Every `--X: var(--Y)` indirection visor-core emits in its semantic layer. */
function emittedAliases(css: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of sliceLayer(css, "visor-semantic").matchAll(
    /(--[a-z0-9-]+)\s*:\s*var\((--[a-z0-9-]+)\)\s*;/gi,
  )) {
    if (!out.has(m[1])) out.set(m[1].slice(2), m[2].slice(2));
  }
  return out;
}

describe("semantic-alias-coverage (VI-648)", () => {
  // tokens.css is a build artifact. `npm ci` / `npm install` build it via the
  // root `prepare` script, so it is present in CI; skip rather than fail when a
  // developer runs vitest against an unbuilt tree.
  const built = existsSync(TOKENS_CSS);
  const css = built ? readFileSync(TOKENS_CSS, "utf-8") : "";

  it.runIf(built)("finds visor-core's aliases at all (guards the parser above)", () => {
    expect(emittedAliases(css).size).toBeGreaterThan(50);
  });

  it.runIf(built)("every emitted alias is either engine-owned or in the table", () => {
    const aliases = emittedAliases(css);

    // What the engine emits for a scoped theme, unioned across stock themes —
    // a theme-specific omission must not make an alias look engine-owned.
    const engineOwned = new Set<string>();
    const slugs = readdirSync(THEMES_DIR).filter((f) => f.endsWith(".visor.yaml"));
    expect(slugs.length, "no stock themes found").toBeGreaterThan(0);
    for (const file of slugs) {
      const themeCss = nextjsAdapter(
        generateThemeData(readFileSync(join(THEMES_DIR, file), "utf-8")),
        { scopePrefix: "body.probe" },
      );
      for (const prop of collectDeclaredProperties(themeCss)) engineOwned.add(prop);
    }

    const uncovered: string[] = [];
    for (const [alias, referent] of aliases) {
      if (alias in VISOR_CORE_SEMANTIC_ALIASES) continue;
      if (engineOwned.has(alias)) continue;
      uncovered.push(`--${alias}: var(--${referent})`);
    }

    expect(
      uncovered,
      "These aliases resolve at :root and are silently pinned to visor-core's default on\n" +
        "every scopePrefix theme. Add them to VISOR_CORE_SEMANTIC_ALIASES in\n" +
        "packages/theme-engine/src/semantic-aliases.ts:\n  " +
        uncovered.join("\n  "),
    ).toEqual([]);
  });

  it.runIf(built)("the table names no alias visor-core does not emit", () => {
    const aliases = emittedAliases(css);
    const stale = Object.keys(VISOR_CORE_SEMANTIC_ALIASES).filter((a) => !aliases.has(a));
    expect(
      stale,
      "These are in VISOR_CORE_SEMANTIC_ALIASES but visor-core no longer emits them:\n  " +
        stale.join("\n  "),
    ).toEqual([]);
  });

  it.runIf(built)("the table agrees with visor-core on what each alias resolves through", () => {
    const aliases = emittedAliases(css);
    const mismatched: string[] = [];
    for (const [alias, referent] of Object.entries(VISOR_CORE_SEMANTIC_ALIASES)) {
      const actual = aliases.get(alias);
      if (actual && actual !== referent) {
        mismatched.push(`--${alias}: table says var(--${referent}), tokens.css emits var(--${actual})`);
      }
    }
    expect(mismatched, mismatched.join("\n  ")).toEqual([]);
  });
});
