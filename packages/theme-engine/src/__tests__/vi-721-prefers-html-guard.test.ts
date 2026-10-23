/**
 * VI-721 — every `@media (prefers-color-scheme: dark)` block the docs adapter emits
 * must carry the `html:not(.light)` ancestor guard, or OS dark overrides the docs
 * site's explicit light mode (next-themes puts `.light` on <html>).
 */
import { describe, it, expect } from "vitest";
import { generateThemeData } from "../pipeline.js";
import { docsAdapter } from "../adapters/docs.js";

const YAML = `
name: Guard Test
version: 1
colors:
  primary: "#2563EB"
overrides:
  dark:
    primary-text: "#1E1F21"
`.trim();

describe("VI-721 — docs adapter prefers blocks carry the html:not(.light) guard", () => {
  const data = generateThemeData(YAML);
  const css = docsAdapter({ primitives: data.primitives, tokens: data.tokens, config: data.config });

  it("emits at least one prefers block", () => {
    expect(css).toContain("@media (prefers-color-scheme: dark)");
  });

  it("every selector inside a prefers block starts with html:not(.light)", () => {
    const selectors: string[] = [];
    const re = /@media \(prefers-color-scheme: dark\) \{\s*([^{]+)\{/g;
    for (let m = re.exec(css); m; m = re.exec(css)) selectors.push(m[1].trim());
    expect(selectors.length).toBeGreaterThan(0);
    for (const s of selectors) expect(s).toMatch(/^html:not\(\.light\) /);
  });
});
