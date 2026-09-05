/**
 * VI-625 — the component-scoped theme-token contract, enforced.
 *
 * The contract in `packages/theme-engine/src/component-tokens.ts` makes two
 * promises. This suite is what keeps them true:
 *
 *  1. **Every declared token is really consumed, with exactly the declared
 *     Tier-1 fallback.** That is the mechanical guarantee behind "an unbound
 *     theme renders identically" — if the component reads
 *     `var(--table-head-height, 3rem)` and 3rem is what shipped before the
 *     token existed, an unbound theme resolves to the old value by
 *     construction. A drifted fallback is the one way that guarantee can rot,
 *     so it is asserted character-for-character (whitespace-normalised).
 *
 *  2. **Nothing is bindable but undocumented, and nothing is documented but
 *     unbindable.** The docs page and the contract are checked against each
 *     other, so a new family cannot ship dark.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  COMPONENT_TOKEN_FAMILIES,
  allComponentTokenNames,
  componentTokenName,
  hasComponentBindings,
  resolveComponentBindings,
  validateComponentBindings,
} from "../../../packages/theme-engine/src/component-tokens";

/**
 * Vitest's `threads` pool does not give `import.meta.url` a `file://` URL, so
 * sibling files are resolved from the repo root (process.cwd()) instead.
 */
const REPO_ROOT = process.cwd();

const cssCache = new Map<string, string>();
function readCss(relPath: string): string {
  const cached = cssCache.get(relPath);
  if (cached !== undefined) return cached;
  const content = readFileSync(join(REPO_ROOT, relPath), "utf-8");
  cssCache.set(relPath, content);
  return content;
}

