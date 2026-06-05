import { render, screen, within, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";

// Partial-mock theme-config so individual tests can drive `resolveBrandStrategy`'s
// return value. The factory default is a passthrough to the real resolver
// (mirrors strategy.test.tsx / pillars.test.tsx), so the render/mapping suites
// exercise the real Visor Brand Record while the private suite forces a null result.
vi.mock("@/lib/theme-config", async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import("@/lib/theme-config");
  return { ...actual, resolveBrandStrategy: vi.fn(actual.resolveBrandStrategy) };
});

import { VerbalSection } from "../verbal";
import {
  resolveBrandStrategy,
  VISOR_BRAND_STRATEGY,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/lib/theme-config";

const mockedResolveStrategy = vi.mocked(resolveBrandStrategy);

function toneEntry(container: HTMLElement, key: string): HTMLElement {
  return container.querySelector(`[data-slot="tone-entry"][data-tone="${key}"]`) as HTMLElement;
}

describe("VerbalSection", () => {
  afterEach(() => {
    localStorage.clear();
    mockedResolveStrategy.mockClear();
  });

  it("renders voice, tone, and lexicon from the Brand Record", () => {
    const { container } = render(<VerbalSection />);

    // Voice — one unit per trait; each trait's worked example is live copy in a real
    // Banner, with the trait name as the title.
    const voice = container.querySelector('[data-slot="verbal-voice"]') as HTMLElement;
    expect(voice).not.toBeNull();
    const traits = voice.querySelectorAll('[data-slot="voice-trait"]');
    expect(traits.length).toBe(VISOR_BRAND_STRATEGY.voice.traits.length);
    for (const trait of VISOR_BRAND_STRATEGY.voice.traits) {
      expect(within(voice).getByText(trait.name)).toBeInTheDocument();
      if (trait.example) {
        expect(within(voice).getByText(trait.example)).toBeInTheDocument();
      }
    }

    // Tone — one entry per recognized state, each carrying its real example message.
    const tone = container.querySelector('[data-slot="verbal-tone"]') as HTMLElement;
    expect(tone).not.toBeNull();
    const entries = tone.querySelectorAll('[data-slot="tone-entry"]');
    expect(entries.length).toBe(Object.keys(VISOR_BRAND_STRATEGY.tone).length);
    for (const [key, entry] of Object.entries(VISOR_BRAND_STRATEGY.tone)) {
      const el = toneEntry(container, key);
      expect(el).not.toBeNull();
      expect(within(el).getByText(entry.example)).toBeInTheDocument();
    }

    // Lexicon — one pair per entry, use (success) + avoid (destructive).
    const lexicon = container.querySelector('[data-slot="verbal-lexicon"]') as HTMLElement;
    expect(lexicon).not.toBeNull();
    const pairs = lexicon.querySelectorAll('[data-slot="lexicon-pair"]');
    expect(pairs.length).toBe(VISOR_BRAND_STRATEGY.lexicon.length);
    for (const pair of VISOR_BRAND_STRATEGY.lexicon) {
      expect(within(lexicon).getByText(pair.use)).toBeInTheDocument();
      expect(within(lexicon).getByText(pair.avoid)).toBeInTheDocument();
    }
  });

  it("maps each tone state to its real UI component (D2)", () => {
    const { container } = render(<VerbalSection />);

    // error / success / validation-warning → real Alerts.
    for (const key of ["error", "success", "validation-warning"]) {
      const el = toneEntry(container, key);
      expect(el.querySelector('[data-slot="alert"]')).not.toBeNull();
    }

    // empty → a real EmptyState (and no alert).
    const empty = toneEntry(container, "empty");
    expect(empty.querySelector('[data-slot="empty-state"]')).not.toBeNull();
    expect(empty.querySelector('[data-slot="alert"]')).toBeNull();

    // loading → real Skeletons + the honest caption.
    const loading = toneEntry(container, "loading");
    expect(loading.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    expect(
      within(loading).getByText(VISOR_BRAND_STRATEGY.tone.loading.example)
    ).toBeInTheDocument();
  });

  it("resolves the record for the default (stock) theme on mount", () => {
    render(<VerbalSection />);
    expect(mockedResolveStrategy).toHaveBeenCalledWith(DEFAULT_THEME);
  });

  it("re-resolves when a visor-theme-change event fires", () => {
    // The Workbench surface follows the Explorer's theme switch via the same
    // `visor-theme-change` event the Brand/Strategy/Pillars sections listen for.
    // (Event-fires assertion in the theme-config.test.ts:89 style.)
    render(<VerbalSection />);
    mockedResolveStrategy.mockClear();

    // A stock theme — stable across public/private builds — so getStoredTheme accepts it.
    localStorage.setItem(THEME_STORAGE_KEY, "space");
    act(() => {
      document.dispatchEvent(new CustomEvent("visor-theme-change"));
    });

    expect(mockedResolveStrategy).toHaveBeenCalledWith("space");
  });
});

describe("VerbalSection — private brand (no public record)", () => {
  // Last suite in the file: it pins resolveBrandStrategy to null, which persists
  // past mockClear, so it must not precede the passthrough-reliant suites above.
  afterEach(() => {
    localStorage.clear();
  });

  it("shows a private-record notice and renders no verbal blocks when there is no public strategy", () => {
    mockedResolveStrategy.mockReturnValue(null);
    const { container } = render(<VerbalSection />);

    expect(screen.getByText(/verbal identity is private/i)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="verbal-voice"]')).toBeNull();
    expect(container.querySelector('[data-slot="verbal-tone"]')).toBeNull();
    expect(container.querySelector('[data-slot="verbal-lexicon"]')).toBeNull();
  });
});
