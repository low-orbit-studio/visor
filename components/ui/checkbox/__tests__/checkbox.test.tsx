import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Checkbox } from "../checkbox"

describe("Checkbox", () => {
  it("renders with default props", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Checkbox className="custom-class" aria-label="Accept" />)
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Checkbox disabled aria-label="Accept" />)
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeDisabled()
  })

  it("is unchecked by default", () => {
    render(<Checkbox aria-label="Accept" />)
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).not.toBeChecked()
  })

  it("calls onCheckedChange when clicked", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Checkbox onCheckedChange={handleChange} aria-label="Accept" />)
    const checkbox = screen.getByRole("checkbox")
    await user.click(checkbox)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it("renders as checked when defaultChecked is true", () => {
    render(<Checkbox defaultChecked aria-label="Accept" />)
    const checkbox = screen.getByRole("checkbox")
    expect(checkbox).toBeChecked()
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Checkbox ref={ref} aria-label="Accept" />)
    expect(ref.current).not.toBeNull()
  })
})
