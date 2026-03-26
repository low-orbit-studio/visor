import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SurfaceRow } from "../surface-row"
import { checkA11y } from "../../../../test-utils/a11y"

describe("SurfaceRow", () => {
  it("renders name and token", () => {
    render(<SurfaceRow token="--surface-card" name="Card" />)
    expect(screen.getByText("Card")).toBeInTheDocument()
    expect(screen.getByText("--surface-card")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<SurfaceRow token="--surface-card" name="Card" />)
    expect(container.querySelector("[data-slot='surface-row']")).toBeInTheDocument()
  })

  it("renders dark text by default", () => {
    const { container } = render(<SurfaceRow token="--surface-card" name="Card" />)
    const label = container.querySelector("[data-slot='surface-row'] > span:first-child")
    expect(label).toHaveStyle({ color: "var(--text-primary, #111827)" })
  })

  it("renders light text when lightText is true", () => {
    const { container } = render(
      <SurfaceRow token="--surface-overlay" name="Overlay" lightText />
    )
    const label = container.querySelector("[data-slot='surface-row'] > span:first-child")
    expect(label).toHaveStyle({ color: "var(--text-inverse, #ffffff)" })
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<SurfaceRow token="--surface-card" name="Card" />)
    await checkA11y(container)
  })
})
