import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { CardGrid } from "../card-grid"
import { checkA11y } from "../../../../test-utils/a11y"

describe("CardGrid", () => {
  it("renders with data-slot attribute", () => {
    render(
      <CardGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </CardGrid>
    )
    const grid = document.querySelector('[data-slot="card-grid"]')
    expect(grid).toBeInTheDocument()
  })

  it("injects data-deck-animate on children", () => {
    render(
      <CardGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </CardGrid>
    )
    const animated = document.querySelectorAll("[data-deck-animate]")
    expect(animated).toHaveLength(2)
  })

  it("injects stagger delay styles on children", () => {
    render(
      <CardGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </CardGrid>
    )
    const children = document.querySelector('[data-slot="card-grid"]')!.children
    expect((children[0] as HTMLElement).style.transitionDelay).toBe("300ms")
    expect((children[1] as HTMLElement).style.transitionDelay).toBe("400ms")
  })

  it("applies custom column count", () => {
    render(
      <CardGrid columns={4}>
        <div>Card</div>
      </CardGrid>
    )
    const grid = document.querySelector('[data-slot="card-grid"]') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe("repeat(4, 1fr)")
  })

  it("does not set gridTemplateColumns for default columns (3)", () => {
    render(
      <CardGrid>
        <div>Card</div>
      </CardGrid>
    )
    const grid = document.querySelector('[data-slot="card-grid"]') as HTMLElement
    expect(grid.style.gridTemplateColumns).toBe("")
  })

  it("preserves existing child className", () => {
    render(
      <CardGrid>
        <div className="existing">Card</div>
      </CardGrid>
    )
    const child = document.querySelector('[data-slot="card-grid"]')!.firstElementChild as HTMLElement
    expect(child.className).toContain("existing")
  })

  it("handles non-element children gracefully", () => {
    render(
      <CardGrid>
        <div>Card</div>
        {null}
        {"text"}
      </CardGrid>
    )
    const grid = document.querySelector('[data-slot="card-grid"]')
    expect(grid).toBeInTheDocument()
  })

  it("forwards custom className", () => {
    render(
      <CardGrid className="custom">
        <div>Card</div>
      </CardGrid>
    )
    const grid = document.querySelector('[data-slot="card-grid"]')
    expect(grid).toHaveClass("custom")
  })
})

describe("CardGrid accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <CardGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </CardGrid>
    )
    await checkA11y(container)
  })
})
