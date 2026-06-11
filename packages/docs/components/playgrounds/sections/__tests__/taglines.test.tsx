import { render, screen, within, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrandStrategy`'s
// return value. The factory default is a passthrough to the real resolver
// (mirrors strategy.test.tsx / verbal.test.tsx), so the render suite exercises the
// real Visor Brand Record while the private-brand suite can force a null result.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy) };
});

import { TaglinesSection } from "../taglines";
import {
  resolveBrandStrategy,
  VISOR_BRAND_STRATEGY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

describe("TaglinesSection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveStrategy.mockClear();
  });

  it("renders taglines and boilerplate from the Brand Record", () => {
    const { container } = render(<TaglinesSection />);

    // Taglines — each tagline rendered at display scale.
    const taglinesSection = container.querySelector('[data-slot="taglines-taglines"]') as HTMLElement;
    expect(taglinesSection).not.toBeNull();
    for (const tagline of VISOR_BRAND_STRATEGY.taglines) {
      expect(within(taglinesSection).getByText(tagline)).toBeInTheDocument();
    }

    // Boilerplate — short and long labeled blocks.
    const boilerplateSection = container.querySelector('[data-slot="taglines-boilerplate"]') as HTMLElement;
    expect(boilerplateSection).not.toBeNull();

    const shortBlock = boilerplateSection.querySelector('[data-slot="boilerplate-short"]') as HTMLElement;
    expect(shortBlock).not.toBeNull();
    expect(within(shortBlock).getByText(VISOR_BRAND_STRATEGY.boilerplate.short)).toBeInTheDocument();

    const longBlock = boilerplateSection.querySelector('[data-slot="boilerplate-long"]') as HTMLElement;
    expect(longBlock).not.toBeNull();
    expect(within(longBlock).getByText(VISOR_BRAND_STRATEGY.boilerplate.long)).toBeInTheDocument();
  });

  it("resolves the record for the default (stock) theme on mount", () => {
    render(<TaglinesSection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("re-resolves when a visor-theme-change event fires", () => {
    // The Workbench surface follows the Explorer's theme switch via the same
    // `visor-theme-change` event the Brand/Strategy/Verbal sections listen for.
    render(<TaglinesSection />);
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
    render(<TaglinesSection theme="blackout" />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("blackout");
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("space");
  });

  it("falls back to the stored theme when no prop is given (single-pane unchanged)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<TaglinesSection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });
});

describe("TaglinesSection — private brand (no public record)", () => {
  // Last suite in the file: it pins resolveBrandStrategy to null, which persists
  // past mockClear, so it must not precede the passthrough-reliant suites above.
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice and renders no taglines/boilerplate blocks when there is no public strategy", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<TaglinesSection />);

    expect(screen.getByText(/taglines and boilerplate are private/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="taglines-taglines"]')).toBeNull();
    expect(container.querySelector('[data-slot="taglines-boilerplate"]')).toBeNull();
  });
});
