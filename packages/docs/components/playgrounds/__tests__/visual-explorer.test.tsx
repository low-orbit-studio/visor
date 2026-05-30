import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VisualExplorer } from "../visual-explorer";
import { DualPaneView } from "../visual-explorer-pane";
import { checkA11y } from "../../../../../test-utils/a11y";

describe("VisualExplorer dual-pane fullscreen", () => {
  it("renders a Compare button in the toolbar", () => {
    render(<VisualExplorer />);
    expect(
      screen.getByRole("button", { name: "Open dual-pane compare" }),
    ).toBeInTheDocument();
  });

  it("opens the overlay with a shared module and per-pane themes", async () => {
    render(<VisualExplorer />);
    fireEvent.click(screen.getByRole("button", { name: "Open dual-pane compare" }));

    // Two labelled comparison panes appear.
    expect(await screen.findByRole("region", { name: "Left pane" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Right pane" })).toBeInTheDocument();

    // A single module selector governs BOTH panes (review feedback).
    expect(
      screen.getByRole("combobox", { name: "Comparison module (both panes)" }),
    ).toBeInTheDocument();

    // Each pane keeps its own independent theme selector (D2).
    expect(screen.getByRole("combobox", { name: "Left pane theme" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Right pane theme" })).toBeInTheDocument();

    // Shared sync-scroll control, defaulting ON (D4) — so its action toggles off.
    expect(
      screen.getByRole("button", { name: "Turn sync scroll off" }),
    ).toBeInTheDocument();
  });
});

describe("DualPaneView", () => {
  const noop = () => {};

  function renderView() {
    return render(
      <DualPaneView
        sectionId="color-signals"
        themes={["blackout", "neutral"]}
        mode="dark"
        syncScroll
        onSectionChange={noop}
        onThemeChange={noop}
        onToggleMode={noop}
        onToggleSyncScroll={noop}
      />,
    );
  }

  it("matches the dual-pane chrome snapshot", () => {
    const { container } = renderView();
    // Lock the dual-pane chrome (shared header + per-pane toolbars, selectors and
    // labels) but blank the section bodies — those belong to their own components
    // and would otherwise churn this snapshot on unrelated section edits.
    container
      .querySelectorAll('[class*="paneCanvas"]')
      .forEach((el) => {
        el.replaceChildren();
      });
    // Radix selects embed React useId values (e.g. aria-controls="radix-_r_3r_")
    // whose counter depends on prior renders in the test worker — so they differ
    // between a local run and CI's sharded run. Normalize the id-bearing attributes
    // so the snapshot captures structure, not environment-specific ids.
    for (const attr of [
      "id",
      "aria-controls",
      "aria-labelledby",
      "aria-describedby",
      "aria-activedescendant",
    ]) {
      container.querySelectorAll(`[${attr}]`).forEach((el) => el.setAttribute(attr, "[id]"));
    }
    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders the shared module's section in both panes", () => {
    renderView();
    // Both panes render the same shared section heading ("Color Signals").
    const left = screen.getByRole("region", { name: "Left pane" });
    const right = screen.getByRole("region", { name: "Right pane" });
    expect(left).toHaveTextContent("Color Signals");
    expect(right).toHaveTextContent("Color Signals");
  });

  it("passes accessibility checks", async () => {
    const { container } = renderView();
    await checkA11y(container);
  });
});
