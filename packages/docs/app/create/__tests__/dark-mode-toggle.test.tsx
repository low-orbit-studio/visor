import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DarkModeToggle } from "../components/dark-mode-toggle";

vi.mock("@phosphor-icons/react", () => ({
  Sun: ({ size, weight }: { size: number; weight: string }) => (
    <span data-testid="sun-icon" data-size={size} data-weight={weight} />
  ),
  Moon: ({ size, weight }: { size: number; weight: string }) => (
    <span data-testid="moon-icon" data-size={size} data-weight={weight} />
  ),
}));

describe("DarkModeToggle", () => {
  it("shows sun icon in light mode", () => {
    render(<DarkModeToggle darkMode={false} onToggle={() => {}} />);
    expect(screen.getByTestId("sun-icon")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
  });

  it("shows moon icon in dark mode", () => {
    render(<DarkModeToggle darkMode={true} onToggle={() => {}} />);
    expect(screen.getByTestId("moon-icon")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = vi.fn();
    render(<DarkModeToggle darkMode={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("has correct aria-label for light mode", () => {
    render(<DarkModeToggle darkMode={false} onToggle={() => {}} />);
    expect(screen.getByLabelText("Switch to dark mode")).toBeInTheDocument();
  });

  it("has correct aria-label for dark mode", () => {
    render(<DarkModeToggle darkMode={true} onToggle={() => {}} />);
    expect(screen.getByLabelText("Switch to light mode")).toBeInTheDocument();
  });
});
