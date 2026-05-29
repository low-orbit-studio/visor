import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SECTIONS, findSection } from "../index";
import { AlphaOverlaysSection } from "../alpha-overlays";

const NEW_TOKENS = [
  "--interactive-primary-soft",
  "--interactive-primary-glow",
  "--interactive-primary-strong",
  "--surface-success-soft",
  "--surface-warning-soft",
  "--surface-error-soft",
];

describe("Alpha Overlays section registration", () => {
  it("is registered in SECTIONS with id 'alpha-overlays' and label 'Alpha Overlays'", () => {
    const section = SECTIONS.find((s) => s.id === "alpha-overlays");
    expect(section).toBeDefined();
    expect(section?.label).toBe("Alpha Overlays");
    expect(section?.Component).toBe(AlphaOverlaysSection);
  });

  it("is selectable via findSection", () => {
    expect(findSection("alpha-overlays").id).toBe("alpha-overlays");
  });
});

describe("AlphaOverlaysSection swatches", () => {
  it("renders a dynamic ColorSwatch for all six new alpha-overlay tokens", () => {
    const { container } = render(<AlphaOverlaysSection />);
    const swatches = container.querySelectorAll('[data-slot="color-swatch"]');
    expect(swatches).toHaveLength(6);
  });

  it("drives each swatch background off the live token (no hardcoded fills)", () => {
    const { container } = render(<AlphaOverlaysSection />);
    const previews = Array.from(container.querySelectorAll('[data-slot="color-swatch"] > div'));
    const backgrounds = previews.map((p) => (p as HTMLElement).getAttribute("style") ?? "");
    NEW_TOKENS.forEach((token) => {
      expect(backgrounds.some((bg) => bg.includes(`var(${token}`))).toBe(true);
    });
  });
});

describe("AlphaOverlaysSection treatments", () => {
  it("brand soft — renders a selected/active table row tinted by the soft token", () => {
    render(<AlphaOverlaysSection />);
    const table = screen.getByTestId("overlays-soft-table");
    const activeRow = within(table).getByRole("row", { selected: true });
    expect(activeRow).toBeInTheDocument();
  });

  it("brand soft — renders a current nav item with soft tint + brand left edge", () => {
    render(<AlphaOverlaysSection />);
    const nav = screen.getByTestId("overlays-soft-nav");
    const current = within(nav).getByText("Bookings");
    expect(current.getAttribute("aria-current")).toBe("page");
  });

  it("brand glow — renders a marker dot carrying the halo treatment", () => {
    render(<AlphaOverlaysSection />);
    expect(screen.getByTestId("overlays-glow-marker")).toBeInTheDocument();
  });

  it("brand strong — renders a segmented control with a selected segment", () => {
    render(<AlphaOverlaysSection />);
    const control = screen.getByTestId("overlays-strong");
    const selected = within(control).getByText("Week");
    expect(selected.getAttribute("data-selected")).toBe("true");
  });

  it("status soft — renders status-tinted table rows for success / warning / error", () => {
    render(<AlphaOverlaysSection />);
    const table = screen.getByTestId("overlays-status-table");
    expect(within(table).getByText("Available")).toBeInTheDocument();
    expect(within(table).getByText("Tentative")).toBeInTheDocument();
    expect(within(table).getByText("Conflict")).toBeInTheDocument();
  });

  it("status soft — renders three inline status pills", () => {
    render(<AlphaOverlaysSection />);
    const pills = screen.getByTestId("overlays-status-pills");
    expect(within(pills).getByText("Available")).toBeInTheDocument();
    expect(within(pills).getByText("Tentative")).toBeInTheDocument();
    expect(within(pills).getByText("Conflict")).toBeInTheDocument();
  });
});
