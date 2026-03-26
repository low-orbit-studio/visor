import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { RadiusScale } from "../radius-scale"
import { checkA11y } from "../../../../test-utils/a11y"

const steps = [
  { token: "--radius-sm", name: "sm", px: 2 },
  { token: "--radius-lg", name: "lg", px: 8 },
  { token: "--radius-full", name: "full", px: 9999 },
]

describe("RadiusScale", () => {
  it("renders all steps with name and pixel value", () => {
    render(<RadiusScale steps={steps} />)
    expect(screen.getByText("sm")).toBeInTheDocument()
    expect(screen.getByText("2px")).toBeInTheDocument()
    expect(screen.getByText("lg")).toBeInTheDocument()
    expect(screen.getByText("8px")).toBeInTheDocument()
    expect(screen.getByText("full")).toBeInTheDocument()
    expect(screen.getByText("9999px")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<RadiusScale steps={steps} />)
    expect(container.querySelector("[data-slot='radius-scale']")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<RadiusScale steps={steps} />)
    await checkA11y(container)
  })
})
