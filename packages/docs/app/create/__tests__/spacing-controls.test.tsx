import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpacingControls } from "../components/spacing-controls";

const defaultProps = {
  spacingBase: 4,
  radiusSm: 2,
  radiusMd: 4,
  radiusLg: 8,
  radiusXl: 12,
  radiusPill: 9999,
  onSpacingBaseChange: vi.fn(),
  onRadiusSmChange: vi.fn(),
  onRadiusMdChange: vi.fn(),
  onRadiusLgChange: vi.fn(),
  onRadiusXlChange: vi.fn(),
  onRadiusPillChange: vi.fn(),
};

describe("SpacingControls", () => {
  it("renders section title", () => {
    render(<SpacingControls {...defaultProps} />);
    expect(screen.getByText("Spacing & Radius")).toBeInTheDocument();
  });

  it("renders spacing base input with value", () => {
    render(<SpacingControls {...defaultProps} />);
    const input = screen.getByLabelText("Spacing base value");
    expect(input).toHaveValue("4");
  });

  it("renders all 5 radius inputs", () => {
    render(<SpacingControls {...defaultProps} />);

    expect(screen.getByLabelText("Radius small")).toHaveValue("2");
    expect(screen.getByLabelText("Radius medium")).toHaveValue("4");
    expect(screen.getByLabelText("Radius large")).toHaveValue("8");
    expect(screen.getByLabelText("Radius extra large")).toHaveValue("12");
    expect(screen.getByLabelText("Radius pill")).toHaveValue("9999");
  });

  it("renders spacing preview strip with computed values", () => {
    render(<SpacingControls {...defaultProps} />);

    // With base 4, first multiplier is 1 => 4
    // Check that at least the first computed value is visible
    expect(screen.getByText("4")).toBeInTheDocument();
    // base * 2 = 8
    expect(screen.getByText("8")).toBeInTheDocument();
    // base * 16 = 64
    expect(screen.getByText("64")).toBeInTheDocument();
  });

  it("calls onSpacingBaseChange when increment button is clicked", async () => {
    const onSpacingBaseChange = vi.fn();
    render(
      <SpacingControls {...defaultProps} onSpacingBaseChange={onSpacingBaseChange} />
    );

    // Find the increase button next to the spacing base input
    const increaseButtons = screen.getAllByLabelText("Increase value");
    await userEvent.click(increaseButtons[0]);

    expect(onSpacingBaseChange).toHaveBeenCalledWith(5);
  });

  it("updates preview strip values when base changes", () => {
    const { rerender } = render(<SpacingControls {...defaultProps} />);

    // Initially base=4, so multiplier 8 => 32
    expect(screen.getByText("32")).toBeInTheDocument();

    // Re-render with base=8
    rerender(<SpacingControls {...defaultProps} spacingBase={8} />);

    // Now multiplier 8 => 64
    expect(screen.getByText("64")).toBeInTheDocument();
  });
});
