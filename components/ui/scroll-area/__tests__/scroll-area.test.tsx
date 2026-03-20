import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ScrollArea, ScrollBar } from "../scroll-area"
import { checkA11y } from "../../../../test-utils/a11y"

describe("ScrollArea", () => {
  it("renders children", () => {
    render(
      <ScrollArea>
        <div>Scroll content</div>
      </ScrollArea>
    )
    expect(screen.getByText("Scroll content")).toBeInTheDocument()
  })

  it("root has data-slot attribute", () => {
    render(
      <ScrollArea data-testid="scroll-area">
        <div>Content</div>
      </ScrollArea>
    )
    expect(screen.getByTestId("scroll-area")).toHaveAttribute("data-slot", "scroll-area")
  })

  it("viewport has data-slot attribute", () => {
    render(
      <ScrollArea>
        <div>Content</div>
      </ScrollArea>
    )
    const viewport = document.querySelector("[data-slot='scroll-area-viewport']")
    expect(viewport).toBeInTheDocument()
  })

  it("ScrollBar component accepts orientation prop", () => {
    // Radix ScrollArea does not render scrollbars in jsdom when there is no overflow.
    // We verify the component accepts the prop without throwing.
    expect(() =>
      render(
        <ScrollArea style={{ height: "100px", width: "100px" }}>
          <ScrollBar orientation="horizontal" />
          <div style={{ width: "200px", height: "200px" }}>Wide content</div>
        </ScrollArea>
      )
    ).not.toThrow()
  })

  it("renders large content without errors", () => {
    const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`)
    render(
      <ScrollArea style={{ height: "200px" }}>
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </ScrollArea>
    )
    expect(screen.getByText("Item 0")).toBeInTheDocument()
    expect(screen.getByText("Item 99")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <ScrollArea style={{ height: "200px" }} aria-label="Scrollable content">
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ScrollArea>
    )
    await checkA11y(container)
  })
})
