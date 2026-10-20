import { readFileSync } from "node:fs"
import path from "node:path"
import { render, screen, fireEvent } from "@testing-library/react"
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

  it("takes focus when it fills the viewport, so arrow keys work without a click", () => {
    const spy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ height: window.innerHeight } as DOMRect)
    render(
      <DeckLayout>
        <div data-slot="slide" data-theme="light" id="s1">S1</div>
      </DeckLayout>
    )
    expect(document.activeElement).toBe(document.querySelector('[data-slot="deck-layout"]'))
    spy.mockRestore()
  })

  it("leaves focus alone when embedded in a shorter frame", () => {
    const spy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ height: 400 } as DOMRect)
    render(
      <DeckLayout>
        <div data-slot="slide" data-theme="light" id="s1">S1</div>
      </DeckLayout>
    )
    expect(document.activeElement).toBe(document.body)
    spy.mockRestore()
  })

  it("hands focus back to the deck after a dot click", () => {
    HTMLElement.prototype.scrollTo = vi.fn() // happy-dom has no scrolling
    render(
      <DeckLayout slideTitles={["One", "Two"]}>
        <div data-slot="slide" data-theme="light" id="s1">S1</div>
        <div data-slot="slide" data-theme="light" id="s2">S2</div>
      </DeckLayout>
    )
    const dot = document.querySelector('[data-slot="dot-nav"] button') as HTMLButtonElement
    dot.focus()
    fireEvent.click(dot)
    expect(document.activeElement).toBe(document.querySelector('[data-slot="deck-layout"]'))
  })

  // happy-dom has no layout engine, so guard the two rules a bare host needs
  // (VI-716: without them slides overflow the viewport and the deck can't scroll).
  it("sizes itself and owns border-box rather than relying on the host", () => {
    const css = readFileSync(path.join(__dirname, "../deck-layout.module.css"), "utf8")
    expect(css).toMatch(/height:\s*100dvh/)
    expect(css).toMatch(/max-height:\s*100%/)
    expect(css).toMatch(/:where\(\.container\) \*[\s\S]*box-sizing:\s*border-box/)
  })
})
