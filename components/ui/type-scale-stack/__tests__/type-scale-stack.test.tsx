import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TypeScaleStack } from "../type-scale-stack"
import { checkA11y } from "../../../../test-utils/a11y"

const steps = [
  { token: "--font-size-xs", label: "xs", sizePx: 12, sample: "Caption text" },
  { token: "--font-size-sm", label: "sm", sizePx: 14, sample: "Small body text" },
  { token: "--font-size-lg", label: "lg", sizePx: 18, sample: "Large body text" },
]

describe("TypeScaleStack", () => {
  it("renders all steps in order", () => {
    const { container } = render(<TypeScaleStack steps={steps} />)
    const specimens = container.querySelectorAll("[data-slot='type-specimen']")
    expect(specimens).toHaveLength(3)
    // Verify order by checking text content sequence
    expect(specimens[0]).toHaveTextContent("xs")
    expect(specimens[1]).toHaveTextContent("sm")
    expect(specimens[2]).toHaveTextContent("lg")
  })

  it("renders sample text for each step", () => {
    render(<TypeScaleStack steps={steps} />)
    expect(screen.getByText("Caption text")).toBeInTheDocument()
    expect(screen.getByText("Small body text")).toBeInTheDocument()
    expect(screen.getByText("Large body text")).toBeInTheDocument()
  })

  it("renders labels and pixel sizes for each step", () => {
    render(<TypeScaleStack steps={steps} />)
    expect(screen.getByText("xs")).toBeInTheDocument()
    expect(screen.getByText("12px")).toBeInTheDocument()
    expect(screen.getByText("sm")).toBeInTheDocument()
    expect(screen.getByText("14px")).toBeInTheDocument()
  })

  it("applies stack chrome via data-slot attribute", () => {
    const { container } = render(<TypeScaleStack steps={steps} />)
    const stack = container.querySelector("[data-slot='type-scale-stack']")
    expect(stack).toBeInTheDocument()
    expect(stack?.className).toContain("stack")
  })

  it("composes TypeSpecimen for each step", () => {
    const { container } = render(<TypeScaleStack steps={steps} />)
    const specimens = container.querySelectorAll("[data-slot='type-specimen']")
    expect(specimens).toHaveLength(steps.length)
  })

  it("applies no-border class to each specimen row", () => {
    const { container } = render(<TypeScaleStack steps={steps} />)
    const specimens = container.querySelectorAll("[data-slot='type-specimen']")
    // Non-last rows get stackRow class, last row gets stackRowLast class
    expect(specimens[0]?.className).toMatch(/stackRow/)
    expect(specimens[1]?.className).toMatch(/stackRow/)
    expect(specimens[2]?.className).toMatch(/stackRowLast/)
  })

  it("renders an empty stack with no steps", () => {
    const { container } = render(<TypeScaleStack steps={[]} />)
    const stack = container.querySelector("[data-slot='type-scale-stack']")
    expect(stack).toBeInTheDocument()
    const specimens = container.querySelectorAll("[data-slot='type-specimen']")
    expect(specimens).toHaveLength(0)
  })

  it("accepts and applies a custom className", () => {
    const { container } = render(
      <TypeScaleStack steps={steps} className="custom-class" />
    )
    const stack = container.querySelector("[data-slot='type-scale-stack']")
    expect(stack?.className).toContain("custom-class")
  })

  it("matches snapshot", () => {
    const { container } = render(<TypeScaleStack steps={steps} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<TypeScaleStack steps={steps} />)
    await checkA11y(container)
  })
})
