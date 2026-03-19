import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { useMediaQuery } from "../use-media-query"

const createMockMediaQuery = (matches: boolean) => ({
  matches,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})

describe("useMediaQuery", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns false by default when media query does not match", () => {
    const mock = createMockMediaQuery(false)
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mock as unknown as MediaQueryList
    )

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(false)
  })

  it("returns true when media query matches", () => {
    const mock = createMockMediaQuery(true)
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mock as unknown as MediaQueryList
    )

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(true)
  })

  it("registers a change event listener on mount", () => {
    const mock = createMockMediaQuery(false)
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mock as unknown as MediaQueryList
    )

    renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(mock.addEventListener).toHaveBeenCalledWith("change", expect.any(Function))
  })

  it("removes the change event listener on unmount", () => {
    const mock = createMockMediaQuery(false)
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mock as unknown as MediaQueryList
    )

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    unmount()
    expect(mock.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function))
  })

  it("updates when the media query change event fires", () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null
    const mock = {
      matches: false,
      addEventListener: vi.fn((_, handler) => {
        changeHandler = handler as (e: MediaQueryListEvent) => void
      }),
      removeEventListener: vi.fn(),
    }

    vi.spyOn(window, "matchMedia").mockReturnValue(
      mock as unknown as MediaQueryList
    )

    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(false)

    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent)
    })

    expect(result.current).toBe(true)
  })
})
