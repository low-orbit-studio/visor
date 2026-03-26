import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { OpacityBar } from "../opacity-bar"
import { checkA11y } from "../../../../test-utils/a11y"

const levels = [
  { token: "--opacity-25", name: "25%", value: 0.25 },
  { token: "--opacity-50", name: "50%", value: 0.5 },
  { token: "--opacity-100", name: "100%", value: 1 },
]

describe("OpacityBar", () => {
  it("renders all levels with name and token", () => {
    render(<OpacityBar levels={levels} />)
    expect(screen.getByText("25%")).toBeInTheDocument()
    expect(screen.getByText("--opacity-25")).toBeInTheDocument()
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<OpacityBar levels={levels} />)
    expect(container.querySelector("[data-slot='opacity-bar']")).toBeInTheDocument()
  })

  it("applies opacity style to bars", () => {
    const { container } = render(<OpacityBar levels={levels} />)
    const bars = container.querySelectorAll("[class*='bar']")
    expect(bars.length).toBeGreaterThanOrEqual(3)
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<OpacityBar levels={levels} />)
    await checkA11y(container)
  })
})
