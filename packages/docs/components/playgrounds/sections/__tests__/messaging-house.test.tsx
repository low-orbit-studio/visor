import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrandStrategy`'s
// return value. The factory default is a passthrough to the real resolver
// (mirrors pillars.test.tsx), so the render suites exercise the real Visor Brand
// Record while the private suite forces a null result.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy) };
});

import { MessagingHouseSection } from "../messaging-house";
import {
  resolveBrandStrategy,
  VISOR_BRAND_STRATEGY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

describe("MessagingHouseSection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveStrategy.mockClear();
  });

  it("renders the messaging roof from the Brand Record", () => {
    const { container } = render(<MessagingHouseSection />);

    const roof = container.querySelector('[data-slot="messaging-roof"]');
    expect(roof).not.toBeNull();
    expect(within(roof as HTMLElement).getByText(VISOR_BRAND_STRATEGY.messaging!.roof)).toBeInTheDocument();
  });

  it("renders a card per pillar with its id and statement", () => {
    const { container } = render(<MessagingHouseSection />);

    const pillarsSection = container.querySelector('[data-slot="messaging-pillars"]');
    expect(pillarsSection).not.toBeNull();

    const cards = container.querySelectorAll('[data-slot="house-pillar"]');
    expect(cards.length).toBe(VISOR_BRAND_STRATEGY.pillars.length);

    for (const pillar of VISOR_BRAND_STRATEGY.pillars) {
      const card = container.querySelector(`[data-slot="house-pillar"][data-pillar="${pillar.id}"]`);
      expect(card).not.toBeNull();
      expect(within(card as HTMLElement).getByText(pillar.id)).toBeInTheDocument();
      expect(within(card as HTMLElement).getByText(pillar.statement)).toBeInTheDocument();
    }
  });

  it("renders proof points nested under each pillar", () => {
    const { container } = render(<MessagingHouseSection />);

    for (const pillar of VISOR_BRAND_STRATEGY.pillars) {
      if (!pillar.proof || pillar.proof.length === 0) continue;

      const card = container.querySelector(`[data-slot="house-pillar"][data-pillar="${pillar.id}"]`);
      expect(card).not.toBeNull();

      const proofList = (card as HTMLElement).querySelector('[data-slot="proof-list"]');
      expect(proofList).not.toBeNull();

      const proofPoints = (card as HTMLElement).querySelectorAll('[data-slot="proof-point"]');
      expect(proofPoints.length).toBe(pillar.proof.length);

      for (const point of pillar.proof) {
        expect(within(card as HTMLElement).getByText(point)).toBeInTheDocument();
      }
    }
  });

  it("resolves the record for the default (stock) theme on mount", () => {
    render(<MessagingHouseSection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("resolves brand content from the theme prop, not the stored theme (matrix row / compare pane)", () => {
    // A multi-theme surface (matrix iframe, compare pane) threads its own theme as
    // a prop. Even with a different theme stored globally, the prop must win — this
    // is the VI-521 fix for row/pane-correct brand content.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<MessagingHouseSection theme="blackout" />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("blackout");
    expect(mockedResolveStrategy).not.toHaveBeenCalledWith("space");
  });

  it("falls back to the stored theme when no prop is given (single-pane unchanged)", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    render(<MessagingHouseSection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });

  it("omits the roof section when messaging is not present on the strategy", () => {
    mockedResolveStrategy.mockReturnValue({
      ...VISOR_BRAND_STRATEGY,
      messaging: undefined,
    });
    const { container } = render(<MessagingHouseSection />);

    expect(container.querySelector('[data-slot="messaging-roof"]')).toBeNull();
    // Pillars still render.
    expect(container.querySelector('[data-slot="messaging-pillars"]')).not.toBeNull();
  });

  it("renders no proof list for a pillar that has no proof points", () => {
    mockedResolveStrategy.mockReturnValue({
      ...VISOR_BRAND_STRATEGY,
      pillars: [{ id: "bare", statement: "A pillar without proof.", governs: {} }],
    });
    const { container } = render(<MessagingHouseSection />);

    const card = container.querySelector('[data-slot="house-pillar"][data-pillar="bare"]');
    expect(card).not.toBeNull();
    expect((card as HTMLElement).querySelector('[data-slot="proof-list"]')).toBeNull();
  });
});

describe("MessagingHouseSection — private brand (no public record)", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice and renders no house content when there is no public strategy", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<MessagingHouseSection />);

    expect(screen.getByText(/messaging house is private/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="messaging-roof"]')).toBeNull();
    expect(container.querySelector('[data-slot="house-pillar"]')).toBeNull();
  });
});
