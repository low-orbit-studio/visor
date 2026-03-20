import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Input } from "../input"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Input", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText("Enter text")
    expect(input).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Input className="custom-class" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Input disabled />)
    const input = screen.getByRole("textbox")
    expect(input).toBeDisabled()
  })

  it("renders with specified type", () => {
    render(<Input type="email" />)
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("type", "email")
  })

  it("passes through HTML input attributes", () => {
    render(<Input required aria-label="Name" />)
    const input = screen.getByRole("textbox")
    expect(input).toBeRequired()
    expect(input).toHaveAttribute("aria-label", "Name")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Input ref={ref} />)
    expect(ref.current).not.toBeNull()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (with aria-label)", async () => {
    const { container } = render(<Input aria-label="Search" type="search" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with associated label)", async () => {
    const { container } = render(
      <div>
        <label htmlFor="name-input">Full name</label>
        <Input id="name-input" type="text" />
      </div>
    )
    await checkA11y(container)
  })
})
