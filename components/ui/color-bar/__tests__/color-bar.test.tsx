import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ColorBar } from "../color-bar"
import { checkA11y } from "../../../../test-utils/a11y"

describe("ColorBar", () => {
  it("renders with token and default label", () => {
    render(<ColorBar token="--interactive-primary-bg" />)
    expect(screen.getByText("Brand Color")).toBeInTheDocument()
    expect(screen.getByText("--interactive-primary-bg")).toBeInTheDocument()
  })

  it("renders custom label", () => {
    render(<ColorBar token="--interactive-primary-bg" label="Primary" />)
    expect(screen.getByText("Primary")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<ColorBar token="--interactive-primary-bg" />)
    expect(container.querySelector("[data-slot='color-bar']")).toBeInTheDocument()
  })

  it("applies background style from token", () => {
    const { container } = render(<ColorBar token="--interactive-primary-bg" />)
    const bar = container.querySelector("[data-slot='color-bar']") as HTMLElement
    expect(bar.style.background).toBe("var(--interactive-primary-bg)")
  })
})

describe("accessibility", () => {
  it("ColorBar has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<ColorBar token="--interactive-primary-bg" />)
    await checkA11y(container)
  })
})
