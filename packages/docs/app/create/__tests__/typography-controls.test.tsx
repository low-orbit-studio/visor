import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TypographyControls } from "../components/typography-controls";

// Mock the theme-engine imports
vi.mock("@loworbitstudio/visor-theme-engine", () => ({
  googleFontsCatalog: [
    {
      family: "Roboto",
      weights: [100, 300, 400, 500, 700, 900],
      styles: ["italic", "normal"],
      category: "sans-serif",
    },
    {
      family: "Playfair Display",
      weights: [400, 500, 600, 700, 800, 900],
      styles: ["italic", "normal"],
      category: "serif",
    },
    {
      family: "Roboto Mono",
      weights: [100, 200, 300, 400, 500, 600, 700],
      styles: ["italic", "normal"],
      category: "monospace",
    },
    {
      family: "IBM Plex Mono",
      weights: [100, 200, 300, 400, 500, 600, 700],
      styles: ["italic", "normal"],
      category: "monospace",
    },
  ],
  lookupGoogleFont: (family: string) => {
    const catalog: Record<
      string,
      { family: string; weights: number[]; styles: string[]; category: string }
    > = {
      Roboto: {
        family: "Roboto",
        weights: [100, 300, 400, 500, 700, 900],
        styles: ["italic", "normal"],
        category: "sans-serif",
      },
      "Playfair Display": {
        family: "Playfair Display",
        weights: [400, 500, 600, 700, 800, 900],
        styles: ["italic", "normal"],
        category: "serif",
      },
      "Roboto Mono": {
        family: "Roboto Mono",
        weights: [100, 200, 300, 400, 500, 600, 700],
        styles: ["italic", "normal"],
        category: "monospace",
      },
    };
    return catalog[family] ?? null;
  },
}));

const defaultProps = {
  headingFamily: "Roboto",
  headingWeight: 700,
  bodyFamily: "Roboto",
  bodyWeight: 400,
  monoFamily: "Roboto Mono",
  onHeadingFamilyChange: vi.fn(),
  onHeadingWeightChange: vi.fn(),
  onBodyFamilyChange: vi.fn(),
  onBodyWeightChange: vi.fn(),
  onMonoFamilyChange: vi.fn(),
  onLoadFont: vi.fn(),
};

describe("TypographyControls", () => {
  it("renders all three font role sections", () => {
    render(<TypographyControls {...defaultProps} />);

    expect(screen.getByText("Typography")).toBeInTheDocument();
    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    expect(screen.getByText("Mono")).toBeInTheDocument();
  });

  it("renders heading and body weight selects", () => {
    render(<TypographyControls {...defaultProps} />);

    // Should have two weight labels for heading and body (not mono)
    const weightLabels = screen.getAllByText("Weight");
    expect(weightLabels).toHaveLength(2);
  });

  it("renders font family labels for all three roles", () => {
    render(<TypographyControls {...defaultProps} />);

    const familyLabels = screen.getAllByText("Font family");
    expect(familyLabels).toHaveLength(3);
  });

  it("renders search inputs for font pickers", () => {
    render(<TypographyControls {...defaultProps} />);

    const searchInputs = screen.getAllByPlaceholderText("Search fonts...");
    expect(searchInputs).toHaveLength(3);
  });
});
