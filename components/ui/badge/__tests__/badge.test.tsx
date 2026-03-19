import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Badge } from "../badge"

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
