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

describe("DatePicker month and alignment (VI-654)", () => {
  it("opens on the month of value, not the device month", () => {
    render(<DatePicker value={new Date(2031, 10, 14)} />)
    fireEvent.click(screen.getByRole("button"))
    expect(screen.getByText("November 2031")).toBeInTheDocument()
  })

  it("opens on the device month when no value is set", () => {
    render(<DatePicker />)
    fireEvent.click(screen.getByRole("button"))
    const label = new Date().toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    })
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("defaults popover alignment to start", () => {
    render(<DatePicker defaultOpen />)
    const content = document.querySelector("[data-slot='date-picker-content']")
    expect(content).toHaveAttribute("data-align", "start")
  })

  it("passes align to the popover", () => {
    render(<DatePicker defaultOpen align="end" />)
    const content = document.querySelector("[data-slot='date-picker-content']")
    expect(content).toHaveAttribute("data-align", "end")
  })

  it("starts open with defaultOpen", () => {
    render(<DatePicker defaultOpen />)
    expect(
      document.querySelector("[data-slot='date-picker-content']")
    ).toBeTruthy()
  })
})

describe("DatePicker accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<DatePicker />)
    await checkA11y(container)
  })

  it("has no violations with the popover open on a selected month", async () => {
    render(<DatePicker value={new Date(2031, 10, 14)} defaultOpen align="end" />)
    await checkA11y(document.body)
  })
})

describe("field-menu-bg token (VI-497)", () => {
  it("DatePicker popover content renders with content CSS class (--field-menu-bg applied via .content)", () => {
    render(<DatePicker />)
    const trigger = screen.getByRole("button")
    fireEvent.click(trigger)
    const content = document.querySelector("[data-slot='date-picker-content']")
    expect(content).not.toBeNull()
    expect(content?.classList.contains("content")).toBe(true)
  })
})
