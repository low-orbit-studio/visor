import { render } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useRef } from "react"
import { useIntersectionAnimation } from "../use-intersection-animation"

// Mock IntersectionObserver
let observerCallback: IntersectionObserverCallback
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

vi.stubGlobal("IntersectionObserver", class {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
})

function TestComponent({
  sections,
  setCurrentIndex,
}: {
  sections: HTMLElement[]
  setCurrentIndex: (index: number) => void
}) {
  const sectionsRef = useRef(sections)
  const currentIndexRef = useRef(0)
  useIntersectionAnimation({ sectionsRef, currentIndexRef, setCurrentIndex })
  return <div />
}

describe("useIntersectionAnimation", () => {
  let sections: HTMLElement[]
  let setCurrentIndex: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockObserve.mockClear()
    mockDisconnect.mockClear()

    sections = [
      document.createElement("div"),
      document.createElement("div"),
      document.createElement("div"),
    ]
    setCurrentIndex = vi.fn()
  })

  it("observes all sections", () => {
    render(<TestComponent sections={sections} setCurrentIndex={setCurrentIndex} />)
    expect(mockObserve).toHaveBeenCalledTimes(3)
  })

  it("sets data-deck-visible on first section immediately", () => {
    render(<TestComponent sections={sections} setCurrentIndex={setCurrentIndex} />)
    expect(sections[0].getAttribute("data-deck-visible")).toBe("true")
  })

  it("sets data-deck-visible when section intersects", () => {
    render(<TestComponent sections={sections} setCurrentIndex={setCurrentIndex} />)

    observerCallback(
      [{ target: sections[1], isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )

    expect(sections[1].getAttribute("data-deck-visible")).toBe("true")
    expect(setCurrentIndex).toHaveBeenCalledWith(1)
  })

  it("removes data-deck-visible when section leaves viewport", () => {
    render(<TestComponent sections={sections} setCurrentIndex={setCurrentIndex} />)

    // First intersect
    observerCallback(
      [{ target: sections[1], isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )

    // Then leave
    observerCallback(
      [{ target: sections[1], isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )

    expect(sections[1].hasAttribute("data-deck-visible")).toBe(false)
  })

  it("disconnects observer on unmount", () => {
    const { unmount } = render(
      <TestComponent sections={sections} setCurrentIndex={setCurrentIndex} />
    )
    unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it("does not create observer for empty sections array", () => {
    mockObserve.mockClear()
    render(<TestComponent sections={[]} setCurrentIndex={setCurrentIndex} />)
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it("ignores entries with unknown targets", () => {
    render(<TestComponent sections={sections} setCurrentIndex={setCurrentIndex} />)

    const unknownElement = document.createElement("div")
    observerCallback(
      [{ target: unknownElement, isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )

    expect(setCurrentIndex).not.toHaveBeenCalled()
  })
})
