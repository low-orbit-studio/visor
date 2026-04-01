import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColorInput } from "../components/color-input";

// Mock child components to isolate ColorInput tests
vi.mock("../components/oklch-picker", () => ({
  OklchPicker: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="oklch-picker" data-value={value}>
      <button onClick={() => onChange("#ff0000")}>pick</button>
    </div>
  ),
}));

vi.mock("../components/shade-preview", () => ({
  ShadePreview: ({ color, role }: { color: string; role: string }) => (
    <div data-testid="shade-preview" data-color={color} data-role={role} />
  ),
}));

vi.mock("@loworbitstudio/visor-theme-engine", () => ({
  isValidColor: vi.fn((s: string) => /^#[0-9a-fA-F]{6}$/.test(s)),
  getContrastRatio: vi.fn(() => 3.2),
  normalizeHex: vi.fn((s: string) => {
    const hex = s.replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(hex)) return `#${hex.toLowerCase()}`;
    if (/^[0-9a-fA-F]{3}$/.test(hex)) {
      return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
    }
    return null;
  }),
}));

describe("ColorInput", () => {
  it("renders the role label", () => {
    render(<ColorInput role="primary" value="#6366f1" onChange={() => {}} />);
    expect(screen.getByText("primary")).toBeInTheDocument();
  });

  it("renders required badge when required", () => {
    render(
      <ColorInput role="primary" value="#6366f1" onChange={() => {}} required />
    );
    expect(screen.getByText("required")).toBeInTheDocument();
  });

  it("renders hex input with current value", () => {
    render(<ColorInput role="primary" value="#6366f1" onChange={() => {}} />);
    const input = screen.getByLabelText("primary hex value");
    expect(input).toHaveValue("#6366f1");
  });

  it("calls onChange with normalized hex on valid input", () => {
    const onChange = vi.fn();
    render(<ColorInput role="primary" value="#6366f1" onChange={onChange} />);
    const input = screen.getByLabelText("primary hex value");
    fireEvent.change(input, { target: { value: "#ff0000" } });
    expect(onChange).toHaveBeenCalledWith("#ff0000");
  });

  it("does not call onChange for invalid hex", () => {
    const onChange = vi.fn();
    render(<ColorInput role="primary" value="#6366f1" onChange={onChange} />);
    const input = screen.getByLabelText("primary hex value");
    fireEvent.change(input, { target: { value: "#xyz" } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("toggles picker open/closed on swatch click", () => {
    render(<ColorInput role="primary" value="#6366f1" onChange={() => {}} />);
    const swatch = screen.getByLabelText("Pick primary color");

    expect(screen.queryByTestId("oklch-picker")).toBeNull();

    fireEvent.click(swatch);
    expect(screen.getByTestId("oklch-picker")).toBeInTheDocument();

    fireEvent.click(swatch);
    expect(screen.queryByTestId("oklch-picker")).toBeNull();
  });

  it("shows contrast warning when below 4.5:1", () => {
    render(
      <ColorInput
        role="primary"
        value="#6366f1"
        onChange={() => {}}
        backgroundHex="#ffffff"
      />
    );
    expect(screen.getByText(/below 4.5:1/)).toBeInTheDocument();
  });

  it("shows passing contrast when ratio >= 4.5:1", async () => {
    const engine = await import("@loworbitstudio/visor-theme-engine");
    const mock = vi.mocked(engine.getContrastRatio);
    mock.mockReturnValueOnce(5.2);

    render(
      <ColorInput
        role="primary"
        value="#1e3a5f"
        onChange={() => {}}
        backgroundHex="#ffffff"
      />
    );
    expect(screen.getByText(/WCAG AA/)).toBeInTheDocument();
  });

  it("renders shade preview when showShades is true and role is a color role", () => {
    render(
      <ColorInput
        role="primary"
        value="#6366f1"
        onChange={() => {}}
        showShades
      />
    );
    expect(screen.getByTestId("shade-preview")).toBeInTheDocument();
  });

  it("does not render shade preview for background/surface roles", () => {
    render(
      <ColorInput
        role="background"
        value="#ffffff"
        onChange={() => {}}
        showShades
      />
    );
    expect(screen.queryByTestId("shade-preview")).toBeNull();
  });

  it("propagates picker selection to onChange", () => {
    const onChange = vi.fn();
    render(<ColorInput role="primary" value="#6366f1" onChange={onChange} />);

    // Open picker
    fireEvent.click(screen.getByLabelText("Pick primary color"));

    // Click mock picker button
    fireEvent.click(screen.getByText("pick"));
    expect(onChange).toHaveBeenCalledWith("#ff0000");
  });
});
