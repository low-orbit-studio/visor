import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useRef } from "react"
import { useIntersectionObserver } from "../use-intersection-observer"

// Controllable IntersectionObserver mock
let lastCallback: IntersectionObserverCallback | null = null
let observeSpy: ReturnType<typeof vi.fn>
let disconnectSpy: ReturnType<typeof vi.fn>

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = "0px"
  readonly thresholds: ReadonlyArray<number> = [0]

  constructor(cb: IntersectionObserverCallback) {
    lastCallback = cb
  }

  observe = observeSpy as unknown as (target: Element) => void
  unobserve = vi.fn() as unknown as (target: Element) => void
  disconnect = disconnectSpy as unknown as () => void
  takeRecords = (): IntersectionObserverEntry[] => []
}

describe("useIntersectionObserver", () => {
  beforeEach(() => {
    lastCallback = null
    observeSpy = vi.fn()
    disconnectSpy = vi.fn()

    // Recreate class so it picks up fresh spies
    class FreshMock implements IntersectionObserver {
      readonly root: Element | null = null
      readonly rootMargin: string = "0px"
      readonly thresholds: ReadonlyArray<number> = [0]
      constructor(cb: IntersectionObserverCallback) {
        lastCallback = cb
      }
      observe = observeSpy as unknown as (target: Element) => void
      unobserve = vi.fn() as unknown as (target: Element) => void
      disconnect = disconnectSpy as unknown as () => void
      takeRecords = (): IntersectionObserverEntry[] => []
    }

    vi.stubGlobal("IntersectionObserver", FreshMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    lastCallback = null
  })

  it("returns a ref, isIntersecting=false, and entry=null by default", () => {
    const { result } = renderHook(() => useIntersectionObserver())
    expect(result.current.ref).toBeDefined()
    expect(result.current.isIntersecting).toBe(false)
    expect(result.current.entry).toBeNull()
  })

  it("updates isIntersecting to true when callback fires with isIntersecting=true", () => {
    const el = document.createElement("div")
    const { result } = renderHook(() => {
      const hook = useIntersectionObserver()
      // Attach element to ref before render so effect can observe it
      ;(hook.ref as React.MutableRefObject<Element | null>).current = el
      return hook
    })

    act(() => {
      if (lastCallback) {
        lastCallback(
          [
            {
              isIntersecting: true,
              target: el,
              intersectionRatio: 1,
              boundingClientRect: el.getBoundingClientRect(),
              intersectionRect: el.getBoundingClientRect(),
              rootBounds: null,
              time: 0,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        )
      }
    })

    expect(result.current.isIntersecting).toBe(true)
    expect(result.current.entry).not.toBeNull()
  })

  it("updates isIntersecting to false after previously intersecting", () => {
    const el = document.createElement("div")
    const { result } = renderHook(() => {
      const hook = useIntersectionObserver()
      ;(hook.ref as React.MutableRefObject<Element | null>).current = el
      return hook
    })

    // Enter viewport
    act(() => {
      if (lastCallback) {
        lastCallback(
          [
            {
              isIntersecting: true,
              target: el,
              intersectionRatio: 1,
              boundingClientRect: el.getBoundingClientRect(),
              intersectionRect: el.getBoundingClientRect(),
              rootBounds: null,
              time: 0,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        )
      }
    })

    expect(result.current.isIntersecting).toBe(true)

    // Leave viewport
    act(() => {
      if (lastCallback) {
        lastCallback(
          [
            {
              isIntersecting: false,
              target: el,
              intersectionRatio: 0,
              boundingClientRect: el.getBoundingClientRect(),
              intersectionRect: el.getBoundingClientRect(),
              rootBounds: null,
              time: 100,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        )
      }
    })

    expect(result.current.isIntersecting).toBe(false)
  })

  it("disconnects observer on unmount", () => {
    const el = document.createElement("div")
    const { unmount } = renderHook(() => {
      const hook = useIntersectionObserver()
      ;(hook.ref as React.MutableRefObject<Element | null>).current = el
      return hook
    })

    unmount()

    expect(disconnectSpy).toHaveBeenCalled()
  })

  it("disconnects after first intersection when once=true", () => {
    const el = document.createElement("div")
    const { result } = renderHook(() => {
      const hook = useIntersectionObserver({ once: true })
      ;(hook.ref as React.MutableRefObject<Element | null>).current = el
      return hook
    })

    act(() => {
      if (lastCallback) {
        lastCallback(
          [
            {
              isIntersecting: true,
              target: el,
              intersectionRatio: 1,
              boundingClientRect: el.getBoundingClientRect(),
              intersectionRect: el.getBoundingClientRect(),
              rootBounds: null,
              time: 0,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver
        )
      }
    })

    expect(disconnectSpy).toHaveBeenCalled()
    expect(result.current.isIntersecting).toBe(true)
  })
})
