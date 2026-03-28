import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SliderControl } from "../slider-control"
import { checkA11y } from "../../../../test-utils/a11y"

describe("SliderControl", () => {
  const defaultProps = {
    label: "Size",
    value: 0.7,
    onValueChange: vi.fn(),
  }

  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByText("Size")).toBeInTheDocument()
  })

  it("renders the label", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByText("Size")).toBeInTheDocument()
  })

  it("renders the default display value (value.toString())", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByText("0.7")).toBeInTheDocument()
  })

  it("renders a custom displayValue", () => {
    render(
      <SliderControl {...defaultProps} displayValue="70%" />,
    )
    expect(screen.getByText("70%")).toBeInTheDocument()
  })

  it("displayValue overrides default toString", () => {
    render(
      <SliderControl {...defaultProps} value={0.5} displayValue="50%" />,
    )
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.queryByText("0.5")).not.toBeInTheDocument()
  })

  // ─── Aria / Accessibility ───────────────────────────────────────────

  it("renders the slider with correct aria-label from label prop", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByRole("slider", { name: "Size" })).toBeInTheDocument()
  })

  it("renders the slider with custom aria-label", () => {
    render(<SliderControl {...defaultProps} aria-label="Custom label" />)
    expect(
      screen.getByRole("slider", { name: "Custom label" }),
    ).toBeInTheDocument()
  })

  it("sets data-slot on root element", () => {
    const { container } = render(<SliderControl {...defaultProps} />)
    expect(container.firstChild).toHaveAttribute(
      "data-slot",
      "slider-control",
    )
  })

  it("sets data-slot on value element", () => {
    const { container } = render(<SliderControl {...defaultProps} />)
    expect(
      container.querySelector("[data-slot='slider-control-value']"),
    ).toBeInTheDocument()
  })

  it("accepts className prop", () => {
    const { container } = render(
      <SliderControl {...defaultProps} className="custom" />,
    )
    expect(container.firstChild).toHaveClass("custom")
  })

  // ─── Slider props ───────────────────────────────────────────────────

  it("passes min, max, step to the slider", () => {
    render(
      <SliderControl
        {...defaultProps}
        min={0}
        max={10}
        step={0.5}
      />,
    )
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuemin", "0")
    expect(slider).toHaveAttribute("aria-valuemax", "10")
  })

  it("slider reflects the controlled value", () => {
    render(
      <SliderControl {...defaultProps} value={5} min={0} max={10} />,
    )
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuenow", "5")
  })

  it("re-renders with updated value prop", () => {
    const { rerender } = render(
      <SliderControl {...defaultProps} value={0.5} />,
    )
    expect(screen.getByText("0.5")).toBeInTheDocument()

    rerender(<SliderControl {...defaultProps} value={0.9} />)
    expect(screen.getByText("0.9")).toBeInTheDocument()
  })

  // ─── Ref ────────────────────────────────────────────────────────────

  it("forwards ref to the slider", () => {
    const ref = { current: null }
    render(<SliderControl {...defaultProps} ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  // ─── Edge cases ─────────────────────────────────────────────────────

  it("renders zero value correctly", () => {
    render(<SliderControl {...defaultProps} value={0} />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("renders negative value correctly", () => {
    render(
      <SliderControl {...defaultProps} value={-3} min={-5} max={5} />,
    )
    expect(screen.getByText("-3")).toBeInTheDocument()
  })

  it("renders very large value correctly", () => {
    render(
      <SliderControl
        {...defaultProps}
        value={1024000}
        displayValue="1.0M"
        max={2000000}
      />,
    )
    expect(screen.getByText("1.0M")).toBeInTheDocument()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(<SliderControl {...defaultProps} />)
    await checkA11y(container)
  })
})
