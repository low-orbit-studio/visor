import { render, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useRef } from "react"
import { useWheelNav } from "../use-wheel-nav"

function TestComponent({ goTo }: { goTo: (index: number) => void }) {
  const currentIndexRef = useRef(2)
  useWheelNav({ goTo, currentIndexRef })
  return <div />
}

describe("useWheelNav", () => {
  let goTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    goTo = vi.fn()
    vi.useFakeTimers()
    render(<TestComponent goTo={goTo} />)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("navigates forward on scroll down", () => {
    fireEvent.wheel(document, { deltaY: 100 })
    vi.advanceTimersByTime(100)
    expect(goTo).toHaveBeenCalledWith(3)
  })

  it("navigates backward on scroll up", () => {
    fireEvent.wheel(document, { deltaY: -100 })
    vi.advanceTimersByTime(100)
    expect(goTo).toHaveBeenCalledWith(1)
  })

  it("debounces rapid scroll events", () => {
    fireEvent.wheel(document, { deltaY: 100 })
    fireEvent.wheel(document, { deltaY: 100 })
    fireEvent.wheel(document, { deltaY: 100 })
    vi.advanceTimersByTime(100)
    expect(goTo).toHaveBeenCalledTimes(1)
  })

  it("cleans up event listener and clears timeout on unmount", () => {
    const localGoTo = vi.fn()
    vi.useRealTimers()
    vi.useFakeTimers()
    const { unmount } = render(<TestComponent goTo={localGoTo} />)
    fireEvent.wheel(document, { deltaY: 100 })
    unmount()
    vi.advanceTimersByTime(100)
    expect(localGoTo).not.toHaveBeenCalled()
  })

  it("unmount without pending timeout does not throw", () => {
    const localGoTo = vi.fn()
    vi.useRealTimers()
    vi.useFakeTimers()
    const { unmount } = render(<TestComponent goTo={localGoTo} />)
    expect(() => unmount()).not.toThrow()
  })
})
