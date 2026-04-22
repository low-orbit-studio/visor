import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DateRangePicker } from "../date-range-picker"
import { checkA11y } from "../../../../test-utils/a11y"

describe("DateRangePicker", () => {
  it("renders with data-slot", () => {
    const { container } = render(<DateRangePicker />)
    expect(
      container.querySelector("[data-slot='date-range-picker']")
    ).toBeTruthy()
  })

  it("shows placeholder when no value", () => {
    render(<DateRangePicker placeholder="Select date range" />)
    expect(screen.getByText("Select date range")).toBeInTheDocument()
  })

  it("shows '{from} –' when only from is set", () => {
    render(<DateRangePicker value={{ from: new Date(2025, 0, 15) }} />)
    // "PPP" format: "January 15th, 2025 –"
    expect(screen.getByText(/January 15.* –/)).toBeInTheDocument()
  })

  it("shows '{from} – {to}' when both dates are set", () => {
    render(
      <DateRangePicker
        value={{ from: new Date(2025, 0, 15), to: new Date(2025, 1, 20) }}
      />
    )
    expect(screen.getByText(/January 15.*–.*February 20/)).toBeInTheDocument()
  })

  it("opens calendar popover on click", () => {
    render(<DateRangePicker />)
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)
    expect(
      document.querySelector("[data-slot='date-range-picker-content']")
    ).toBeTruthy()
  })

  it("renders two months in the popover", () => {
    render(<DateRangePicker />)
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)
    const content = document.querySelector("[data-slot='date-range-picker-content']")
    const grids = content?.querySelectorAll("table") ?? []
    expect(grids.length).toBe(2)
  })

  it("applies disabled state", () => {
    const { container } = render(<DateRangePicker disabled />)
    const trigger = container.querySelector("[data-slot='date-range-picker']")
    expect(trigger).toHaveAttribute("disabled")
  })

  it("forwards ref to trigger button", () => {
    const ref = {
      current: null,
    } as React.RefObject<HTMLButtonElement | null>
    render(<DateRangePicker ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it("applies custom className", () => {
    const { container } = render(<DateRangePicker className="custom" />)
    const trigger = container.querySelector("[data-slot='date-range-picker']")
    expect(trigger?.className).toContain("custom")
  })

  it("calls onChange when a date is selected", () => {
    const onChange = vi.fn()
    render(<DateRangePicker onChange={onChange} />)
    fireEvent.click(screen.getByRole("button"))
    const content = document.querySelector("[data-slot='date-range-picker-content']")
    expect(content).toBeTruthy()
    const dayButtons = Array.from(content!.querySelectorAll("button")).filter(
      (b) => /^\d+$/.test(b.textContent?.trim() ?? "")
    )
    expect(dayButtons.length).toBeGreaterThan(0)
    fireEvent.click(dayButtons[0])
    expect(onChange).toHaveBeenCalled()
  })
})

describe("DateRangePicker accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<DateRangePicker />)
    await checkA11y(container)
  })
})
