import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useRef } from "react"
import { useSlideEngine } from "../use-slide-engine"

describe("useSlideEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns goTo, navigateTo, and isScrollingRef", () => {
    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([])
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef })
    })

    expect(typeof result.current.goTo).toBe("function")
    expect(typeof result.current.navigateTo).toBe("function")
    expect(result.current.isScrollingRef).toBeDefined()
    expect(result.current.isScrollingRef.current).toBe(false)
  })

  it("goTo scrolls to the correct section element", () => {
    const sections = [
      document.createElement("section"),
      document.createElement("section"),
    ]
    const scrollIntoViewMock = vi.fn()
    sections.forEach((s) => {
      s.scrollIntoView = scrollIntoViewMock
    })

    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>(sections)
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef })
    })

    act(() => {
      result.current.goTo(1)
    })

    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1)
    expect(sections[1].getAttribute("data-deck-visible")).toBe("true")
  })

  it("goTo updates currentIndexRef and calls setCurrentIndex", () => {
    const sections = [
      document.createElement("section"),
      document.createElement("section"),
    ]
    sections.forEach((s) => {
      s.scrollIntoView = vi.fn()
    })
    const setCurrentIndex = vi.fn()

    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>(sections)
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef, setCurrentIndex })
    })

    act(() => {
      result.current.goTo(1)
    })

    expect(setCurrentIndex).toHaveBeenCalledWith(1)
  })

  it("sets isScrollingRef to true during scroll and false after timeout", () => {
    const sections = [
      document.createElement("section"),
      document.createElement("section"),
    ]
    sections.forEach((s) => {
      s.scrollIntoView = vi.fn()
    })

    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>(sections)
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef })
    })

    act(() => {
      result.current.goTo(1)
    })

    expect(result.current.isScrollingRef.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(600)
    })

    expect(result.current.isScrollingRef.current).toBe(false)
  })

  it("goTo ignores out-of-bounds indices", () => {
    const sections = [
      document.createElement("section"),
    ]
    const scrollIntoViewMock = vi.fn()
    sections[0].scrollIntoView = scrollIntoViewMock

    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>(sections)
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef })
    })

    act(() => {
      result.current.goTo(-1)
    })
    expect(scrollIntoViewMock).not.toHaveBeenCalled()

    act(() => {
      result.current.goTo(5)
    })
    expect(scrollIntoViewMock).not.toHaveBeenCalled()
  })

  it("goTo ignores calls while already scrolling", () => {
    const sections = [
      document.createElement("section"),
      document.createElement("section"),
      document.createElement("section"),
    ]
    const scrollIntoViewMocks = sections.map(() => vi.fn())
    sections.forEach((s, i) => {
      s.scrollIntoView = scrollIntoViewMocks[i]
    })

    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>(sections)
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef })
    })

    act(() => {
      result.current.goTo(1)
    })
    // While scrolling, a second call should be ignored
    act(() => {
      result.current.goTo(2)
    })

    expect(scrollIntoViewMocks[2]).not.toHaveBeenCalled()
  })

  it("navigateTo scrolls to a section by its element id", () => {
    const section = document.createElement("section")
    section.id = "slide-2"
    section.scrollIntoView = vi.fn()
    document.body.appendChild(section)

    const { result } = renderHook(() => {
      const sectionsRef = useRef<HTMLElement[]>([section])
      const currentIndexRef = useRef(0)
      return useSlideEngine({ sectionsRef, currentIndexRef })
    })

    act(() => {
      result.current.navigateTo("slide-2")
    })

    expect(section.scrollIntoView).toHaveBeenCalled()

    document.body.removeChild(section)
  })
})
