import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so tests can drive both resolvers. The factory default
// is a passthrough to the real resolvers (mirrors brand.test.tsx / strategy.test.tsx),
// so the render suite exercises the real Visor brand + Brand Record, while the
// private-brand suite can force a null strategy and a custom brand can prove the
// guideline tokens are read.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return {
    ...actual,
    resolveBrand: vi.fn(actual.resolveBrand),
    resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy),
  };
});

import { LogoGuidelinesSection } from "../logo-guidelines";
import {
  resolveBrand,
  resolveBrandStrategy,
  VISOR_DEFAULT_BRAND,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveBrand = vi.mocked(resolveBrand);
const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

describe("LogoGuidelinesSection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveBrand.mockClear();
    mockedResolveStrategy.mockClear();
  });

  it("renders the clearspace, min-size, and misuse panels", () => {
    const { container } = render(<LogoGuidelinesSection />);
    expect(container.querySelector('[data-slot="logo-clearspace"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="logo-minsize"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="logo-misuse"]')).not.toBeNull();
  });

  it("draws the marks from the resolved monochrome lockup (mask-image + currentColor)", () => {
    const { container } = render(<LogoGuidelinesSection />);
    const mark = container.querySelector('[data-slot="logo-clearspace"] [data-slot="mark"]') as HTMLElement;
    // Mode-safe: a currentColor-tinted masked span, not a fixed-color <img> raster.
    expect(mark.tagName).toBe("SPAN");
    expect(mark.style.getPropertyValue("--mono-src")).toContain("visor-monochrome.svg");
    expect(container.querySelector('[data-slot="logo-clearspace"] img')).toBeNull();
  });

  it("reads clearSpace from the resolved brand and shows it as the safe-zone padding", () => {
    mockedResolveBrand.mockReturnValue({ ...VISOR_DEFAULT_BRAND, clearSpace: "0.75rem" });
    const { container } = render(<LogoGuidelinesSection />);

    // Surfaced as a readable value…
    const value = container.querySelector('[data-slot="clearspace-value"]') as HTMLElement;
    expect(value.textContent).toContain("0.75rem");

    // …and applied as the ring's padding (the clear zone around the mark).
    const ring = container.querySelector('[data-slot="clearspace-ring"]') as HTMLElement;
    expect(ring.style.padding).toBe("0.75rem");
  });

  it("derives each min-size sample's width from the resolved aspectRatio (explicit, never collapses)", () => {
    mockedResolveBrand.mockReturnValue({ ...VISOR_DEFAULT_BRAND, aspectRatio: "3 / 1" });
    const { container } = render(<LogoGuidelinesSection />);

    const marks = container.querySelectorAll('[data-slot="minsize-item"] [data-slot="mark"]');
    expect(marks.length).toBeGreaterThan(0);
    marks.forEach((mark) => {
      const el = mark as HTMLElement;
      const h = parseFloat(el.style.height); // px
      // Width is set explicitly = height × ratio (3), so the masked span has a real box.
      expect(el.style.width).toBe(`${h * 3}px`);
    });
  });

  it("still sizes the mark when the brand declares no aspectRatio (private/custom themes)", () => {
    // Private themes carry a mark but omit the guideline tokens — the box must not
    // collapse to zero width (the dark-on-dark/invisible regression).
    const noRatio = { ...VISOR_DEFAULT_BRAND };
    delete noRatio.aspectRatio;
    mockedResolveBrand.mockReturnValue(noRatio);
    const { container } = render(<LogoGuidelinesSection />);

    const mark = container.querySelector('[data-slot="logo-clearspace"] [data-slot="mark"]') as HTMLElement;
    // Falls back to the lockup ratio → a non-zero rem width.
    expect(mark.style.width).toMatch(/^[\d.]+rem$/);
    expect(parseFloat(mark.style.width)).toBeGreaterThan(0);
  });

  it("renders the full set of misuse don'ts for the Visor brand", () => {
    const { container } = render(<LogoGuidelinesSection />);
    const misuse = container.querySelector('[data-slot="logo-misuse"]') as HTMLElement;
    const items = misuse.querySelectorAll('[data-slot="misuse-item"]');
    expect(items.length).toBe(6);
    // Each don't is drawn on the real mark.
    expect(misuse.querySelectorAll('[data-slot="mark"]').length).toBe(6);
  });

  it("resolves the brand and strategy for the default (stock) theme on mount", () => {
    render(<LogoGuidelinesSection />);
    expect(mockedResolveBrand).toHaveBeenCalledWith(DEFAULT_THEME);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("re-resolves when a visor-theme-change event fires", () => {
    // The Workbench surface follows the Explorer's theme switch via the same
    // `visor-theme-change` event the Brand section listens for. (Event-fires
    // assertion in the theme-config.test.ts:89 style.)
    render(<LogoGuidelinesSection />);
    mockedResolveBrand.mockClear();
    mockedResolveStrategy.mockClear();

    // A stock theme — stable across public/private builds — so getStoredTheme accepts it.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    act(() => {
      document.dispatchEvent(new CustomEvent("visor-theme-change"));
    });

    expect(mockedResolveBrand).toHaveBeenCalledWith("space");
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });

  it("resolves brand + strategy from the theme prop, not the stored theme (matrix row / compare pane)", () => {
    // A multi-theme surface (matrix iframe, compare pane) threads its own theme as
    // a prop. Even with a different theme stored globally, the prop must win — this
    // is the VI-521 fix for row/pane-correct brand content.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<LogoGuidelinesSection theme="blackout" />);
    expect(mockedResolveBrand).toHaveBeenCalledWith("blackout");
    expect(mockedResolveStrategy).toHaveBeenCalledWith("blackout");
    expect(mockedResolveBrand).not.toHaveBeenCalledWith("space");
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("space");
  });

  it("falls back to the stored theme when no prop is given (single-pane unchanged)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<LogoGuidelinesSection />);
    expect(mockedResolveBrand).toHaveBeenCalledWith("space");
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });
});

describe("LogoGuidelinesSection — private brand (no public record)", () => {
  // Last suite in the file: it pins resolveBrandStrategy to null, which persists
  // past mockClear, so it must not precede the passthrough-reliant suites above.
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice for misuse while the geometric rules still render", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<LogoGuidelinesSection />);

    // Misuse copy is brand-keyed — private themes get the candid notice, no don'ts.
    expect(screen.getByText(/misuse rules are part of its private brand record/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="misuse-item"]')).toBeNull();

    // Clearspace + min-size read the asset path, so they render for any theme's marks.
    expect(container.querySelector('[data-slot="logo-clearspace"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="logo-minsize"]')).not.toBeNull();
  });
});
