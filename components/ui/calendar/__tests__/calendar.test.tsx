import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Calendar } from "../calendar"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Calendar", () => {
  it("renders with data-slot", () => {
    const { container } = render(<Calendar />)
    expect(
      container.querySelector("[data-slot='calendar']")
    ).toBeTruthy()
  })

  it("renders month grid with day buttons", () => {
    render(<Calendar />)
    // Should have day buttons visible
    const buttons = screen.getAllByRole("gridcell")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("renders navigation buttons", () => {
    render(<Calendar />)
    // react-day-picker v9 renders nav buttons
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThanOrEqual(2) // at least prev/next
  })

  it("forwards ref to root div", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>
    render(<Calendar ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it("applies custom className", () => {
    const { container } = render(<Calendar className="custom" />)
    const root = container.querySelector("[data-slot='calendar']")
    expect(root?.className).toContain("custom")
  })
})

describe("Calendar accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<Calendar />)
    await checkA11y(container)
  })
})
