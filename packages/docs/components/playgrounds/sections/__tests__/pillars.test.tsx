import { render, screen, within, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrandStrategy`'s
// return value. The factory default is a passthrough to the real resolver
// (mirrors strategy.test.tsx), so the render/selection suites exercise the real
// Visor Brand Record while the warning/private suites force a custom or null result.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy) };
});

import { PillarsSection } from "../pillars";
import {
  resolveBrandStrategy,
  VISOR_BRAND_STRATEGY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

function pillarCard(container: HTMLElement, id: string): HTMLElement {
  return container.querySelector(`[data-slot="pillar"][data-pillar="${id}"]`) as HTMLElement;
}

describe("PillarsSection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveStrategy.mockClear();
  });

  it("renders one card per pillar with its id and statement from the Brand Record", () => {
    const { container } = render(<PillarsSection />);

    const cards = container.querySelectorAll('[data-slot="pillar"]');
    expect(cards.length).toBe(VISOR_BRAND_STRATEGY.pillars.length);

    for (const pillar of VISOR_BRAND_STRATEGY.pillars) {
      const card = pillarCard(container, pillar.id);
      expect(card).not.toBeNull();
      expect(within(card).getByText(pillar.id)).toBeInTheDocument();
      expect(within(card).getByText(pillar.statement)).toBeInTheDocument();
    }
  });

  it("resolves the record for the default (stock) theme on mount", () => {
    render(<PillarsSection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("re-resolves when a visor-theme-change event fires", () => {
    // The Workbench surface follows the Explorer's theme switch via the same
    // `visor-theme-change` event the Brand/Strategy sections listen for.
    // (Event-fires assertion in the theme-config.test.ts:89 style.)
    render(<PillarsSection />);
    mockedResolveStrategy.mockClear();

    // A stock theme — stable across public/private builds — so getStoredTheme accepts it.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    act(() => {
      document.dispatchEvent(new CustomEvent("visor-theme-change"));
    });

    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });

  it("surfaces the open pillar's governed tokens as live swatches by default", () => {
    // The first pillar (coherence) opens by default, so its governed tokens are
    // revealed in-card without interaction — the v1 governs surfacing.
    const { container } = render(<PillarsSection />);
    const coherence = VISOR_BRAND_STRATEGY.pillars[0];
    const card = pillarCard(container, coherence.id);

    const governs = within(card).getByText(/^Tokens$/i).closest('[data-slot="pillar-governs"]');
    expect(governs).not.toBeNull();

    const swatches = card.querySelectorAll('[data-slot="governs-token"]');
    expect(swatches.length).toBe(coherence.governs.tokens?.length ?? 0);
    for (const token of coherence.governs.tokens ?? []) {
      expect(within(card).getByText(token)).toBeInTheDocument();
    }
  });

  it("swaps the reveal to the clicked pillar (single-select)", () => {
    const { container } = render(<PillarsSection />);

    // ownership governs components only — selecting it surfaces a component chip
    // and collapses the previously-open coherence card (no token detail remains).
    const ownership = pillarCard(container, "ownership");
    fireEvent.click(within(ownership).getByRole("button"));

    expect(within(ownership).getByText("all")).toBeInTheDocument();
    expect(within(ownership).getByText(/^Components$/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="governs-token"]')).toBeNull();
  });

  it("collapses the open pillar when its header is clicked again", () => {
    const { container } = render(<PillarsSection />);
    const coherence = pillarCard(container, "coherence");

    expect(coherence.querySelector('[data-slot="pillar-governs"]')).not.toBeNull();
    fireEvent.click(within(coherence).getByRole("button"));
    expect(coherence.querySelector('[data-slot="pillar-governs"]')).toBeNull();
  });
});

describe("PillarsSection — governs-nothing warning (D2)", () => {
  // Uses mockReturnValue, which persists past mockClear — so this suite follows
  // the passthrough-reliant suite above and precedes only the null suite below.
  afterEach(() => {
    localStorage.clear();
  });

  it("renders a visible warning for a pillar that governs nothing", () => {
    mockedResolveStrategy.mockReturnValue({
      ...VISOR_BRAND_STRATEGY,
      pillars: [{ id: "hollow", statement: "A claim with nothing behind it.", governs: {} }],
    });

    const { container } = render(<PillarsSection />);
    const card = pillarCard(container, "hollow");

    expect(card).not.toBeNull();
    expect(within(card).getByText("hollow")).toBeInTheDocument();
    const warning = card.querySelector('[data-slot="pillar-warning"]');
    expect(warning).not.toBeNull();
    expect(within(warning as HTMLElement).getByText(/governs nothing/i)).toBeInTheDocument();
    // A hollow pillar exposes no governs reveal.
    expect(card.querySelector('[data-slot="pillar-governs"]')).toBeNull();
  });
});

describe("PillarsSection — private brand (no public record)", () => {
  // Last suite: it pins resolveBrandStrategy to null, which persists past
  // mockClear, so it must not precede the passthrough-reliant suites above.
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice and renders no pillar cards when there is no public strategy", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<PillarsSection />);

    expect(screen.getByText(/brand pillars are private/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="pillar"]')).toBeNull();
  });
});
