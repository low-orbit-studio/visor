import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SpacingScale } from "../spacing-scale"
import { checkA11y } from "../../../../test-utils/a11y"

const steps = [
  { token: "--spacing-1", name: "1", px: 4, rem: "0.25rem" },
  { token: "--spacing-4", name: "4", px: 16, rem: "1rem" },
]

describe("SpacingScale", () => {
  it("renders all steps with name and value", () => {
    render(<SpacingScale steps={steps} />)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("4px / 0.25rem")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByText("16px / 1rem")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<SpacingScale steps={steps} />)
    expect(container.querySelector("[data-slot='spacing-scale']")).toBeInTheDocument()
  })

  it("renders proportional bar widths", () => {
    const { container } = render(<SpacingScale steps={steps} />)
    const bars = container.querySelectorAll("[class*='bar']")
    expect(bars.length).toBeGreaterThanOrEqual(2)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<SpacingScale steps={steps} />)
    await checkA11y(container)
  })
})
