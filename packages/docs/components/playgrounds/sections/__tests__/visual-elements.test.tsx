import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VisualElementsSection } from "../visual-elements";

describe("VisualElementsSection", () => {
  it("renders the four-tier surface ladder (page → muted → card → elev)", () => {
    const { container } = render(<VisualElementsSection />);
    const rows = container.querySelectorAll('[data-slot="surface-row"]');
    expect(rows).toHaveLength(4);

    const tokens = Array.from(rows).map((row) => row.textContent ?? "");
    expect(tokens.some((t) => t.includes("--surface-page"))).toBe(true);
    expect(tokens.some((t) => t.includes("--surface-muted"))).toBe(true);
    expect(tokens.some((t) => t.includes("--surface-card"))).toBe(true);
    expect(tokens.some((t) => t.includes("--surface-elev"))).toBe(true);
  });

  it("labels each surface tier", () => {
    render(<VisualElementsSection />);
    expect(screen.getByText("Page")).toBeInTheDocument();
    expect(screen.getByText("Muted")).toBeInTheDocument();
    expect(screen.getByText("Card")).toBeInTheDocument();
    expect(screen.getByText("Elevated")).toBeInTheDocument();
  });

  it("does not reference the undefined surface-primary/secondary/tertiary tokens", () => {
    const { container } = render(<VisualElementsSection />);
    const surfaceText = Array.from(
      container.querySelectorAll('[data-slot="surface-row"]')
    )
      .map((row) => row.textContent ?? "")
      .join(" ");
    expect(surfaceText).not.toContain("--surface-primary");
    expect(surfaceText).not.toContain("--surface-secondary");
    expect(surfaceText).not.toContain("--surface-tertiary");
  });

  it("renders the full text-alpha ramp (primary, secondary, tertiary, disabled)", () => {
    const { container } = render(<VisualElementsSection />);
    const swatches = container.querySelectorAll('[data-slot="color-swatch"]');
    expect(swatches).toHaveLength(4);

    const labels = Array.from(swatches).map((swatch) =>
      within(swatch as HTMLElement).getByText(/Primary|Secondary|Tertiary|Disabled/).textContent
    );
    expect(labels).toEqual(["Primary", "Secondary", "Tertiary", "Disabled"]);
  });
});
