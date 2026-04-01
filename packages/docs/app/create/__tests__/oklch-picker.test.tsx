import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OklchPicker } from "../components/oklch-picker";

// Mock canvas context — jsdom doesn't support canvas
const mockGetContext = vi.fn(() => ({
  createImageData: vi.fn((w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  })),
  putImageData: vi.fn(),
}));

beforeEach(() => {
  // Mock HTMLCanvasElement.getContext
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext
  );

  // Mock getBoundingClientRect for canvas sizing
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 200,
    height: 140,
    top: 0,
    left: 0,
    bottom: 140,
    right: 200,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
});

vi.mock("@loworbitstudio/visor-theme-engine", () => ({
  hexToOklch: vi.fn(() => [0.55, 0.15, 260] as [number, number, number]),
  oklchToHex: vi.fn(() => "#6366f1"),
  clampToSrgb: vi.fn(() => [99, 102, 241] as [number, number, number]),
  rgbToHex: vi.fn(() => "#6366f1"),
}));

describe("OklchPicker", () => {
  it("renders the picker group", () => {
    render(<OklchPicker value="#6366f1" onChange={() => {}} />);
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-label",
      "OKLCH color picker"
    );
  });

  it("renders lightness/chroma plane slider", () => {
    render(<OklchPicker value="#6366f1" onChange={() => {}} />);
    expect(
      screen.getByRole("slider", { name: "Lightness and chroma" })
    ).toBeInTheDocument();
  });

  it("renders hue slider", () => {
    render(<OklchPicker value="#6366f1" onChange={() => {}} />);
    expect(
      screen.getByRole("slider", { name: "Hue" })
    ).toBeInTheDocument();
  });

  it("displays current OKLCH axis labels", () => {
    render(<OklchPicker value="#6366f1" onChange={() => {}} />);
    expect(screen.getByText(/Hue: 260/)).toBeInTheDocument();
    expect(screen.getByText(/L: 0.55/)).toBeInTheDocument();
    expect(screen.getByText(/C: 0.150/)).toBeInTheDocument();
  });

  it("calls onChange when plane is clicked", () => {
    const onChange = vi.fn();
    render(<OklchPicker value="#6366f1" onChange={onChange} />);

    const plane = screen.getByRole("slider", { name: "Lightness and chroma" });

    // Mock getBoundingClientRect for the wrapper div
    vi.spyOn(plane, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 140,
      top: 0,
      left: 0,
      bottom: 140,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    // jsdom doesn't support setPointerCapture, but we guard it in the component
    fireEvent.pointerDown(plane, { clientX: 100, clientY: 70, pointerId: 1 });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange when hue slider is clicked", () => {
    const onChange = vi.fn();
    render(<OklchPicker value="#6366f1" onChange={onChange} />);

    const hueSlider = screen.getByRole("slider", { name: "Hue" });

    vi.spyOn(hueSlider, "getBoundingClientRect").mockReturnValue({
      width: 200,
      height: 16,
      top: 0,
      left: 0,
      bottom: 16,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.pointerDown(hueSlider, { clientX: 100, pointerId: 1 });
    expect(onChange).toHaveBeenCalled();
  });

  it("renders crosshair indicator", () => {
    const { container } = render(
      <OklchPicker value="#6366f1" onChange={() => {}} />
    );
    const crosshair = container.querySelector("[class*='crosshair']");
    expect(crosshair).not.toBeNull();
  });

  it("renders hue indicator", () => {
    const { container } = render(
      <OklchPicker value="#6366f1" onChange={() => {}} />
    );
    const hueIndicator = container.querySelector("[class*='hueIndicator']");
    expect(hueIndicator).not.toBeNull();
  });
});
