import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { CardLift } from "../card-lift"

describe("CardLift", () => {
  it("renders children", () => {
    render(<CardLift>Card content</CardLift>)
    expect(screen.getByText("Card content")).toBeInTheDocument()
  })

  it("applies data-slot attribute", () => {
    const { container } = render(<CardLift>Content</CardLift>)
    expect(container.firstChild).toHaveAttribute("data-slot", "card-lift")
  })

  it("merges custom className", () => {
    const { container } = render(
      <CardLift className="my-custom-class">Content</CardLift>
    )
    expect(container.firstChild).toHaveClass("my-custom-class")
  })

  it("forwards ref", () => {
    const ref = { current: null }
    render(<CardLift ref={ref}>Content</CardLift>)
    expect(ref.current).not.toBeNull()
  })

  it("forwards additional HTML props", () => {
    render(<CardLift aria-label="Showcase card">Content</CardLift>)
    expect(screen.getByLabelText("Showcase card")).toBeInTheDocument()
  })

  describe("live-rewrite: --lift-color CSS variable", () => {
    it("sets --lift-color inline style when liftColor is provided", () => {
      const { container } = render(
        <CardLift liftColor="#ff0066">Content</CardLift>
      )
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue("--lift-color")).toBe("#ff0066")
    })

    it("accepts a var() reference for live-keyed halo", () => {
      const { container } = render(
        <CardLift liftColor="var(--color-acid)">Content</CardLift>
      )
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue("--lift-color")).toBe("var(--color-acid)")
    })

    it("does not set --lift-color inline when liftColor is omitted", () => {
      const { container } = render(<CardLift>Content</CardLift>)
      const el = container.firstChild as HTMLElement
      // The CSS default (from .cardLift rule) handles the fallback;
      // no inline style should override it when prop is unset.
      expect(el.style.getPropertyValue("--lift-color")).toBe("")
    })

    it("merges liftColor with additional style prop", () => {
      const { container } = render(
        <CardLift liftColor="#6366f1" style={{ margin: "1rem" }}>
          Content
        </CardLift>
      )
      const el = container.firstChild as HTMLElement
      expect(el.style.getPropertyValue("--lift-color")).toBe("#6366f1")
      expect(el.style.margin).toBe("1rem")
    })
  })
})
