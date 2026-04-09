import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";
import { parse } from "yaml";
import { THEME_GROUPS, ALL_THEMES } from "../theme-config";

describe("theme-config", () => {
  it("exports THEME_GROUPS with at least 2 groups", () => {
    expect(THEME_GROUPS.length).toBeGreaterThanOrEqual(2);
    for (const group of THEME_GROUPS) {
      expect(group.label).toBeTruthy();
      expect(group.themes.length).toBeGreaterThan(0);
    }
  });

  it("exports ALL_THEMES as flat list of theme values", () => {
    expect(ALL_THEMES).toContain("space");
    expect(ALL_THEMES).toContain("blackout");
    expect(ALL_THEMES).toContain("neutral");
    expect(ALL_THEMES).toContain("kaiah");
    expect(ALL_THEMES.length).toBe(
      THEME_GROUPS.reduce((sum, g) => sum + g.themes.length, 0)
    );
  });

  it("has no duplicate theme values", () => {
    const unique = new Set(ALL_THEMES);
    expect(unique.size).toBe(ALL_THEMES.length);
  });
});

describe("root theme YAML registration guard", () => {
  // All *.visor.yaml files at the repo root that look like standalone themes
  // (i.e. have a `name` field) must be registered in theme-config.ts.
  // A theme is considered registered if either:
  //   (a) its slugified name matches a `value` in ALL_THEMES, or
  //   (b) its filename stem matches a `yamlFile` field in any registered theme
  //       (e.g. blacklight.visor.yaml → yamlFile: "blacklight" on blacklight-brand)
  // If this test fails, run: npx visor theme register <file>.visor.yaml --group <Group>
  const repoRoot = resolve(__dirname, "../../../../");
  const rootYamlFiles = readdirSync(repoRoot).filter((f) => f.endsWith(".visor.yaml"));
  const allYamlFiles = THEME_GROUPS.flatMap((g) => g.themes.map((t) => t.yamlFile).filter(Boolean));

  it.each(rootYamlFiles)("%s is registered in theme-config", (yamlFile) => {
    const content = readFileSync(resolve(repoRoot, yamlFile), "utf-8");
    const parsed = parse(content) as { name?: string };
    if (!parsed?.name) return; // skip YAMLs without a name (e.g. component configs)
    const slug = parsed.name.toLowerCase().replace(/\s+/g, "-");
    const stem = yamlFile.replace(/\.visor\.yaml$/, "");
    const isRegistered = ALL_THEMES.includes(slug) || allYamlFiles.includes(stem);
    expect(
      isRegistered,
      `${yamlFile} defines theme "${parsed.name}" but it is not registered in theme-config.ts.\n` +
        `Run: npx visor theme register ${yamlFile} --group <Visor|Client|Low Orbit>`
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
