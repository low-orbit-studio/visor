import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useRef } from "react"
import { useIntersectionAnimation } from "../use-intersection-animation"

let lastCallback: IntersectionObserverCallback | null = null

describe("useIntersectionAnimation", () => {
  let observeSpy: ReturnType<typeof vi.fn>
  let disconnectSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    lastCallback = null
    observeSpy = vi.fn()
    disconnectSpy = vi.fn()

    const _observeSpy = observeSpy
    const _disconnectSpy = disconnectSpy

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | null = null
      readonly rootMargin: string = "0px"
      readonly thresholds: ReadonlyArray<number> = [0.4]
      constructor(cb: IntersectionObserverCallback) {
        lastCallback = cb
      }
      observe = _observeSpy as unknown as (target: Element) => void
      unobserve = vi.fn() as unknown as (target: Element) => void
      disconnect = _disconnectSpy as unknown as () => void
      takeRecords = (): IntersectionObserverEntry[] => []
    }

    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    lastCallback = null
  })

  it("does nothing when sectionsRef has no elements", () => {
    renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([])
      const currentIndexRef = useRef(0)
      const setCurrentIndex = vi.fn()
      useIntersectionAnimation({ sectionsRef, currentIndexRef, setCurrentIndex })
    })

    expect(observeSpy).not.toHaveBeenCalled()
  })

  it("observes all sections", () => {
    const sections = [
      document.createElement("section"),
      document.createElement("section"),
      document.createElement("section"),
    ]

    renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>(sections)
      const currentIndexRef = useRef(0)
      const setCurrentIndex = vi.fn()
      useIntersectionAnimation({ sectionsRef, currentIndexRef, setCurrentIndex })
    })

    expect(observeSpy).toHaveBeenCalledTimes(3)
  })

  it("sets data-deck-visible on first section immediately", () => {
    const section1 = document.createElement("section")
    const section2 = document.createElement("section")

    renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([section1, section2])
      const currentIndexRef = useRef(0)
      const setCurrentIndex = vi.fn()
      useIntersectionAnimation({ sectionsRef, currentIndexRef, setCurrentIndex })
    })

    expect(section1.getAttribute("data-deck-visible")).toBe("true")
    expect(section2.getAttribute("data-deck-visible")).toBeNull()
  })

  it("calls setCurrentIndex when a section intersects and not programmatically scrolling", () => {
    const section1 = document.createElement("section")
    const section2 = document.createElement("section")
    const setCurrentIndex = vi.fn()

    renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([section1, section2])
      const currentIndexRef = useRef(0)
      const isScrollingRef = useRef(false)
      useIntersectionAnimation({
        sectionsRef,
        currentIndexRef,
        setCurrentIndex,
        isScrollingRef,
      })
    })

    if (lastCallback) {
      lastCallback(
        [
          {
            isIntersecting: true,
            target: section2,
            intersectionRatio: 1,
            boundingClientRect: section2.getBoundingClientRect(),
            intersectionRect: section2.getBoundingClientRect(),
            rootBounds: null,
            time: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    }

    expect(setCurrentIndex).toHaveBeenCalledWith(1)
    expect(section2.getAttribute("data-deck-visible")).toBe("true")
  })

  it("does not call setCurrentIndex when isScrollingRef is true", () => {
    const section1 = document.createElement("section")
    const section2 = document.createElement("section")
    const setCurrentIndex = vi.fn()

    renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([section1, section2])
      const currentIndexRef = useRef(0)
      const isScrollingRef = useRef(true)
      useIntersectionAnimation({
        sectionsRef,
        currentIndexRef,
        setCurrentIndex,
        isScrollingRef,
      })
    })

    if (lastCallback) {
      lastCallback(
        [
          {
            isIntersecting: true,
            target: section2,
            intersectionRatio: 1,
            boundingClientRect: section2.getBoundingClientRect(),
            intersectionRect: section2.getBoundingClientRect(),
            rootBounds: null,
            time: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    }

    expect(setCurrentIndex).not.toHaveBeenCalled()
  })

  it("removes data-deck-visible when section leaves viewport", () => {
    const section1 = document.createElement("section")
    section1.setAttribute("data-deck-visible", "true")

    renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([section1])
      const currentIndexRef = useRef(0)
      const setCurrentIndex = vi.fn()
      useIntersectionAnimation({ sectionsRef, currentIndexRef, setCurrentIndex })
    })

    if (lastCallback) {
      lastCallback(
        [
          {
            isIntersecting: false,
            target: section1,
            intersectionRatio: 0,
            boundingClientRect: section1.getBoundingClientRect(),
            intersectionRect: section1.getBoundingClientRect(),
            rootBounds: null,
            time: 100,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver
      )
    }

    expect(section1.getAttribute("data-deck-visible")).toBeNull()
  })

  it("disconnects observer on unmount", () => {
    const section = document.createElement("section")

    const { unmount } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([section])
      const currentIndexRef = useRef(0)
      const setCurrentIndex = vi.fn()
      useIntersectionAnimation({ sectionsRef, currentIndexRef, setCurrentIndex })
    })

    unmount()
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
