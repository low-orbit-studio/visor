import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Badge } from "../badge"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Badge", () => {
  it("renders with default props", () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText("New")).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Badge className="custom-class">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveClass("custom-class")
  })

  it("applies data-slot attribute", () => {
    render(<Badge>Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-slot", "badge")
  })

  it("applies data-variant for default variant", () => {
    render(<Badge>Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "default")
  })

  it("applies data-variant for secondary variant", () => {
    render(<Badge variant="secondary">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "secondary")
  })

  it("applies data-variant for outline variant", () => {
    render(<Badge variant="outline">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "outline")
  })

  it("applies data-variant for destructive variant", () => {
    render(<Badge variant="destructive">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "destructive")
  })

  it("applies data-variant for success variant", () => {
    render(<Badge variant="success">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "success")
  })

  it("applies data-variant for warning variant", () => {
    render(<Badge variant="warning">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "warning")
  })

  it("applies data-variant for info variant", () => {
    render(<Badge variant="info">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "info")
  })

  it("applies data-variant for filled-destructive variant", () => {
    render(<Badge variant="filled-destructive">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-destructive")
  })

  it("applies data-variant for filled-success variant", () => {
    render(<Badge variant="filled-success">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-success")
  })

  it("applies data-variant for filled-warning variant", () => {
    render(<Badge variant="filled-warning">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-warning")
  })

  it("applies data-variant for filled-info variant", () => {
    render(<Badge variant="filled-info">Badge</Badge>)
    expect(screen.getByText("Badge")).toHaveAttribute("data-variant", "filled-info")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<Badge ref={ref}>Badge</Badge>)
    expect(ref.current).not.toBeNull()
  })

  it("renders children correctly", () => {
    render(<Badge>Status</Badge>)
    expect(screen.getByText("Status")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default variant)", async () => {
    const { container } = render(<Badge>New</Badge>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (destructive variant)", async () => {
    const { container } = render(<Badge variant="destructive">Error</Badge>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (success variant)", async () => {
    const { container } = render(<Badge variant="success">Done</Badge>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (info variant)", async () => {
    const { container } = render(<Badge variant="info">Note</Badge>)
    await checkA11y(container)
  })
})
