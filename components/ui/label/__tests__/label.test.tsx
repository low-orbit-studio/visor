import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Label } from "../label"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Label", () => {
  it("renders with text content", () => {
    render(<Label>Email address</Label>)
    expect(screen.getByText("Email address")).toBeInTheDocument()
  })

  it("renders as a label element", () => {
    render(<Label htmlFor="email">Email</Label>)
    const label = screen.getByText("Email")
    expect(label.tagName.toLowerCase()).toBe("label")
    expect(label).toHaveAttribute("for", "email")
  })

  it("renders with custom className", () => {
    render(<Label className="custom-class">Label</Label>)
    const label = screen.getByText("Label")
    expect(label).toHaveClass("custom-class")
  })

  it("forwards ref correctly", () => {
    const ref = { current: null }
    render(<Label ref={ref}>Label</Label>)
    expect(ref.current).not.toBeNull()
  })

  it("renders children correctly", () => {
    render(
      <Label>
        <span>Required</span>
        Field
      </Label>
    )
    expect(screen.getByText("Required")).toBeInTheDocument()
    expect(screen.getByText("Field")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (standalone label)", async () => {
    const { container } = render(<Label>Email address</Label>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (label with associated input)", async () => {
    const { container } = render(
      <div>
        <Label htmlFor="email">Email address</Label>
        <input id="email" type="email" />
      </div>
    )
    await checkA11y(container)
  })
})
