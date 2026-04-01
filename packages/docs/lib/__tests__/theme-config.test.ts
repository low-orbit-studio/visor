import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
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
