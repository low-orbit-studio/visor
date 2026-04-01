import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShadePreview } from "../components/shade-preview";

// Mock the theme engine to avoid heavy computation in tests
vi.mock("@loworbitstudio/visor-theme-engine", () => ({
  generateShadeScale: vi.fn(() => ({
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
    950: "#450a0a",
  })),
}));

describe("ShadePreview", () => {
  it("renders 11 shade swatches for a full-scale role", () => {
    const { container } = render(
      <ShadePreview color="#6366F1" role="primary" />
    );
    const swatches = container.querySelectorAll("[class*='swatch']");
    expect(swatches.length).toBe(11);
  });

  it("renders with correct aria label", () => {
    render(<ShadePreview color="#6366F1" role="primary" />);
    expect(screen.getByRole("img")).toHaveAttribute(
      "aria-label",
      "primary shade scale"
    );
  });

  it("highlights the anchor shade for primary (600)", () => {
    const { container } = render(
      <ShadePreview color="#6366F1" role="primary" />
    );
    const anchor = container.querySelector('[data-anchor="true"]');
    expect(anchor).not.toBeNull();
    expect(anchor).toHaveAttribute("title", expect.stringContaining("600"));
  });

  it("highlights the anchor shade for status roles (500)", () => {
    const { container } = render(
      <ShadePreview color="#22c55e" role="success" />
    );
    const anchor = container.querySelector('[data-anchor="true"]');
    expect(anchor).not.toBeNull();
    expect(anchor).toHaveAttribute("title", expect.stringContaining("500"));
  });

  it("renders nothing when generateShadeScale throws", async () => {
    const engine = await import("@loworbitstudio/visor-theme-engine");
    const mock = vi.mocked(engine.generateShadeScale);
    mock.mockImplementationOnce(() => {
      throw new Error("Invalid color");
    });

    const { container } = render(
      <ShadePreview color="invalid" role="primary" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("sets background color on each swatch", () => {
    const { container } = render(
      <ShadePreview color="#6366F1" role="primary" />
    );
    const swatches = container.querySelectorAll("[class*='swatch']");
    const firstSwatch = swatches[0] as HTMLElement;
    expect(firstSwatch.style.backgroundColor).toBeTruthy();
  });
});
