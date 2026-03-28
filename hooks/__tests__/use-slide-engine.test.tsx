import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useRef } from "react"
import { useSlideEngine } from "../use-slide-engine"

function TestComponent({
  onEngine,
}: {
  onEngine: (engine: ReturnType<typeof useSlideEngine>) => void
}) {
  const sections = [
    document.createElement("div"),
    document.createElement("div"),
    document.createElement("div"),
  ]
  const sectionsRef = useRef(sections)
  const currentIndexRef = useRef(0)
  const engine = useSlideEngine({ sectionsRef, currentIndexRef })
  onEngine(engine)
  return <div />
}

describe("useSlideEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Mock scrollIntoView since jsdom doesn't implement it
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("returns goTo, navigateTo, and isScrollingRef", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    expect(typeof engine!.goTo).toBe("function")
    expect(typeof engine!.navigateTo).toBe("function")
    expect(engine!.isScrollingRef).toBeDefined()
  })

  it("does not navigate to out-of-bounds index", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.goTo(-1))
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it("does not navigate to index >= sections.length", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.goTo(10))
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it("goTo sets isScrollingRef and calls scrollIntoView", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    expect(engine!.isScrollingRef.current).toBe(true)
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    })
  })

  it("sets data-deck-visible on target slide", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    const sections = [
      document.createElement("div"),
      document.createElement("div"),
    ]
    const sectionsRef = { current: sections }
    const currentIndexRef = { current: 0 }

    function Component({ onEngine }: { onEngine: (e: ReturnType<typeof useSlideEngine>) => void }) {
      const eng = useSlideEngine({ sectionsRef: sectionsRef as React.RefObject<HTMLElement[]>, currentIndexRef })
      onEngine(eng)
      return <div />
    }

    render(<Component onEngine={(e) => { engine = e }} />)
    act(() => engine!.goTo(1))
    expect(sections[1].getAttribute("data-deck-visible")).toBe("true")
  })

  it("blocks concurrent goTo while scrolling", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    const callCount = (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.calls.length

    act(() => engine!.goTo(2))
    // Should not have scrolled again
    expect((Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount)
  })

  it("unlocks isScrollingRef after timeout", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    expect(engine!.isScrollingRef.current).toBe(true)

    act(() => vi.advanceTimersByTime(600))
    expect(engine!.isScrollingRef.current).toBe(false)
  })

  it("navigateTo resolves element ID to correct index", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null

    function NavTestComponent({
      onEngine,
    }: {
      onEngine: (engine: ReturnType<typeof useSlideEngine>) => void
    }) {
      const el1 = document.createElement("div")
      el1.id = "slide-1"
      const el2 = document.createElement("div")
      el2.id = "slide-2"
      document.body.appendChild(el1)
      document.body.appendChild(el2)
      const sectionsRef = useRef([el1, el2])
      const currentIndexRef = useRef(0)
      const eng = useSlideEngine({ sectionsRef, currentIndexRef })
      onEngine(eng)
      return <div />
    }

    render(<NavTestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.navigateTo("slide-2"))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()

    document.getElementById("slide-1")?.remove()
    document.getElementById("slide-2")?.remove()
  })

  it("navigateTo with unknown ID is a no-op", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.navigateTo("nonexistent"))
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
