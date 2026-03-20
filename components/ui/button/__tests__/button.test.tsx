import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Button } from "../button"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Button className="custom-class">Button</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("passes through HTML button attributes", () => {
    render(<Button type="submit">Submit</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "submit")
  })

  it("renders children correctly", () => {
    render(
      <Button>
        <span>Icon</span>
        Label
      </Button>
    )
    expect(screen.getByText("Label")).toBeInTheDocument()
    expect(screen.getByText("Icon")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(<Button>Click me</Button>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (disabled)", async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    await checkA11y(container)
  })
})
