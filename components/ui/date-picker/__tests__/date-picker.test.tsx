import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DatePicker } from "../date-picker"
import { checkA11y } from "../../../../test-utils/a11y"

describe("DatePicker", () => {
  it("renders with data-slot", () => {
    const { container } = render(<DatePicker />)
    expect(
      container.querySelector("[data-slot='date-picker']")
    ).toBeTruthy()
  })

  it("shows placeholder when no value", () => {
    render(<DatePicker placeholder="Select date" />)
    expect(screen.getByText("Select date")).toBeInTheDocument()
  })

  it("shows formatted date when value provided", () => {
    render(<DatePicker value={new Date(2025, 0, 15)} />)
    // "PPP" format: "January 15th, 2025"
    expect(screen.getByText(/January 15/)).toBeInTheDocument()
  })

  it("opens calendar popover on click", () => {
    render(<DatePicker />)
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)
    // Calendar should now be visible
    expect(
      document.querySelector("[data-slot='date-picker-content']")
    ).toBeTruthy()
  })

  it("applies disabled state", () => {
    const { container } = render(<DatePicker disabled />)
    const trigger = container.querySelector("[data-slot='date-picker']")
    expect(trigger).toHaveAttribute("disabled")
  })

  it("forwards ref to trigger button", () => {
    const ref = {
      current: null,
    } as React.RefObject<HTMLButtonElement | null>
    render(<DatePicker ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("applies custom className", () => {
    const { container } = render(<DatePicker className="custom" />)
    const trigger = container.querySelector("[data-slot='date-picker']")
    expect(trigger?.className).toContain("custom")
  })
})

describe("DatePicker accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<DatePicker />)
    await checkA11y(container)
  })
})
