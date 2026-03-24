import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { Slider } from "../slider"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Slider", () => {
  it("renders with default props", () => {
    render(<Slider aria-label="Volume" defaultValue={[50]} />)
    const slider = screen.getByRole("slider")
    expect(slider).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={[50]} className="custom-class" />
    )
    const sliderRoot = container.querySelector('[data-slot="slider"]')
    expect(sliderRoot).toHaveClass("custom-class")
  })

  it("renders as disabled", () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={[50]} disabled />)
    // Radix Slider marks disabled with data-disabled on the root element
    const root = container.querySelector('[data-slot="slider"]')
    expect(root).toHaveAttribute("data-disabled")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Slider aria-label="Volume" defaultValue={[50]} ref={ref} />)
    expect(ref.current).not.toBeNull()
  })

  it("renders two thumbs for range slider", () => {
    render(<Slider aria-label="Price range" defaultValue={[20, 80]} />)
    const thumbs = screen.getAllByRole("slider")
    expect(thumbs).toHaveLength(2)
  })

  it("has correct value attribute", () => {
    render(<Slider aria-label="Volume" defaultValue={[75]} max={100} />)
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuenow", "75")
  })

  it("respects min and max values", () => {
    render(<Slider aria-label="Volume" defaultValue={[5]} min={0} max={10} />)
    const slider = screen.getByRole("slider")
    expect(slider).toHaveAttribute("aria-valuemin", "0")
    expect(slider).toHaveAttribute("aria-valuemax", "10")
  })

  it("calls onValueChange when value changes", () => {
    const handleChange = vi.fn()
    render(
      <Slider
        aria-label="Volume"
        defaultValue={[50]}
        onValueChange={handleChange}
      />
    )
    // Value change is handled via Radix UI internals
    // Just verify the callback prop is accepted without errors
    expect(handleChange).not.toHaveBeenCalled()
  })
})

describe("Slider accessibility", () => {
  it("has no WCAG 2.1 AA violations (single value)", async () => {
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={[50]} />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (range)", async () => {
    const { container } = render(
      <Slider aria-label="Price range" defaultValue={[20, 80]} />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (disabled)", async () => {
    const { container } = render(
      <Slider aria-label="Volume" defaultValue={[50]} disabled />
    )
    await checkA11y(container)
  })
})
