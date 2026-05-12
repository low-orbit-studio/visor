import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrivateThemeSwitcher, buildSwitcherEntries } from "../private-theme-switcher";
import type { PrivateThemeEntry } from "@/lib/private-themes";
import { STOCK_GROUPS, THEME_STORAGE_KEY, applyTheme } from "@/lib/theme-config";

const FIXTURES: PrivateThemeEntry[] = [
  { slug: "alpha", label: "Alpha", group: "Client" },
  { slug: "bravo", label: "Bravo", group: "Client" },
  { slug: "charlie", label: "Charlie", group: "Low Orbit" },
];

describe("PrivateThemeSwitcher", () => {
  beforeEach(() => {
    document.body.className = "";
    try { localStorage.removeItem(THEME_STORAGE_KEY); } catch {}
  });

  afterEach(() => {
    document.body.className = "";
    try { localStorage.removeItem(THEME_STORAGE_KEY); } catch {}
  });

  it("applies the first theme's class to body on mount", () => {
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("alpha-theme")).toBe(true);
  });

  it("renders the active theme label in the trigger", () => {
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha");
  });

  it("removes prior theme class when switching", () => {
    document.body.classList.add("blackout-theme", "some-other-class");
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("blackout-theme")).toBe(false);
    expect(document.body.classList.contains("alpha-theme")).toBe(true);
    expect(document.body.classList.contains("some-other-class")).toBe(true);
  });

  it("falls back to a stock theme when given an empty private list", () => {
    render(<PrivateThemeSwitcher themes={[]} />);
    const classes = Array.from(document.body.classList);
    const themeClass = classes.find((c) => c.endsWith("-theme"));
    expect(themeClass).toBeDefined();
  });

  it("restores the active theme from localStorage on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "bravo");
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("bravo-theme")).toBe(true);
    expect(screen.getByRole("combobox")).toHaveTextContent("Bravo");
  });

  it("ignores stored theme if it isn't in stock or private lists", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "not-a-real-theme");
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("alpha-theme")).toBe(true);
  });

  it("strips a private theme class when switching to a stock theme", () => {
    // Regression guard (VI-351): the shared applyTheme must remove the prior
    // private slug (alpha/bravo/charlie aren't in ALL_THEMES) when the user
    // switches back to a stock theme. Without this, both classes stack and
    // the cascade resolves unpredictably.
    document.body.classList.add("alpha-theme");
    render(<PrivateThemeSwitcher themes={FIXTURES} />);
    expect(document.body.classList.contains("alpha-theme")).toBe(true);

    // Simulate user selecting a stock theme via the public applyTheme path.
    applyTheme("blackout");
    expect(document.body.classList.contains("alpha-theme")).toBe(false);
    expect(document.body.classList.contains("blackout-theme")).toBe(true);
  });
});

describe("buildSwitcherEntries", () => {
  it("merges stock + private into a flat list without de-duping", () => {
    const NINE_PRIVATE: PrivateThemeEntry[] = Array.from({ length: 9 }, (_, i) => ({
      slug: `private-${i}`,
      label: `Private ${i}`,
      group: "Client",
    }));
    const FIVE_STOCK = [
      {
        label: "Visor",
        themes: [
          { value: "blackout", label: "Blackout" },
          { value: "borderless", label: "Borderless" },
          { value: "modern-minimal", label: "Modern Minimal" },
          { value: "neutral", label: "Neutral" },
          { value: "space", label: "Space" },
        ],
      },
    ];
    const merged = buildSwitcherEntries(FIVE_STOCK, NINE_PRIVATE);
    expect(merged).toHaveLength(14);
    const slugs = merged.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(14);
  });

  it("does NOT deduplicate when caller passes overlapping slugs (caller's responsibility)", () => {
    // Sanity: function is a flat merge; the fix is that /themes/private passes
    // STOCK_GROUPS (not THEME_GROUPS) so customThemeGroups overlap can't happen.
    const overlap: PrivateThemeEntry[] = [{ slug: "blackout", label: "Blackout", group: "Client" }];
    const stockOnly = [{ label: "Visor", themes: [{ value: "blackout", label: "Blackout" }] }];
    const merged = buildSwitcherEntries(stockOnly, overlap);
    expect(merged).toHaveLength(2);
  });

  it("produces exactly STOCK_GROUPS.flat + PRIVATE_THEMES.length entries with real STOCK_GROUPS", () => {
    const merged = buildSwitcherEntries(STOCK_GROUPS, FIXTURES);
    const stockCount = STOCK_GROUPS.reduce((sum, g) => sum + g.themes.length, 0);
    expect(merged).toHaveLength(stockCount + FIXTURES.length);
    const slugs = merged.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(merged.length);
  });
});
