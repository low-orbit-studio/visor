import { render, screen, within, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrandStrategy`'s
// return value. The factory default is a passthrough to the real resolver
// (mirrors strategy.test.tsx / pillars.test.tsx / verbal.test.tsx), so the render
// suites exercise the real Visor Brand Record while the private suite forces null.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy) };
});

import { ColorAccessibilitySection, relativeLuminance, contrastRatio } from "../color-accessibility";
import {
  resolveBrandStrategy,
  VISOR_BRAND_STRATEGY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

// ── Contrast math unit tests ──────────────────────────────────────────────────

describe("relativeLuminance", () => {
  it("returns 0 for black (rgb(0, 0, 0))", () => {
    expect(relativeLuminance("rgb(0, 0, 0)")).toBeCloseTo(0, 5);
  });

  it("returns 1 for white (rgb(255, 255, 255))", () => {
    expect(relativeLuminance("rgb(255, 255, 255)")).toBeCloseTo(1, 5);
  });

  it("parses #000000 as 0", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  it("parses #ffffff as 1", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  it("returns null for empty string", () => {
    expect(relativeLuminance("")).toBeNull();
  });

  it("returns null for unparseable color (color-mix, named, etc.)", () => {
    expect(relativeLuminance("color-mix(in srgb, red 50%, blue)")).toBeNull();
    expect(relativeLuminance("red")).toBeNull();
  });

  it("returns a value in [0, 1] for a mid-tone color", () => {
    // RGB mid-gray is linear-close but not 0.5 due to gamma; just check bounds.
    const lum = relativeLuminance("rgb(128, 128, 128)");
    expect(lum).not.toBeNull();
    expect(lum!).toBeGreaterThan(0);
    expect(lum!).toBeLessThan(1);
  });
});

describe("contrastRatio", () => {
  // WCAG published example: black on white = 21:1.
  it("returns 21:1 for black on white", () => {
    const ratio = contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeCloseTo(21, 1);
  });

  it("returns 1:1 for identical colors (same black)", () => {
    const ratio = contrastRatio("rgb(0, 0, 0)", "rgb(0, 0, 0)");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeCloseTo(1, 5);
  });

  it("is symmetric (A vs B === B vs A)", () => {
    const ab = contrastRatio("rgb(0, 0, 0)", "rgb(255, 255, 255)");
    const ba = contrastRatio("rgb(255, 255, 255)", "rgb(0, 0, 0)");
    expect(ab).not.toBeNull();
    expect(ba).not.toBeNull();
    expect(ab!).toBeCloseTo(ba!, 10);
  });

  it("returns null when either color is unparseable", () => {
    expect(contrastRatio("", "rgb(255, 255, 255)")).toBeNull();
    expect(contrastRatio("rgb(0, 0, 0)", "")).toBeNull();
    expect(contrastRatio("red", "blue")).toBeNull();
  });

  it("clears 4.5:1 AA threshold for a known high-contrast pair", () => {
    // rgb(0,102,0) dark green on white ≈ 8.59:1 (well above 4.5).
    const ratio = contrastRatio("rgb(0, 102, 0)", "rgb(255, 255, 255)");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(4.5);
  });

  it("passes AA Large (≥3:1) but fails normal AA (<4.5:1) for a mid-contrast pair", () => {
    // rgb(150,150,150) gray on white ≈ 2.85:1 ... let's use a value that's
    // definitively ≥3:1 and <4.5:1. rgb(128,128,128) ≈ 3.95:1 by WCAG calc.
    const ratio = contrastRatio("rgb(127, 127, 127)", "rgb(255, 255, 255)");
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThanOrEqual(3.0);
    expect(ratio!).toBeLessThan(4.5);
  });
});

// ── ColorAccessibilitySection render tests ────────────────────────────────────

describe("ColorAccessibilitySection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveStrategy.mockClear();
  });

  it("renders one pairing card per colorUsage.pairings entry from the Brand Record", () => {
    const { container } = render(<ColorAccessibilitySection />);
    const pairings = container.querySelectorAll('[data-slot="pairing-row"]');
    const expected = VISOR_BRAND_STRATEGY.colorUsage?.pairings.length ?? 0;
    expect(expected).toBeGreaterThan(0);
    expect(pairings.length).toBe(expected);
  });

  it("renders pairing rule text for each pairing", () => {
    render(<ColorAccessibilitySection />);
    const pairings = VISOR_BRAND_STRATEGY.colorUsage?.pairings ?? [];
    for (const pairing of pairings) {
      expect(screen.getByText(pairing.rule)).toBeInTheDocument();
    }
  });

  it("renders the accessibility standard heading and contrast targets", () => {
    const { container } = render(<ColorAccessibilitySection />);
    const section = container.querySelector('[data-slot="accessibility"]') as HTMLElement;
    expect(section).not.toBeNull();

    const targets = section.querySelectorAll('[data-slot="contrast-target"]');
    const expected = VISOR_BRAND_STRATEGY.accessibility?.contrast.length ?? 0;
    expect(targets.length).toBe(expected);

    // Each contrast-target row renders its context text. Ratios may repeat (e.g.
    // "3:1" for both large text and non-text UI), so assert context text per row
    // (unique) rather than ratio text across the whole section (not unique).
    for (const [i, target] of (VISOR_BRAND_STRATEGY.accessibility?.contrast ?? []).entries()) {
      const row = targets[i] as HTMLElement;
      expect(within(row).getByText(target.context)).toBeInTheDocument();
      expect(within(row).getByText(target.ratio)).toBeInTheDocument();
    }
  });

  it("resolves the record for the default (stock) theme on mount", () => {
    render(<ColorAccessibilitySection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("re-resolves when a visor-theme-change event fires", () => {
    render(<ColorAccessibilitySection />);
    mockedResolveStrategy.mockClear();

    localStorage.setItem(THEME_STORAGE_KEY, "space");
    act(() => {
      document.dispatchEvent(new CustomEvent("visor-theme-change"));
    });

    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });

  it("resolves brand content from the theme prop, not the stored theme (matrix row / compare pane)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<ColorAccessibilitySection theme="blackout" />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("blackout");
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("space");
  });

  it("falls back to the stored theme when no prop is given (single-pane unchanged)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<ColorAccessibilitySection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });

  it("shows an AA badge for each pairing when resolved colors produce parseable contrast", () => {
    // Inject white + black as the resolved values for every token so all
    // pairings can compute contrast in a JSDOM environment (no CSS vars).
    const originalGetComputedStyle = window.getComputedStyle;
    vi.spyOn(window, "getComputedStyle").mockImplementation((el, pseudo) => {
      const style = originalGetComputedStyle(el, pseudo);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === "getPropertyValue") {
            return (name: string) => {
              // Return white for "with" token vars, black for "use" token vars.
              // We just need consistent parseable values so contrastRatio fires.
              if (name.startsWith("--surface") || name === "--primary") {
                return "rgb(255, 255, 255)";
              }
              return "rgb(0, 0, 0)";
            };
          }
          const val = Reflect.get(target, prop);
          return typeof val === "function" ? val.bind(target) : val;
        },
      });
    });

    const { container } = render(<ColorAccessibilitySection />);
    const badges = container.querySelectorAll('[data-slot="aa-badge"]');
    expect(badges.length).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it("renders pairing as 'unresolved' badge when getComputedStyle returns empty (JSDOM default)", () => {
    // By default, JSDOM cannot resolve CSS custom properties, so
    // useResolvedTokenValues yields empty strings for all vars. The section
    // must degrade gracefully with a non-failing badge.
    const { container } = render(<ColorAccessibilitySection />);
    const unresolved = container.querySelectorAll('[data-verdict="unresolved"]');
    // At least some pairings reference token vars that JSDOM can't resolve.
    expect(unresolved.length).toBeGreaterThan(0);
  });
});

describe("ColorAccessibilitySection — private brand (no public record)", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice when there is no public strategy", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<ColorAccessibilitySection />);

    expect(screen.getByText(/color usage is private/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="color-usage"]')).toBeNull();
    expect(container.querySelector('[data-slot="accessibility"]')).toBeNull();
  });
});
