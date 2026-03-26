import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ElevationCard } from "../elevation-card"
import { checkA11y } from "../../../../test-utils/a11y"

describe("ElevationCard", () => {
  it("renders name and token", () => {
    render(<ElevationCard token="--shadow-md" name="md" />)
    expect(screen.getByText("md")).toBeInTheDocument()
    expect(screen.getByText("--shadow-md")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<ElevationCard token="--shadow-md" name="md" />)
    expect(container.querySelector("[data-slot='elevation-card']")).toBeInTheDocument()
  })

  it("applies box-shadow style from token", () => {
    const { container } = render(<ElevationCard token="--shadow-lg" name="lg" />)
    const card = container.querySelector("[data-slot='elevation-card']")
    expect(card).toHaveStyle({ boxShadow: "var(--shadow-lg)" })
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<ElevationCard token="--shadow-md" name="md" />)
    await checkA11y(container)
  })
})
