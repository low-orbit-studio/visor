import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DesignSystemSpecimen } from "../design-system-specimen"
import { checkA11y } from "../../../test-utils/a11y"

describe("DesignSystemSpecimen", () => {
  it("renders without crashing", () => {
    render(<DesignSystemSpecimen />)
    expect(screen.getByText("Design System Specimen")).toBeInTheDocument()
  })

  it("accepts className prop", () => {
    const { container } = render(<DesignSystemSpecimen className="custom" />)
    expect(container.firstChild).toHaveClass("custom")
  })

  it("renders all section headings", () => {
    render(<DesignSystemSpecimen />)

    const expectedSections = [
      "Color Palette",
      "Typography",
      "Spacing",
      "Shadows & Elevation",
      "Surfaces",
      "Border Radius",
      "Motion & Duration",
      "Easing Curves",
      "Icons",
      "Accessibility",
      "Buttons",
      "Form Controls",
      "Component Showcase",
    ]

    for (const section of expectedSections) {
      expect(screen.getByText(section)).toBeInTheDocument()
    }
  })

  it("renders color swatches for Gray scale", () => {
    render(<DesignSystemSpecimen />)
    // Gray scale has 11 swatches (50-950)
    expect(screen.getByText("Gray")).toBeInTheDocument()
  })

  it("renders typography specimens", () => {
    render(<DesignSystemSpecimen />)
    expect(screen.getByText("Display text")).toBeInTheDocument()
    expect(screen.getByText("Page heading")).toBeInTheDocument()
    expect(screen.getByText("Default body text for reading")).toBeInTheDocument()
    expect(screen.getByText("Fine print and metadata")).toBeInTheDocument()
  })

  it("renders all button variants", () => {
    render(<DesignSystemSpecimen />)
    expect(screen.getByRole("button", { name: "default" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "secondary" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "outline" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "ghost" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "destructive" })).toBeInTheDocument()
  })

  it("renders form controls", () => {
    render(<DesignSystemSpecimen />)
    expect(screen.getByLabelText("Default", { selector: "input" })).toBeInTheDocument()
    expect(screen.getByLabelText("Unchecked")).toBeInTheDocument()
    expect(screen.getByLabelText("Option 1")).toBeInTheDocument()
  })

  it("renders force-state button wrappers", () => {
    const { container } = render(<DesignSystemSpecimen />)
    const hoverWrapper = container.querySelector("[data-force-state='hover']")
    const activeWrapper = container.querySelector("[data-force-state='active']")
    const focusWrapper = container.querySelector("[data-force-state='focus']")
    expect(hoverWrapper).toBeInTheDocument()
    expect(activeWrapper).toBeInTheDocument()
    expect(focusWrapper).toBeInTheDocument()
  })

  it("renders accessibility contrast badges", () => {
    render(<DesignSystemSpecimen />)
    // Should have multiple AA and AAA badges
    const aaBadges = screen.getAllByText(/^AA/)
    const aaaBadges = screen.getAllByText(/^AAA/)
    expect(aaBadges.length).toBeGreaterThan(0)
    expect(aaaBadges.length).toBeGreaterThan(0)
  })

  it("renders icon specimens", () => {
    render(<DesignSystemSpecimen />)
    expect(screen.getByText("Icon Map")).toBeInTheDocument()
    expect(screen.getByText("Size Scale")).toBeInTheDocument()
    expect(screen.getByText("Home / dashboard")).toBeInTheDocument()
  })

  it("renders component showcase items", () => {
    render(<DesignSystemSpecimen />)
    expect(screen.getByText("Card Title")).toBeInTheDocument()
    // "Default" appears in many places (labels, badges, alerts) — check badge specifically
    const badges = screen.getAllByText("Default")
    expect(badges.length).toBeGreaterThan(0)
  })

  it("passes accessibility checks", async () => {
    const { container } = render(<DesignSystemSpecimen />)
    await checkA11y(container)
  })
})
