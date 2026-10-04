import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { getContrastRatio } from "@loworbitstudio/visor-theme-engine";

/**
 * Primary interactive pair contrast (VI-689, VI-697).
 *
 * Reads the EMITTED `dist/themes/<slug>.css` (what visor-core ships), not the
 * yaml literal, so an override that never reaches the CSS cannot pass. Needs
 * `npm run build -w packages/tokens` first, like the other emitted-CSS tests.
 *
 * Neutral, space and modern-minimal are asserted at 4.5:1 (WCAG 2.2 AA, 1.4.3).
 * Every other shipped theme is measured and reported only: the table prints,
 * nothing fails.
 */

const AA_TEXT = 4.5;
const THEMES_DIR = join(__dirname, "..", "..", "dist", "themes");
const NON_THEME = new Set(["light", "dark"]);
const ASSERTED = ["neutral", "space", "modern-minimal"];

type Mode = "light" | "dark";

/** Value of `--prop` inside the first rule whose selector starts with `prefix`. */
function emitted(css: string, slug: string, mode: Mode, prop: string): string | null {
  const prefix = mode === "light" ? `html:not(.dark) .${slug}-theme` : `.dark .${slug}-theme`;
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of bare.matchAll(ruleRe)) {
    if (!m[1].trim().startsWith(prefix)) continue;
    const decl = m[2].match(new RegExp(`--${prop}:\\s*([^;]+);`));
    if (decl) return decl[1].trim();
  }
  return null;
}

function ratio(css: string, slug: string, mode: Mode, bg: string, fg: string): number | null {
  const b = emitted(css, slug, mode, bg);
  const f = emitted(css, slug, mode, fg);
  if (!b || !f || !b.startsWith("#") || !f.startsWith("#")) return null;
  return getContrastRatio(b, f);
}

const slugs = readdirSync(THEMES_DIR)
  .filter((f) => f.endsWith(".css"))
  .map((f) => f.replace(/\.css$/, ""))
  .filter((s) => !NON_THEME.has(s))
  .sort();

describe.each(ASSERTED)("%s primary pair meets AA text contrast", (slug) => {
  const css = readFileSync(join(THEMES_DIR, `${slug}.css`), "utf8");
  const pairs: Array<[string, string]> = [
    ["interactive-primary-bg", "interactive-primary-text"],
    ["interactive-primary-bg-hover", "interactive-primary-text"],
    ["interactive-primary-bg-active", "interactive-primary-text"],
  ];

  for (const mode of ["light", "dark"] as const) {
    it.each(pairs)(`%s vs %s in ${mode} is at least 4.5:1`, (bg, fg) => {
      const r = ratio(css, slug, mode, bg, fg);
      expect(r, `${bg} / ${fg} not emitted for ${mode}`).not.toBeNull();
      expect(r!).toBeGreaterThanOrEqual(AA_TEXT);
    });
  }
});

describe("primary pair contrast across shipped themes (report only)", () => {
  it("measures every theme and prints the table", () => {
    const rows: string[] = ["| theme | mode | bg | text | ratio | AA 4.5:1 |", "|---|---|---|---|---|---|"];
    for (const slug of slugs) {
      const css = readFileSync(join(THEMES_DIR, `${slug}.css`), "utf8");
      for (const mode of ["light", "dark"] as const) {
        const bg = emitted(css, slug, mode, "interactive-primary-bg");
        const fg = emitted(css, slug, mode, "interactive-primary-text");
        const r = ratio(css, slug, mode, "interactive-primary-bg", "interactive-primary-text");
        rows.push(
          `| ${slug} | ${mode} | ${bg} | ${fg} | ${r === null ? "n/a" : r.toFixed(2)} | ${
            r === null ? "unresolved" : r >= AA_TEXT ? "pass" : "FAIL"
          } |`,
        );
      }
    }
    console.log(`\n${rows.join("\n")}\n`);
    for (const slug of ASSERTED) expect(slugs).toContain(slug);
  });
});
