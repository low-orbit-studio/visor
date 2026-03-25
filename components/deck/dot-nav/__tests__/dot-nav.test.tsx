import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DotNav } from "../dot-nav"
import { checkA11y } from "../../../../test-utils/a11y"

describe("DotNav", () => {
  it("renders with data-slot attribute", () => {
    render(<DotNav slideCount={3} currentIndex={0} onDotClick={vi.fn()} />)
    const nav = document.querySelector('[data-slot="dot-nav"]')
    expect(nav).toBeInTheDocument()
  })

  it("renders correct number of dots", () => {
    render(<DotNav slideCount={5} currentIndex={0} onDotClick={vi.fn()} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(5)
  })

  it("marks active dot with aria-current", () => {
    render(<DotNav slideCount={3} currentIndex={1} onDotClick={vi.fn()} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[1]).toHaveAttribute("aria-current", "true")
    expect(buttons[0]).not.toHaveAttribute("aria-current")
  })

  it("calls onDotClick with index when clicked", () => {
    const onDotClick = vi.fn()
    render(<DotNav slideCount={3} currentIndex={0} onDotClick={onDotClick} />)
    fireEvent.click(screen.getAllByRole("button")[2])
    expect(onDotClick).toHaveBeenCalledWith(2)
  })

  it("uses titles for aria-labels when provided", () => {
    render(
      <DotNav
        slideCount={2}
        currentIndex={0}
        onDotClick={vi.fn()}
        titles={["Intro", "Content"]}
      />
    )
    expect(screen.getByLabelText("Intro")).toBeInTheDocument()
    expect(screen.getByLabelText("Content")).toBeInTheDocument()
  })

  it("uses default aria-labels when no titles provided", () => {
    render(<DotNav slideCount={2} currentIndex={0} onDotClick={vi.fn()} />)
    expect(screen.getByLabelText("Go to slide 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Go to slide 2")).toBeInTheDocument()
  })

  it("renders tooltips when titles are provided", () => {
    render(
      <DotNav
        slideCount={2}
        currentIndex={0}
        onDotClick={vi.fn()}
        titles={["Intro", "Content"]}
      />
    )
    expect(screen.getByText("Intro")).toBeInTheDocument()
    expect(screen.getByText("Content")).toBeInTheDocument()
  })
})

describe("DotNav accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <DotNav slideCount={3} currentIndex={0} onDotClick={vi.fn()} />
    )
    await checkA11y(container)
  })
})
