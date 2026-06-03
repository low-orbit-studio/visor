import { describe, it, expect } from "vitest";
import {
  getMatrixThemeGroups,
  resolveEffectiveMode,
  isLocked,
  type MatrixTheme,
} from "../matrix-themes";
import { PRIVATE_THEMES } from "../private-themes";

const adaptive: MatrixTheme = { slug: "blackout", label: "Blackout", group: "Visor" };
const darkLocked: MatrixTheme = {
  slug: "blacklight",
  label: "Blacklight",
  group: "Low Orbit",
  defaultMode: "dark",
};
const lightLocked: MatrixTheme = {
  slug: "paper",
  label: "Paper",
  group: "Test",
  defaultMode: "light",
};

describe("getMatrixThemeGroups", () => {
  it("returns the stock Visor group with all five stock themes", () => {
    const stock = getMatrixThemeGroups("stock");
    expect(stock).toHaveLength(1);
    expect(stock[0].group).toBe("Visor");
    expect(stock[0].themes.map((t) => t.slug)).toEqual([
      "blackout",
      "borderless",
      "modern-minimal",
      "neutral",
      "space",
    ]);
    // Every stock row carries its group label.
    expect(stock[0].themes.every((t) => t.group === "Visor")).toBe(true);
  });

  it("orders `all` as stock → custom → private", () => {
    const all = getMatrixThemeGroups("all");
    expect(all[0].group).toBe("Visor");
    const stockCount = getMatrixThemeGroups("stock").length;
    const customCount = getMatrixThemeGroups("custom").length;
    const privateCount = getMatrixThemeGroups("private").length;
    expect(all).toHaveLength(stockCount + customCount + privateCount);
  });

  it("returns an array for custom even when no custom themes are installed", () => {
    expect(Array.isArray(getMatrixThemeGroups("custom"))).toBe(true);
  });

  it("buckets every installed private theme under its own group exactly once", () => {
    // Robust to the empty-private case (public clones generate an empty manifest).
    if (PRIVATE_THEMES.length === 0) return;
    const priv = getMatrixThemeGroups("private");
    const flat = priv.flatMap((g) => g.themes);
    expect(flat).toHaveLength(PRIVATE_THEMES.length);
    for (const t of priv) {
      // Each group bucket only holds themes whose group matches the heading.
      expect(t.themes.every((th) => th.group === t.group)).toBe(true);
    }
    // No duplicate group headings.
    const groups = priv.map((g) => g.group);
    expect(new Set(groups).size).toBe(groups.length);
  });
});

describe("isLocked", () => {
  it("is true only when a defaultMode is declared", () => {
    expect(isLocked(adaptive)).toBe(false);
    expect(isLocked(darkLocked)).toBe(true);
    expect(isLocked(lightLocked)).toBe(true);
  });
});

describe("resolveEffectiveMode", () => {
  it("adaptive themes follow the Light/Dark selector", () => {
    expect(resolveEffectiveMode(adaptive, "light")).toBe("light");
    expect(resolveEffectiveMode(adaptive, "dark")).toBe("dark");
  });

  it("adaptive themes fall back to dark under Default (never the browser)", () => {
    expect(resolveEffectiveMode(adaptive, "default")).toBe("dark");
  });

  it("locked themes always render their defaultMode, ignoring the selector", () => {
    for (const sel of ["light", "dark", "default"] as const) {
      expect(resolveEffectiveMode(darkLocked, sel)).toBe("dark");
      expect(resolveEffectiveMode(lightLocked, sel)).toBe("light");
    }
  });
});
