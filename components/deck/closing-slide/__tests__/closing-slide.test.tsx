import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ClosingSlide } from "../closing-slide"
import { checkA11y } from "../../../../test-utils/a11y"

describe("ClosingSlide", () => {
  it("renders with data-slot attribute", () => {
    render(<ClosingSlide />)
    const slide = document.querySelector('[data-slot="closing-slide"]')
    expect(slide).toBeInTheDocument()
  })

  it("renders default tagline", () => {
    render(<ClosingSlide />)
    expect(screen.getByText("Thank you.")).toBeInTheDocument()
  })

  it("renders custom tagline", () => {
    render(<ClosingSlide tagline="Goodbye!" />)
    expect(screen.getByText("Goodbye!")).toBeInTheDocument()
  })

  it("renders subtitle when provided", () => {
    render(<ClosingSlide subtitle="See you soon" />)
    expect(screen.getByText("See you soon")).toBeInTheDocument()
  })

  it("renders body text when provided", () => {
    render(<ClosingSlide body="Contact us" />)
    expect(screen.getByText("Contact us")).toBeInTheDocument()
  })

  it("renders extra content when provided", () => {
    render(<ClosingSlide extra={<span>Extra content</span>} />)
    expect(screen.getByText("Extra content")).toBeInTheDocument()
  })

  it("uses s-close as default id", () => {
    render(<ClosingSlide />)
    expect(document.getElementById("s-close")).toBeInTheDocument()
  })
})

describe("ClosingSlide accessibility", () => {
  it("has no WCAG 2.1 AA violations", async () => {
    const { container } = render(<ClosingSlide />)
    await checkA11y(container)
  })
})