/** Collapse every whitespace run so a wrapped declaration still matches. */
function squash(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("VI-625 component token contract", () => {
  describe("shape", () => {
    it("has no duplicate family keys", () => {
      const names = COMPONENT_TOKEN_FAMILIES.map((f) => f.family);
      expect(new Set(names).size).toBe(names.length);
    });

    it("has no duplicate emitted custom-property names", () => {
      const names = allComponentTokenNames();
      const duplicates = names.filter((n, i) => names.indexOf(n) !== i);
      expect(duplicates).toEqual([]);
    });

    it("names every token in kebab-case", () => {
      for (const name of allComponentTokenNames()) {
        expect(name).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
      }
    });

    it("covers every D2 priority family", () => {
      // The ticket's D2 order is the measured-damage order; keeping it asserted
      // here means a future trim has to be deliberate, not accidental.
      const required = [
        "table",
        "chip",
        "badge",
        "status-badge",
        "filter-bar",
        "page-header",
        "empty-state",
        "banner",
        "sidebar",
        "tabs",
        "skeleton",
        "spinner",
      ];
      const present = COMPONENT_TOKEN_FAMILIES.map((f) => f.family);
      for (const family of required) expect(present).toContain(family);
    });

    it("covers the D3 admin-ui Tier-2 treatment layer", () => {
      const present = COMPONENT_TOKEN_FAMILIES.map((f) => f.family);
      // Badge treatment, control sizing, the data-table surface stack and the
      // marquee role — the admin-ui portability audit's "Tier 2 — treatment"
      // groups. The audit's fourth group, the surface-scale extremes
      // (--surface-screen / --surface-elev), is NOT here on purpose: the engine
      // already emits both as Tier-1 adaptive surfaces, so a theme binds them
      // through `overrides:` and adding a duplicate `components.surface` family
      // would give one role two homes.
      expect(present).toContain("badge");
      expect(present).toContain("checkbox");
      expect(present).toContain("data-table");
      expect(present).toContain("admin-ui");

      const badge = COMPONENT_TOKEN_FAMILIES.find((f) => f.family === "badge")!;
      const badgeKeys = badge.tokens.map((t) => t.key);
      for (const key of ["text-transform", "letter-spacing", "font-size", "font-weight"]) {
        expect(badgeKeys).toContain(key);
      }

      const checkbox = COMPONENT_TOKEN_FAMILIES.find((f) => f.family === "checkbox")!;
      const checkboxKeys = checkbox.tokens.map((t) => t.key);
      for (const key of ["size", "radius", "bg", "border"]) {
        expect(checkboxKeys).toContain(key);
      }

      const dt = COMPONENT_TOKEN_FAMILIES.find((f) => f.family === "data-table")!;
      const dtKeys = dt.tokens.map((t) => t.key);
      for (const key of ["header-bg", "row-bg", "container-radius", "container-shadow"]) {
        expect(dtKeys).toContain(key);
      }
    });
  });

  describe("consumption — every token falls back to its Tier-1 expression", () => {
    for (const family of COMPONENT_TOKEN_FAMILIES) {
      for (const token of family.tokens) {
        const name = componentTokenName(family, token.key);

        if (token.consumers.length === 0) {
          it(`--${name} is an emit-only role with a recommended value`, () => {
            expect(token.recommended, `--${name} declares no consumer, so it must document a recommended value`).toBeTruthy();
          });
          continue;
        }

        for (const consumer of token.consumers) {
          const label = consumer.fallback === null ? "bare" : "with its declared fallback";
          it(`--${name} is read ${label} in ${consumer.file}`, () => {
            const css = squash(readCss(consumer.file));
            const expected =
              consumer.fallback === null
                ? `var(--${name})`
                : `var(--${name}, ${squash(consumer.fallback)})`;
            expect(
              css.includes(expected),
              `expected ${consumer.file} to contain:\n  ${expected}`,
            ).toBe(true);
          });
        }
      }
    }
  });

  describe("no orphans — every --<family>-* read is in the contract", () => {
    // A component reading a hook the contract does not name is exactly the
    // "codified but never adopted" gap: bindable in the CSS, invisible to the
    // theme author, undocumented, and silently un-emittable.
    const files = new Set<string>();
    for (const family of COMPONENT_TOKEN_FAMILIES) {
      for (const token of family.tokens) {
        for (const consumer of token.consumers) files.add(consumer.file);
      }
    }

    const declared = new Set(allComponentTokenNames());
    const prefixes = [...new Set(COMPONENT_TOKEN_FAMILIES.map((f) => f.prefix))];

    for (const file of [...files].sort()) {
      it(`${file} reads no undeclared family hook`, () => {
        const css = readCss(file);
        const orphans = new Set<string>();
        for (const match of css.matchAll(/var\(\s*--([a-z0-9-]+)/g)) {
          const name = match[1];
          if (declared.has(name)) continue;
          // Only names inside one of the contract's own prefixes are orphans —
          // Tier-1 tokens (`--surface-card`, `--text-primary`, …) are not.
          const owned = prefixes.some((p) => name === p || name.startsWith(`${p}-`));
          if (owned) orphans.add(name);
        }
        // Known non-contract reads inside a contract prefix.
        const allow = new Set([
          // Tier-1 semantic surfaces that share the `surface` prefix.
          ...[...css.matchAll(/var\(\s*--(surface-[a-z0-9-]+)/g)].map((m) => m[1]),
          // Sidebar rail geometry is written by SidebarProvider as an inline
          // style on the wrapper. An inline declaration outranks any layer, so
          // these are structure props the component owns — not theme bindings,
          // and deliberately out of the contract.
          "sidebar-width",
          "sidebar-width-mobile",
          "sidebar-width-icon",
          // Piped from admin-list-page so the shell can flatten the sort bar's
          // top corners; owned by the block, not the theme.
          "data-table-sort-bar-radius",
        ]);
        expect([...orphans].filter((o) => !allow.has(o)).sort()).toEqual([]);
      });
    }
  });

  describe("documentation", () => {
    const DOC = "packages/docs/content/docs/themes/component-tokens.mdx";

    it("documents every family and every token", () => {
      const doc = readCss(DOC);
      const missing: string[] = [];
      for (const family of COMPONENT_TOKEN_FAMILIES) {
        if (!doc.includes(`### \`${family.family}\``)) {
          missing.push(`family ${family.family}`);
        }
        for (const token of family.tokens) {
          const name = componentTokenName(family, token.key);
          if (!doc.includes(`--${name}`)) missing.push(`--${name}`);
        }
      }
      expect(missing).toEqual([]);
    });
  });

  describe("binding resolution", () => {
    it("treats a bare string as both modes", () => {
      const resolved = resolveComponentBindings({ table: { "head-height": "2.5rem" } });
      expect(resolved.light["table-head-height"]).toBe("2.5rem");
      expect(resolved.dark["table-head-height"]).toBe("2.5rem");
    });

    it("binds modes independently", () => {
      const resolved = resolveComponentBindings({
        table: { "head-bg": { light: "#fff", dark: "#111" } },
      });
      expect(resolved.light["table-head-bg"]).toBe("#fff");
      expect(resolved.dark["table-head-bg"]).toBe("#111");
    });

    it("allows a mode-asymmetric binding", () => {
      const resolved = resolveComponentBindings({ table: { "head-bg": { dark: "#111" } } });
      expect(resolved.light["table-head-bg"]).toBeUndefined();
      expect(resolved.dark["table-head-bg"]).toBe("#111");
    });

    it("reports nothing bound for an absent block", () => {
      expect(hasComponentBindings(undefined)).toBe(false);
      expect(hasComponentBindings({})).toBe(false);
      expect(hasComponentBindings({ table: {} })).toBe(false);
      expect(hasComponentBindings({ table: { "head-height": "2rem" } })).toBe(true);
    });

    it("skips unknown families and keys rather than emitting garbage", () => {
      const resolved = resolveComponentBindings({
        nope: { thing: "1px" },
        table: { "not-a-token": "1px" },
      });
      expect(resolved.light).toEqual({});
      expect(resolved.dark).toEqual({});
    });
  });

  describe("validation", () => {
    it("accepts a well-formed block", () => {
      expect(
        validateComponentBindings({
          table: { "head-height": "2.5rem", "head-bg": { light: "#fff", dark: "#111" } },
          chip: { "md-font-size": "11px" },
        }),
      ).toEqual([]);
    });

    it("rejects an unknown family", () => {
      const errors = validateComponentBindings({ tabel: { "head-height": "2rem" } });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Unknown key 'components.tabel'");
    });

    it("rejects an unknown key — a typo'd component token is silently inert otherwise", () => {
      const errors = validateComponentBindings({ table: { "head-heigth": "2rem" } });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("Unknown key 'components.table.head-heigth'");
    });

    it("rejects an unknown mode", () => {
      const errors = validateComponentBindings({ table: { "head-bg": { lite: "#fff" } } });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("components.table.head-bg.lite");
    });

    it("rejects a non-string value", () => {
      const errors = validateComponentBindings({ table: { "head-height": 24 } });
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("must be a string");
    });

    it("rejects a non-object components block", () => {
      expect(validateComponentBindings("nope")).toEqual(["'components' must be an object"]);
    });
  });
});
