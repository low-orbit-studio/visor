import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AccessibilitySpecimen } from "../accessibility-specimen"
import { checkA11y } from "../../../../test-utils/a11y"

const defaultProps = {
  fgToken: "--text-primary",
  bgToken: "--surface-page",
  fgLabel: "text-primary",
  bgLabel: "surface-page",
  ratio: 15.4,
  wcagAA: true,
  wcagAAA: true,
}

describe("AccessibilitySpecimen", () => {
  it("renders labels and ratio", () => {
    render(<AccessibilitySpecimen {...defaultProps} />)
    expect(screen.getByText("text-primary / surface-page")).toBeInTheDocument()
    expect(screen.getByText("15.4:1")).toBeInTheDocument()
  })

  it("renders AA and AAA badges", () => {
    render(<AccessibilitySpecimen {...defaultProps} />)
    const aaBadges = screen.getAllByText(/^AA/)
    expect(aaBadges.length).toBe(2) // AA and AAA
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<AccessibilitySpecimen {...defaultProps} />)
    expect(container.querySelector("[data-slot='accessibility-specimen']")).toBeInTheDocument()
  })

  it("renders preview swatch with Aa text", () => {
    render(<AccessibilitySpecimen {...defaultProps} />)
    expect(screen.getByText("Aa")).toBeInTheDocument()
  })

  it("shows pass marks when WCAG passes", () => {
    render(<AccessibilitySpecimen {...defaultProps} wcagAA wcagAAA />)
    const badges = screen.getAllByText(/\u2713/)
    expect(badges.length).toBe(2)
  })

  it("shows fail marks when WCAG fails", () => {
    render(<AccessibilitySpecimen {...defaultProps} wcagAA={false} wcagAAA={false} />)
    const badges = screen.getAllByText(/\u2717/)
    expect(badges.length).toBe(2)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<AccessibilitySpecimen {...defaultProps} />)
    await checkA11y(container)
  })
})
