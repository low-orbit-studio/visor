import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";
import { THEME_GROUPS, ALL_THEMES } from "../theme-config";
import { customThemeGroups } from "../theme-config.custom.generated";

describe("theme-config", () => {
  it("exports THEME_GROUPS with at least one group", () => {
    expect(THEME_GROUPS.length).toBeGreaterThanOrEqual(1);
    for (const group of THEME_GROUPS) {
      expect(group.label).toBeTruthy();
      expect(group.themes.length).toBeGreaterThan(0);
    }
  });

  it("exports ALL_THEMES as flat list of theme values", () => {
    expect(ALL_THEMES).toContain("space");
    expect(ALL_THEMES).toContain("blackout");
    expect(ALL_THEMES).toContain("neutral");
    expect(ALL_THEMES).toContain("modern-minimal");
    expect(ALL_THEMES.length).toBe(
      THEME_GROUPS.reduce((sum, g) => sum + g.themes.length, 0)
    );
  });

  it("has no duplicate theme values", () => {
    const unique = new Set(ALL_THEMES);
    expect(unique.size).toBe(ALL_THEMES.length);
  });

  it("THEME_GROUPS merges STOCK_GROUPS with customThemeGroups", () => {
    // Import STOCK_GROUPS indirectly: THEME_GROUPS = [...STOCK_GROUPS, ...customThemeGroups]
    // If customThemeGroups is empty, THEME_GROUPS.length == STOCK_GROUPS.length (≥1)
    // If customThemeGroups has groups, THEME_GROUPS.length == STOCK + CUSTOM group count
    const expectedLength = THEME_GROUPS.length - customThemeGroups.length;
    expect(expectedLength).toBeGreaterThanOrEqual(1); // at least one stock group
    // All customThemeGroups must appear in THEME_GROUPS
    for (const customGroup of customThemeGroups) {
      expect(THEME_GROUPS.some((g) => g.label === customGroup.label)).toBe(true);
    }
  });
});

describe("themes/ directory registration guard", () => {
  // All *.visor.yaml files in the themes/ directory (stock themes) must be
  // registered in theme-config.ts. Custom themes in custom-themes/ are optional
  // (they are gitignored and only present after running `visor theme sync`).
  // If this test fails, run: visor theme sync
  const repoRoot = resolve(__dirname, "../../../../");
  const themesDir = resolve(repoRoot, "themes");
  const stockYamlFiles = readdirSync(themesDir).filter((f) => f.endsWith(".visor.yaml"));
  const allYamlFiles = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.yamlFile).filter(Boolean));

  it("themes/ directory has at least one stock YAML", () => {
    expect(stockYamlFiles.length).toBeGreaterThan(0);
  });

  it.each(stockYamlFiles)("%s is registered in theme-config", (yamlFile) => {
    const content = readFileSync(resolve(themesDir, yamlFile), "utf-8");
    const parsed = parse(content) as { name?: string };
    if (!parsed?.name) return; // skip YAMLs without a name field
    const slug = parsed.name.toLowerCase().replace(/\s+/g, "-");
    const stem = yamlFile.replace(/\.visor\.yaml$/, "");
    const isRegistered = ALL_THEMES.includes(slug) || allYamlFiles.includes(stem);
    expect(
      isRegistered,
      `${yamlFile} defines theme "${parsed.name}" but it is not registered in theme-config.ts.\n` +
        `Run: visor theme sync`
    ).toBe(true);
  });
});

describe("theme CSS contract", () => {
  const REQUIRED_TOKENS = ["--font-body", "--font-heading"];
  const themesDir = resolve(__dirname, "../../app");

  it.each(ALL_THEMES)("%s defines all required font tokens", (theme) => {
    const css = readFileSync(resolve(themesDir, `${theme}-theme.css`), "utf-8");
    for (const token of REQUIRED_TOKENS) {
      expect(css, `${theme}-theme.css is missing ${token}`).toMatch(
        new RegExp(`${token.replace(/[-/]/g, "\\$&")}\\s*:`)
      );
    }
  });
});

describe("globals.css wordmark rules", () => {
  // The docs layout renders both wordmark-light and wordmark-dark in the DOM.
  // These two CSS rules are what make only one visible at a time.
  // If they go missing, BOTH wordmarks render simultaneously.
  const globalsPath = resolve(__dirname, "../../app/globals.css");
  const globals = readFileSync(globalsPath, "utf-8");

  it("hides wordmark-light in dark mode", () => {
    expect(globals).toContain(".dark .wordmark-light { display: none; }");
  });

  it("hides wordmark-dark in light mode", () => {
    expect(globals).toContain("html:not(.dark) .wordmark-dark { display: none; }");
  });

  it("has overlay @import after END visor-theme-imports marker", () => {
    const endMarker = "/* END visor-theme-imports */";
    const endIdx = globals.indexOf(endMarker);
    expect(endIdx).toBeGreaterThan(-1);
    const afterMarker = globals.slice(endIdx + endMarker.length);
    expect(afterMarker.trimStart()).toMatch(/^@import '\.\/custom-themes\.generated\.css';/);
  });
});
