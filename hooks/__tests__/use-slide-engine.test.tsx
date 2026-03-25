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
})
