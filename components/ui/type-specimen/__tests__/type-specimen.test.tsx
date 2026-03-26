import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { TypeSpecimen } from "../type-specimen"
import { checkA11y } from "../../../../test-utils/a11y"

describe("TypeSpecimen", () => {
  it("renders label, size, and sample text", () => {
    render(
      <TypeSpecimen token="--font-size-xl" label="xl" sizePx={20} sampleText="Subsection heading" />
    )
    expect(screen.getByText("xl")).toBeInTheDocument()
    expect(screen.getByText("20px")).toBeInTheDocument()
    expect(screen.getByText("Subsection heading")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(
      <TypeSpecimen token="--font-size-base" label="base" sizePx={16} sampleText="Body text" />
    )
    expect(container.querySelector("[data-slot='type-specimen']")).toBeInTheDocument()
  })

  it("applies font-size style from token", () => {
    const { container } = render(
      <TypeSpecimen token="--font-size-xl" label="xl" sizePx={20} sampleText="Test" />
    )
    const sample = container.querySelector("[data-slot='type-specimen'] > div:last-child")
    expect(sample).toHaveStyle({ fontSize: "var(--font-size-xl, 20px)" })
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <TypeSpecimen token="--font-size-xl" label="xl" sizePx={20} sampleText="Test" />
    )
    await checkA11y(container)
  })
})
