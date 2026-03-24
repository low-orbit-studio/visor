import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Heading } from "../heading"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Heading", () => {
  it("renders as h2 by default", () => {
    render(<Heading>Title</Heading>)
    const heading = screen.getByRole("heading", { name: /title/i })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H2")
  })

  it("renders the correct heading level", () => {
    render(<Heading level={1}>Page Title</Heading>)
    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H1")
  })

  it("renders all heading levels (h1-h6)", () => {
    const levels = [1, 2, 3, 4, 5, 6] as const
    const { container } = render(
      <>
        {levels.map((level) => (
          <Heading key={level} level={level}>
            Level {level}
          </Heading>
        ))}
      </>
    )
    levels.forEach((level) => {
      const el = container.querySelector(`h${level}`)
      expect(el).toBeTruthy()
    })
  })

  it("applies custom className", () => {
    render(<Heading className="custom-class">Title</Heading>)
    const heading = screen.getByRole("heading")
    expect(heading).toHaveClass("custom-class")
  })

  it("forwards ref", () => {
    const ref = { current: null as HTMLHeadingElement | null }
    render(<Heading ref={ref}>Title</Heading>)
    expect(ref.current).toBeInstanceOf(HTMLElement)
    expect(ref.current?.tagName).toBe("H2")
  })

  it("sets data-slot attribute", () => {
    render(<Heading>Title</Heading>)
    const heading = screen.getByRole("heading")
    expect(heading).toHaveAttribute("data-slot", "heading")
  })

  it("sets data-level attribute", () => {
    render(<Heading level={3}>Title</Heading>)
    const heading = screen.getByRole("heading")
    expect(heading).toHaveAttribute("data-level", "3")
  })

  it("allows size override independent of level", () => {
    render(
      <Heading level={3} size="2xl">
        Big H3
      </Heading>
    )
    const heading = screen.getByRole("heading", { level: 3 })
    expect(heading).toBeInTheDocument()
  })

  it("passes through HTML attributes", () => {
    render(<Heading id="main-title">Title</Heading>)
    expect(screen.getByRole("heading")).toHaveAttribute("id", "main-title")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(<Heading>Accessible Heading</Heading>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (h1)", async () => {
    const { container } = render(<Heading level={1}>Page Title</Heading>)
    await checkA11y(container)
  })
})
