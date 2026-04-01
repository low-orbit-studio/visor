import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { FeaturesGrid } from "../features-grid"
import { checkA11y } from "../../../test-utils/a11y"

const mockFeatures = [
  {
    icon: <span data-testid="icon-0">icon-0</span>,
    title: "Fast Performance",
    description: "Lightning-fast load times with optimized assets.",
  },
  {
    icon: <span data-testid="icon-1">icon-1</span>,
    title: "Theme Agnostic",
    description: "Works with any Visor theme out of the box.",
  },
  {
    icon: <span data-testid="icon-2">icon-2</span>,
    title: "Accessible",
    description: "WCAG 2.1 AA compliant from the start.",
  },
]

describe("FeaturesGrid", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(<FeaturesGrid features={mockFeatures} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders section heading when provided", () => {
    render(<FeaturesGrid features={mockFeatures} heading="Our Features" />)
    expect(screen.getByText("Our Features")).toBeInTheDocument()
  })

  it("renders section description when provided", () => {
    render(
      <FeaturesGrid
        features={mockFeatures}
        heading="Our Features"
        description="Everything you need to build."
      />
    )
    expect(screen.getByText("Everything you need to build.")).toBeInTheDocument()
  })

  it("renders all feature cards", () => {
    render(<FeaturesGrid features={mockFeatures} />)
    expect(screen.getByText("Fast Performance")).toBeInTheDocument()
    expect(screen.getByText("Theme Agnostic")).toBeInTheDocument()
    expect(screen.getByText("Accessible")).toBeInTheDocument()
  })

  it("renders feature descriptions", () => {
    render(<FeaturesGrid features={mockFeatures} />)
    expect(screen.getByText("Lightning-fast load times with optimized assets.")).toBeInTheDocument()
    expect(screen.getByText("Works with any Visor theme out of the box.")).toBeInTheDocument()
    expect(screen.getByText("WCAG 2.1 AA compliant from the start.")).toBeInTheDocument()
  })

  it("renders icons as ReactNode", () => {
    render(<FeaturesGrid features={mockFeatures} />)
    expect(screen.getByTestId("icon-0")).toBeInTheDocument()
    expect(screen.getByTestId("icon-1")).toBeInTheDocument()
    expect(screen.getByTestId("icon-2")).toBeInTheDocument()
  })

  // ─── Columns ────────────────────────────────────────────────────────

  it("defaults to columns=3 via data attribute", () => {
    const { container } = render(<FeaturesGrid features={mockFeatures} />)
    const grid = container.querySelector("[data-columns]")
    expect(grid).toHaveAttribute("data-columns", "3")
  })

  it("sets data-columns='2' when columns=2", () => {
    const { container } = render(
      <FeaturesGrid features={mockFeatures} columns={2} />
    )
    const grid = container.querySelector("[data-columns]")
    expect(grid).toHaveAttribute("data-columns", "2")
  })

  it("sets data-columns='4' when columns=4", () => {
    const { container } = render(
      <FeaturesGrid features={mockFeatures} columns={4} />
    )
    const grid = container.querySelector("[data-columns]")
    expect(grid).toHaveAttribute("data-columns", "4")
  })

  // ─── Optional header ────────────────────────────────────────────────

  it("does not render header section when heading and description are omitted", () => {
    const { container } = render(<FeaturesGrid features={mockFeatures} />)
    const header = container.querySelector("[class*='header']")
    expect(header).not.toBeInTheDocument()
  })

  it("renders header when only heading is provided", () => {
    render(<FeaturesGrid features={mockFeatures} heading="Features" />)
    expect(screen.getByText("Features")).toBeInTheDocument()
  })

  // ─── className passthrough ──────────────────────────────────────────

  it("passes className to root section element", () => {
    const { container } = render(
      <FeaturesGrid features={mockFeatures} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  // ─── Edge cases ─────────────────────────────────────────────────────

  it("renders empty features array without crashing", () => {
    const { container } = render(<FeaturesGrid features={[]} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <FeaturesGrid
        features={mockFeatures}
        heading="Our Features"
        description="Everything you need to build great products."
      />
    )
    await checkA11y(container)
  })
})
