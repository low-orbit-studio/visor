import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SliderControl } from "../slider-control"
import { checkA11y } from "../../../../test-utils/a11y"

describe("SliderControl", () => {
  const defaultProps = {
    label: "Size",
    value: 0.7,
    onValueChange: vi.fn(),
  }

  it("renders without crashing", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByText("Size")).toBeInTheDocument()
  })

  it("renders the label", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByText("Size")).toBeInTheDocument()
  })

  it("renders the default display value", () => {
    render(<SliderControl {...defaultProps} />)
    expect(screen.getByText("0.7")).toBeInTheDocument()
  })

  it("renders a custom displayValue", () => {
    render(
      <SliderControl {...defaultProps} displayValue="70%" />,
    )
    expect(screen.getByText("70%")).toBeInTheDocument()
  })

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

  it("accepts className prop", () => {
    const { container } = render(
      <SliderControl {...defaultProps} className="custom" />,
    )
    expect(container.firstChild).toHaveClass("custom")
  })

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

  it("forwards ref to the slider", () => {
    const ref = { current: null }
    render(<SliderControl {...defaultProps} ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("passes accessibility checks", async () => {
    const { container } = render(<SliderControl {...defaultProps} />)
    await checkA11y(container)
  })
})
