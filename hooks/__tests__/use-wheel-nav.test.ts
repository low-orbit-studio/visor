import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useRef } from "react"
import { useWheelNav } from "../use-wheel-nav"

describe("useWheelNav", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function fireWheel(target: EventTarget, deltaY: number) {
    const event = new WheelEvent("wheel", {
      deltaY,
      bubbles: true,
      cancelable: true,
    })
    target.dispatchEvent(event)
  }

  it("calls goTo with next index on scroll down", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(1)
      useWheelNav({ goTo, currentIndexRef })
    })

    fireWheel(document, 100)
    vi.advanceTimersByTime(60)

    expect(goTo).toHaveBeenCalledWith(2)
  })

  it("calls goTo with previous index on scroll up", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(3)
      useWheelNav({ goTo, currentIndexRef })
    })

    fireWheel(document, -100)
    vi.advanceTimersByTime(60)

    expect(goTo).toHaveBeenCalledWith(2)
  })

  it("debounces rapid scroll events, only calling goTo once", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(0)
      useWheelNav({ goTo, currentIndexRef })
    })

    // Fire multiple wheel events quickly
    fireWheel(document, 100)
    vi.advanceTimersByTime(30)
    fireWheel(document, 100)
    vi.advanceTimersByTime(30)
    fireWheel(document, 100)
    vi.advanceTimersByTime(60)

    expect(goTo).toHaveBeenCalledTimes(1)
  })

  it("listens on a custom containerRef when provided", () => {
    const goTo = vi.fn()
    const container = document.createElement("div")
    document.body.appendChild(container)

    renderHook(() => {
      const containerRef = useRef<HTMLElement>(container)
      const currentIndexRef = useRef(0)
      useWheelNav({ containerRef, goTo, currentIndexRef })
    })

    fireWheel(container, 100)
    vi.advanceTimersByTime(60)

    expect(goTo).toHaveBeenCalledWith(1)

    document.body.removeChild(container)
  })

  it("does not call goTo on document when custom target is used", () => {
    const goTo = vi.fn()
    const container = document.createElement("div")
    document.body.appendChild(container)

    renderHook(() => {
      const containerRef = useRef<HTMLElement>(container)
      const currentIndexRef = useRef(0)
      useWheelNav({ containerRef, goTo, currentIndexRef })
    })

    fireWheel(document, 100)
    vi.advanceTimersByTime(60)

    expect(goTo).not.toHaveBeenCalled()

    document.body.removeChild(container)
  })

  it("removes event listener on unmount", () => {
    const goTo = vi.fn()

    const { unmount } = renderHook(() => {
      const currentIndexRef = useRef(0)
      useWheelNav({ goTo, currentIndexRef })
    })

    unmount()

    fireWheel(document, 100)
    vi.advanceTimersByTime(60)

    expect(goTo).not.toHaveBeenCalled()
  })
})
