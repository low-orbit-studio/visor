import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StepsSection } from "../steps-section"
import { checkA11y } from "../../../test-utils/a11y"

const sampleSteps = [
  { title: "Plan", description: "Define your goals and roadmap." },
  { title: "Build", description: "Implement your solution step by step." },
  { title: "Launch", description: "Ship it and gather feedback." },
]

describe("StepsSection", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    render(<StepsSection steps={sampleSteps} />)
    expect(screen.getByRole("region")).toBeInTheDocument()
  })

  it("renders heading when provided", () => {
    render(<StepsSection heading="How It Works" steps={sampleSteps} />)
    expect(screen.getByText("How It Works")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <StepsSection
        heading="How It Works"
        description="Three simple steps to get started."
        steps={sampleSteps}
      />
    )
    expect(
      screen.getByText("Three simple steps to get started.")
    ).toBeInTheDocument()
  })

  it("does not render header section when heading and description are omitted", () => {
    const { container } = render(<StepsSection steps={sampleSteps} />)
    expect(container.querySelector("[class*='header']")).not.toBeInTheDocument()
  })

  it("renders all steps", () => {
    render(<StepsSection steps={sampleSteps} />)
    expect(screen.getByText("Plan")).toBeInTheDocument()
    expect(screen.getByText("Build")).toBeInTheDocument()
    expect(screen.getByText("Launch")).toBeInTheDocument()
  })

  it("renders all step descriptions", () => {
    render(<StepsSection steps={sampleSteps} />)
    expect(
      screen.getByText("Define your goals and roadmap.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Implement your solution step by step.")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Ship it and gather feedback.")
    ).toBeInTheDocument()
  })

  // ─── Auto-numbering ─────────────────────────────────────────────────

  it("auto-numbers steps with zero-padded format (01, 02, 03)", () => {
    render(<StepsSection steps={sampleSteps} />)
    expect(screen.getByText("01")).toBeInTheDocument()
    expect(screen.getByText("02")).toBeInTheDocument()
    expect(screen.getByText("03")).toBeInTheDocument()
  })

  it("zero-pads double-digit numbers correctly (10, 11)", () => {
    const manySteps = Array.from({ length: 11 }, (_, i) => ({
      title: `Step ${i + 1}`,
      description: `Description ${i + 1}`,
    }))
    render(<StepsSection steps={manySteps} />)
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("11")).toBeInTheDocument()
  })

  // ─── Icon override ──────────────────────────────────────────────────

  it("renders icon instead of number when icon is provided", () => {
    const stepsWithIcon = [
      {
        title: "Plan",
        description: "Plan your work.",
        icon: <span data-testid="custom-icon">★</span>,
      },
      { title: "Build", description: "Build it." },
    ]
    render(<StepsSection steps={stepsWithIcon} />)
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument()
    // Number for first step should not appear (icon replaces it)
    expect(screen.queryByText("01")).not.toBeInTheDocument()
    // Second step still shows number
    expect(screen.getByText("02")).toBeInTheDocument()
  })

  // ─── Connector lines ─────────────────────────────────────────────────

  it("applies hasConnector class to all steps except the last", () => {
    const { container } = render(<StepsSection steps={sampleSteps} />)
    const stepDivs = container.querySelectorAll("[class*='step']")
    expect(stepDivs).toHaveLength(3)
    // First two steps should have the connector class
    expect(stepDivs[0].className).toMatch(/hasConnector/)
    expect(stepDivs[1].className).toMatch(/hasConnector/)
    // Last step should NOT have the connector class
    expect(stepDivs[2].className).not.toMatch(/hasConnector/)
  })

  it("single step has no connector class", () => {
    const { container } = render(
      <StepsSection steps={[sampleSteps[0]]} />
    )
    const stepDivs = container.querySelectorAll("[class*='step']")
    expect(stepDivs).toHaveLength(1)
    expect(stepDivs[0].className).not.toMatch(/hasConnector/)
  })

  // ─── className passthrough ───────────────────────────────────────────

  it("passes className to root element", () => {
    const { container } = render(
      <StepsSection steps={sampleSteps} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass("custom-class")
  })

  // ─── A11y ────────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <StepsSection
        heading="How It Works"
        description="Three simple steps."
        steps={sampleSteps}
      />
    )
    await checkA11y(container)
  })
})
