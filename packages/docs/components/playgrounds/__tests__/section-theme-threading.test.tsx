import { render } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// The matrix panel reads its row theme from `useSearchParams`; jsdom has no Next
// router, so stub it to a fixed `?theme=space&section=strategy` query.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("theme=space&section=strategy&mode=dark"),
}));

// Partial-mock theme-config so we can spy on both brand resolvers while the
// surfaces still render against the real resolvers (passthrough default).
// `resolveBrand` drives BrandSection's marks (the originally-reported regression);
// `resolveBrandStrategy` drives the strategy/verbal/pillars/logo content.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return {
    ...actual,
    resolveBrand: vi.fn(actual.resolveBrand),
    resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy),
  };
});

import { DualPaneView } from "../visual-explorer-pane";
import MatrixPanelPage from "@/app/matrix/panel/page";
import { resolveBrand, resolveBrandStrategy, THEME_STORAGE_KEY } from "@/lib/theme-config";

const mockedResolveBrand = vi.mocked(resolveBrand);
const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);
const noop = () => {};

afterEach(() => {
  localStorage.clear();
  mockedResolveBrand.mockClear();
  mockedResolveStrategy.mockClear();
});

describe("compare pane threads its own theme to brand-keyed sections (VI-521)", () => {
  it("resolves each pane's brand content from that pane's theme, not the shared localStorage", () => {
    // A private slug is stored globally; both panes share one document/localStorage,
    // so without threading both would resolve it. Each pane must follow its own theme.
    localStorage.setItem(THEME_STORAGE_KEY, "veronica");

    render(
      <DualPaneView
        sectionId="strategy"
        themes={["space", "blackout"]}
        mode="dark"
        syncScroll
        onSectionChange={noop}
        onThemeChange={noop}
        onToggleMode={noop}
        onToggleSyncScroll={noop}
      />,
    );

    // Each pane resolved ITS OWN theme — proof the prop is threaded per pane.
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
    expect(mockedResolveStrategy).toHaveBeenCalledWith("blackout");
    // The shared localStorage value never leaks into the brand resolution.
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("veronica");
  });

  it("resolves each pane's brand MARKS from that pane's theme (BrandSection / resolveBrand)", () => {
    // BrandSection — the originally-reported regression — resolves its marks via
    // resolveBrand, a different resolver from strategy. Prove the per-pane threading
    // reaches it too, not just the strategy content.
    localStorage.setItem(THEME_STORAGE_KEY, "veronica");

    render(
      <DualPaneView
        sectionId="brand"
        themes={["space", "blackout"]}
        mode="dark"
        syncScroll
        onSectionChange={noop}
        onThemeChange={noop}
        onToggleMode={noop}
        onToggleSyncScroll={noop}
      />,
    );

    expect(mockedResolveBrand).toHaveBeenCalledWith("space");
    expect(mockedResolveBrand).toHaveBeenCalledWith("blackout");
    expect(mockedResolveBrand).not.toHaveBeenCalledWith("veronica");
  });
});

describe("matrix panel threads its ?theme= to brand-keyed sections (VI-521)", () => {
  it("resolves the row's brand content from the ?theme= query param, not localStorage", () => {
    // Iframes share localStorage; a private slug is stored, but this row is ?theme=space.
    localStorage.setItem(THEME_STORAGE_KEY, "veronica");

    render(<MatrixPanelPage />);

    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("veronica");
  });
});
