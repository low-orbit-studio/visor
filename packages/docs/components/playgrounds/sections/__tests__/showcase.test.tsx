import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SECTIONS, findSection } from "../index";
import { ShowcaseSection } from "../showcase";
import { applyTheme, STOCK_GROUPS } from "@/lib/theme-config";

// One stock theme (always present) + one private slug. Private themes are
// generated locally and absent from the public/CI build, so we apply the theme
// *class* directly (the same body-class swap the Visual Explorer uses) rather
// than relying on a registered private entry.
const STOCK_THEME = STOCK_GROUPS[0].themes[0].value; // "blackout"
const PRIVATE_THEME = "blacklight-pro";

describe("Showcase section registration", () => {
  it("is registered in SECTIONS with id 'showcase' and label 'Showcase'", () => {
    const section = SECTIONS.find((s) => s.id === "showcase");
    expect(section).toBeDefined();
    expect(section?.label).toBe("Showcase");
    expect(section?.Component).toBe(ShowcaseSection);
  });

  it("is registered first so the flagship composite leads the section list", () => {
    expect(SECTIONS[0]?.id).toBe("showcase");
  });

  it("is selectable via findSection", () => {
    expect(findSection("showcase").id).toBe("showcase");
  });
});

describe("ShowcaseSection composition", () => {
  it("renders the brand-anchored hero — H1 + primary action (D5)", () => {
    render(<ShowcaseSection />);
    expect(
      screen.getByRole("heading", { level: 1, name: /one cohesive system/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Get started" })).toBeInTheDocument();
  });

  it("exercises the Button states, including disabled", () => {
    render(<ShowcaseSection />);
    for (const name of [
      "Default",
      "Secondary",
      "Outline",
      "Ghost",
      "Destructive",
      "Disabled",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("renders StatusBadges for running / complete / failed", () => {
    render(<ShowcaseSection />);
    // Each label also appears in the data table below, so allow multiple.
    expect(screen.getAllByText("Running").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Complete").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Failed").length).toBeGreaterThanOrEqual(1);
  });

  it("renders a DataTable with one row pre-selected (soft `--surface-selected` tint)", () => {
    const { container } = render(<ShowcaseSection />);
    const table = screen.getByTestId("showcase-table");
    expect(within(table).getByText("Grace Hopper")).toBeInTheDocument();
    // The pre-selected row carries the latent data-state="selected" the DataTable
    // wires to the `--surface-selected` token.
    expect(table.querySelector('[data-state="selected"]')).not.toBeNull();
    expect(container).toBeTruthy();
  });

  it("covers all four D6 alpha-overlay tokens in real context", () => {
    render(<ShowcaseSection />);
    expect(screen.getByTestId("showcase-glow-marker")).toBeInTheDocument(); // -glow
    expect(screen.getByTestId("showcase-strong")).toBeInTheDocument(); // -strong
    expect(screen.getByTestId("showcase-soft")).toBeInTheDocument(); // -soft
    expect(screen.getByTestId("showcase-status-soft")).toBeInTheDocument(); // surface-*-soft
  });
});

// Verification Plan [auto]: renders without errors under at least two themes
// (one stock, one private). jsdom does not resolve CSS-var colors, so this is a
// structural render check under each theme class — the visual cohesion judgment
// is the [human] gate.
describe("ShowcaseSection theme reactivity", () => {
  it.each([
    ["stock", STOCK_THEME],
    ["private", PRIVATE_THEME],
  ])("renders the full composition under the %s theme (%s)", (_kind, theme) => {
    applyTheme(theme);
    expect(document.body.className).toContain(`${theme}-theme`);

    render(<ShowcaseSection />);
    // Marquee groups all present under the applied theme.
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId("showcase-table")).toBeInTheDocument();
    expect(screen.getByTestId("showcase-glow-marker")).toBeInTheDocument();
    expect(screen.getByTestId("showcase-status-soft")).toBeInTheDocument();
  });
});
