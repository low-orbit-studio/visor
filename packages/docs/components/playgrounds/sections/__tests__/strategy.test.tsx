import { render, screen, within, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrandStrategy`'s
// return value. The factory default is a passthrough to the real resolver
// (mirrors brand.test.tsx), so the render suite exercises the real Visor Brand
// Record while the private-brand suite can force a null result.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy) };
});

import { StrategySection } from "../strategy";
import {
  resolveBrandStrategy,
  VISOR_BRAND_STRATEGY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

describe("StrategySection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveStrategy.mockClear();
  });

  it("renders positioning, essence, and personality from the Brand Record", () => {
    const { container } = render(<StrategySection />);

    // Positioning — the onliness wedge + category.
    const positioning = container.querySelector('[data-slot="strategy-positioning"]') as HTMLElement;
    expect(positioning).not.toBeNull();
    expect(
      within(positioning).getByText(VISOR_BRAND_STRATEGY.positioning.onliness)
    ).toBeInTheDocument();
    expect(
      within(positioning).getByText(VISOR_BRAND_STRATEGY.positioning.category)
    ).toBeInTheDocument();

    // Essence — one badge per core word.
    const essence = container.querySelector('[data-slot="strategy-essence"]') as HTMLElement;
    expect(essence).not.toBeNull();
    for (const word of VISOR_BRAND_STRATEGY.essence) {
      expect(within(essence).getByText(word)).toBeInTheDocument();
    }

    // Personality — one card per trait, each paired with its antonym.
    const personality = container.querySelector('[data-slot="strategy-personality"]') as HTMLElement;
    expect(personality).not.toBeNull();
    const cards = personality.querySelectorAll("[data-trait]");
    expect(cards.length).toBe(VISOR_BRAND_STRATEGY.personality.length);
    for (const p of VISOR_BRAND_STRATEGY.personality) {
      expect(within(personality).getByText(p.trait)).toBeInTheDocument();
      expect(within(personality).getByText(`not ${p.not}`)).toBeInTheDocument();
    }
  });

  it("resolves the record for the default (stock) theme on mount", () => {
    render(<StrategySection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("re-resolves when a visor-theme-change event fires", () => {
    // The Workbench surface follows the Explorer's theme switch via the same
    // `visor-theme-change` event the Brand section listens for. (Event-fires
    // assertion in the theme-config.test.ts:89 style.)
    render(<StrategySection />);
    mockedResolveStrategy.mockClear();

    // A stock theme — stable across public/private builds — so getStoredTheme accepts it.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    act(() => {
      document.dispatchEvent(new CustomEvent("visor-theme-change"));
    });

    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });

  it("resolves brand content from the theme prop, not the stored theme (matrix row / compare pane)", () => {
    // A multi-theme surface (matrix iframe, compare pane) threads its own theme as
    // a prop. Even with a different theme stored globally, the prop must win — this
    // is the VI-521 fix for row/pane-correct brand content.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<StrategySection theme="blackout" />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("blackout");
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("space");
  });

  it("falls back to the stored theme when no prop is given (single-pane unchanged)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<StrategySection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });
});

describe("StrategySection — private brand (no public record)", () => {
  // Last suite in the file: it pins resolveBrandStrategy to null, which persists
  // past mockClear, so it must not precede the passthrough-reliant suites above.
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice and renders no strategy blocks when there is no public strategy", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<StrategySection />);

    expect(screen.getByText(/brand strategy is private/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="strategy-positioning"]')).toBeNull();
    expect(container.querySelector('[data-slot="strategy-essence"]')).toBeNull();
    expect(container.querySelector('[data-slot="strategy-personality"]')).toBeNull();
  });
});
