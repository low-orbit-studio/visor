import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { DeckLayout } from "../deck-layout"

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
vi.stubGlobal("IntersectionObserver", class {
  constructor() {}
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
})

describe("DeckLayout", () => {
  beforeEach(() => {
    mockObserve.mockClear()
    mockDisconnect.mockClear()
  })

  it("renders with data-slot attribute", () => {
    render(
      <DeckLayout>
        <div data-slot="slide" data-theme="light" id="s1">Slide 1</div>
      </DeckLayout>
    )
    const layout = document.querySelector('[data-slot="deck-layout"]')
    expect(layout).toBeInTheDocument()
  })

  it("renders children", () => {
    render(
      <DeckLayout>
        <div data-slot="slide" data-theme="light" id="s1">Slide content</div>
      </DeckLayout>
    )
    expect(screen.getByText("Slide content")).toBeInTheDocument()
  })

  it("renders dot navigation", () => {
    render(
      <DeckLayout>
        <div data-slot="slide" data-theme="light" id="s1">S1</div>
      </DeckLayout>
    )
    const nav = document.querySelector('[data-slot="dot-nav"]')
    expect(nav).toBeInTheDocument()
  })

  it("renders custom controls when provided", () => {
    render(
      <DeckLayout controls={() => <div data-testid="custom-control">Export</div>}>
        <div data-slot="slide" data-theme="light" id="s1">S1</div>
      </DeckLayout>
    )
    expect(screen.getByTestId("custom-control")).toBeInTheDocument()
  })

  it("forwards custom className", () => {
    render(
      <DeckLayout className="custom">
        <div data-slot="slide" data-theme="light" id="s1">S1</div>
      </DeckLayout>
    )
    const layout = document.querySelector('[data-slot="deck-layout"]')
    expect(layout).toHaveClass("custom")
  })
})
