import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useRef } from "react"
import { useSlideEngine } from "../use-slide-engine"

// Store callbacks for controlled execution
let rafCallbacks: Array<(ts: number) => void> = []

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
    rafCallbacks = []
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    })
    vi.spyOn(window, "scrollTo").mockImplementation(() => {})
  })

  it("returns goTo and navigateTo functions", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    expect(engine).toBeDefined()
    expect(typeof engine!.goTo).toBe("function")
    expect(typeof engine!.navigateTo).toBe("function")
  })

  it("does not navigate to out-of-bounds index", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.goTo(-1))
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it("sets data-deck-visible on target after animation completes", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    expect(rafCallbacks.length).toBe(1)

    // Simulate animation completing (p >= 1)
    act(() => {
      const cb = rafCallbacks[0]
      cb(0) // first call sets t0
    })
    act(() => {
      const cb = rafCallbacks[rafCallbacks.length - 1]
      cb(10000) // far future = animation complete
    })
  })

  it("starts animation and adds deck-scrolling class on goTo", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    expect(document.documentElement.classList.contains("deck-scrolling")).toBe(true)
    expect(window.requestAnimationFrame).toHaveBeenCalled()
  })

  it("blocks concurrent goTo while scrolling", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    const callCount = (window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length

    act(() => engine!.goTo(2))
    expect((window.requestAnimationFrame as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callCount)
  })

  it("removes deck-scrolling class when animation completes", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)

    act(() => engine!.goTo(1))
    expect(document.documentElement.classList.contains("deck-scrolling")).toBe(true)

    // Complete animation
    act(() => rafCallbacks[0](0))
    act(() => rafCallbacks[rafCallbacks.length - 1](10000))

    expect(document.documentElement.classList.contains("deck-scrolling")).toBe(false)
  })

  it("does not navigate to index >= sections.length", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.goTo(10))
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
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
    expect(window.requestAnimationFrame).toHaveBeenCalled()

    // Clean up
    document.getElementById("slide-1")?.remove()
    document.getElementById("slide-2")?.remove()
  })

  it("navigateTo with unknown ID is a no-op", () => {
    let engine: ReturnType<typeof useSlideEngine> | null = null
    render(<TestComponent onEngine={(e) => { engine = e }} />)
    act(() => engine!.navigateTo("nonexistent"))
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })
})
