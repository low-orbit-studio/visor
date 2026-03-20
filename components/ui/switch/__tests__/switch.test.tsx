import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Switch } from "../switch"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Switch", () => {
  it("renders with default props", () => {
    render(<Switch aria-label="Enable notifications" />)
    const switchEl = screen.getByRole("switch", { name: "Enable notifications" })
    expect(switchEl).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Switch className="custom-class" aria-label="Toggle" />)
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Switch disabled aria-label="Toggle" />)
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toBeDisabled()
  })

  it("is unchecked by default", () => {
    render(<Switch aria-label="Toggle" />)
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toHaveAttribute("data-state", "unchecked")
  })

  it("calls onCheckedChange when clicked", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onCheckedChange={handleChange} aria-label="Toggle" />)
    const switchEl = screen.getByRole("switch")
    await user.click(switchEl)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it("renders as checked when defaultChecked is true", () => {
    render(<Switch defaultChecked aria-label="Toggle" />)
    const switchEl = screen.getByRole("switch")
    expect(switchEl).toHaveAttribute("data-state", "checked")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Switch ref={ref} aria-label="Toggle" />)
    expect(ref.current).not.toBeNull()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (unchecked)", async () => {
    const { container } = render(<Switch aria-label="Enable notifications" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (checked)", async () => {
    const { container } = render(<Switch defaultChecked aria-label="Enable notifications" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations with label element", async () => {
    const { container } = render(
      <div>
        <Switch id="notifications" />
        <label htmlFor="notifications">Enable notifications</label>
      </div>
    )
    await checkA11y(container)
  })
})
