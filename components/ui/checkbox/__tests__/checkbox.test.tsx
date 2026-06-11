import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Checkbox } from "../checkbox"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Checkbox", () => {
  it("renders with default props", () => {
    render(<Checkbox aria-label="Accept terms" />)
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" })
    expect(checkbox).toBeInTheDocument()
  })

  it("renders Check glyph when checked", () => {
    render(<Checkbox checked aria-label="Accept" onCheckedChange={() => {}} />)
    // Radix renders the indicator only when checked/indeterminate
    const svg = document.querySelector("svg")
    expect(svg).not.toBeNull()
  })

  it("renders Minus glyph when indeterminate", () => {
    render(
      <Checkbox checked="indeterminate" aria-label="Select all" onCheckedChange={() => {}} />
    )
    // Minus icon has a horizontal line path; Check has an angled path
    // We verify an SVG is rendered and aria-checked is "mixed"
    const checkbox = screen.getByRole("checkbox", { name: "Select all" })
    expect(checkbox).toHaveAttribute("aria-checked", "mixed")
    const svg = document.querySelector("svg")
    expect(svg).not.toBeNull()
  })

  it("renders no glyph when unchecked", () => {
    render(<Checkbox aria-label="Accept" />)
    // Radix hides the Indicator entirely when unchecked
    const svg = document.querySelector("svg")
    expect(svg).toBeNull()
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

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (unchecked)", async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (checked)", async () => {
    const { container } = render(<Checkbox defaultChecked aria-label="Accept terms" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations with label element", async () => {
    const { container } = render(
      <div>
        <Checkbox id="terms" />
        <label htmlFor="terms">Accept terms and conditions</label>
      </div>
    )
    await checkA11y(container)
  })
})
