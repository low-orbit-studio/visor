import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorControls } from "../components/color-controls";
import type { VisorThemeConfig } from "@loworbitstudio/visor-theme-engine";

// Mock ColorInput to isolate ColorControls tests
vi.mock("../components/color-input", () => ({
  ColorInput: ({
    role,
    value,
    onChange,
    required,
    showShades,
  }: {
    role: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
    showShades?: boolean;
  }) => (
    <div
      data-testid={`color-input-${role}`}
      data-value={value}
      data-required={required ? "true" : undefined}
      data-shades={showShades ? "true" : undefined}
    >
      <button onClick={() => onChange("#ff0000")}>{role}</button>
    </div>
  ),
}));

const DEFAULT_CONFIG: VisorThemeConfig = {
  name: "test",
  version: 1,
  colors: {
    primary: "#6366F1",
    accent: "#F59E0B",
  },
};

describe("ColorControls", () => {
  it("renders all 9 color roles", () => {
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={() => {}} />
    );

    const roles = [
      "primary", "accent", "neutral",
      "background", "surface",
      "success", "warning", "error", "info",
    ];

    for (const role of roles) {
      expect(screen.getByTestId(`color-input-${role}`)).toBeInTheDocument();
    }
  });

  it("renders three group headings", () => {
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={() => {}} />
    );

    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Surface")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("marks primary as required", () => {
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={() => {}} />
    );

    const primary = screen.getByTestId("color-input-primary");
    expect(primary.getAttribute("data-required")).toBe("true");
  });

  it("passes config color values to inputs", () => {
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={() => {}} />
    );

    const primary = screen.getByTestId("color-input-primary");
    expect(primary.getAttribute("data-value")).toBe("#6366F1");

    const accent = screen.getByTestId("color-input-accent");
    expect(accent.getAttribute("data-value")).toBe("#F59E0B");
  });

  it("calls updateConfig with correct path on color change", () => {
    const updateConfig = vi.fn();
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={updateConfig} />
    );

    fireEvent.click(screen.getByText("primary"));
    expect(updateConfig).toHaveBeenCalledWith("colors.primary", "#ff0000");

    fireEvent.click(screen.getByText("error"));
    expect(updateConfig).toHaveBeenCalledWith("colors.error", "#ff0000");
  });

  it("enables shades on brand and status roles", () => {
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={() => {}} />
    );

    // Brand roles with shades
    expect(
      screen.getByTestId("color-input-primary").getAttribute("data-shades")
    ).toBe("true");
    expect(
      screen.getByTestId("color-input-accent").getAttribute("data-shades")
    ).toBe("true");
    expect(
      screen.getByTestId("color-input-neutral").getAttribute("data-shades")
    ).toBe("true");

    // Surface roles without shades
    expect(
      screen.getByTestId("color-input-background").getAttribute("data-shades")
    ).toBeNull();
    expect(
      screen.getByTestId("color-input-surface").getAttribute("data-shades")
    ).toBeNull();

    // Status roles with shades
    expect(
      screen.getByTestId("color-input-success").getAttribute("data-shades")
    ).toBe("true");
  });

  it("uses default colors for roles not in config", () => {
    render(
      <ColorControls config={DEFAULT_CONFIG} updateConfig={() => {}} />
    );

    // neutral is not in config, should use default
    const neutral = screen.getByTestId("color-input-neutral");
    expect(neutral.getAttribute("data-value")).toBe("#6b7280");
  });
});
