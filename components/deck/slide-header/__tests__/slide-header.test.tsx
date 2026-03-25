import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { SlideHeader } from "../slide-header"
import { checkA11y } from "../../../../test-utils/a11y"

describe("SlideHeader", () => {
  it("renders with data-slot attribute", () => {
    render(<SlideHeader subtitle="Section" title="Title" />)
    const header = document.querySelector('[data-slot="slide-header"]')
    expect(header).toBeInTheDocument()
  })

  it("renders subtitle and title", () => {
    render(<SlideHeader subtitle="Section" title="Main Title" />)
    expect(screen.getByText("Section")).toBeInTheDocument()
    expect(screen.getByText("Main Title")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <SlideHeader subtitle="Section" title="Title" description="A description" />
    )
    expect(screen.getByText("A description")).toBeInTheDocument()
  })

  it("does not render description when not provided", () => {
    const { container } = render(
      <SlideHeader subtitle="Section" title="Title" />
    )
    expect(container.querySelector("p")).not.toBeInTheDocument()
  })

  it("applies data-deck-animate for stagger animations", () => {
    render(<SlideHeader subtitle="Section" title="Title" description="Desc" />)
    const animated = document.querySelectorAll("[data-deck-animate]")
    expect(animated).toHaveLength(3)
  })

  it("forwards custom className", () => {
    render(<SlideHeader subtitle="S" title="T" className="custom" />)
    const header = document.querySelector('[data-slot="slide-header"]')
    expect(header).toHaveClass("custom")
  })
})

describe("SlideHeader accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(
      <SlideHeader subtitle="Section" title="Title" description="Desc" />
    )
    await checkA11y(container)
  })
})
