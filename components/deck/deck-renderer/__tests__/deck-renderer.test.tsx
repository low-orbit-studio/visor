import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { DeckRenderer } from "../deck-renderer"
import type { DeckRegistry } from "../../../../lib/deck-registry"

// Mock scroll-related APIs not available in jsdom
beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((_cb) => {
    return 1
  })
  vi.spyOn(window, "scrollTo").mockImplementation(() => {})
})

function MockSlideA() {
  return (
    <section data-slot="slide" id="s-intro">
      <h1>Intro Slide</h1>
    </section>
  )
}

function MockSlideB() {
  return (
    <section data-slot="slide" id="s-features">
      <h1>Features Slide</h1>
    </section>
  )
}

function MockSlideC() {
  return (
    <section data-slot="slide" id="s-closing">
      <h1>Closing Slide</h1>
    </section>
  )
}

const testRegistry: DeckRegistry = {
  description: "A test deck for unit tests.",
  slides: [
    { id: "s-intro", title: "Introduction", section: "_title", component: MockSlideA },
    { id: "s-features", title: "Features", section: "Product", component: MockSlideB },
    { id: "s-closing", title: "Thank You", section: "_closing", component: MockSlideC },
  ],
}

describe("DeckRenderer", () => {
  it("renders all slides from the registry", () => {
    render(<DeckRenderer registry={testRegistry} />)
    expect(screen.getByText("Intro Slide")).toBeInTheDocument()
    expect(screen.getByText("Features Slide")).toBeInTheDocument()
    expect(screen.getByText("Closing Slide")).toBeInTheDocument()
  })

  it("renders with data-slot attribute", () => {
    const { container } = render(<DeckRenderer registry={testRegistry} />)
    expect(container.querySelector('[data-slot="deck-renderer"]')).toBeInTheDocument()
  })

  it("renders the deck footer by default", () => {
    const { container } = render(<DeckRenderer registry={testRegistry} />)
    expect(container.querySelector('[data-slot="deck-footer"]')).toBeInTheDocument()
  })

  it("hides the footer when showFooter is false", () => {
    const { container } = render(
      <DeckRenderer registry={testRegistry} showFooter={false} />
    )
    expect(container.querySelector('[data-slot="deck-footer"]')).not.toBeInTheDocument()
  })

  it("renders a TOC slide when showTOC is true", () => {
    render(<DeckRenderer registry={testRegistry} showTOC />)
    // "Table of Contents" appears in both the TOC heading and the dot-nav tooltip
    const matches = screen.getAllByText("Table of Contents")
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it("does not render a TOC slide by default", () => {
    render(<DeckRenderer registry={testRegistry} />)
    expect(screen.queryByText("Table of Contents")).not.toBeInTheDocument()
  })

  it("accepts a className prop", () => {
    const { container } = render(
      <DeckRenderer registry={testRegistry} className="custom-class" />
    )
    expect(container.querySelector('[data-slot="deck-renderer"]')).toHaveClass("custom-class")
  })

  it("renders a fullscreen trigger when fullscreen is enabled", () => {
    render(<DeckRenderer registry={testRegistry} fullscreen />)
    expect(screen.getByRole("button", { name: "Fullscreen" })).toBeInTheDocument()
  })

  it("uses custom fullscreen label", () => {
    render(
      <DeckRenderer registry={testRegistry} fullscreen fullscreenLabel="Present" />
    )
    expect(screen.getByRole("button", { name: "Present" })).toBeInTheDocument()
  })

  it("does not render a fullscreen trigger by default", () => {
    render(<DeckRenderer registry={testRegistry} />)
    expect(screen.queryByRole("button", { name: "Fullscreen" })).not.toBeInTheDocument()
  })
})
