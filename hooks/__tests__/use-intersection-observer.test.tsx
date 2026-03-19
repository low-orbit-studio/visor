import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  useIntersectionObserver,
  type UseIntersectionObserverOptions,
} from "../use-intersection-observer"

// Capture the observer callback and instance so tests can drive it
let capturedCallback: ((entries: IntersectionObserverEntry[]) => void) | null =
  null
let capturedObserver: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; unobserve: ReturnType<typeof vi.fn> } | null = null

const createMockEntry = (isIntersecting: boolean): IntersectionObserverEntry =>
  ({
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: {} as DOMRectReadOnly,
    intersectionRect: {} as DOMRectReadOnly,
    rootBounds: null,
    target: document.createElement("div"),
    time: Date.now(),
  }) as IntersectionObserverEntry

function TestComponent({ options }: { options?: UseIntersectionObserverOptions }) {
  const { ref, isIntersecting } = useIntersectionObserver(options)

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} data-testid="target">
      {isIntersecting ? "visible" : "hidden"}
    </div>
  )
}

describe("useIntersectionObserver", () => {
  beforeEach(() => {
    capturedCallback = null
    capturedObserver = null

    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(
        (callback: (entries: IntersectionObserverEntry[]) => void) => {
          capturedCallback = callback
          capturedObserver = {
            observe: vi.fn(),
            disconnect: vi.fn(),
            unobserve: vi.fn(),
          }
          return capturedObserver
        }
      )
    )
  })

  it("renders with isIntersecting false initially", () => {
    render(<TestComponent />)
    expect(screen.getByTestId("target").textContent).toBe("hidden")
  })

  it("starts observing the element on mount", () => {
    render(<TestComponent />)
    expect(capturedObserver?.observe).toHaveBeenCalledWith(
      screen.getByTestId("target")
    )
  })

  it("updates isIntersecting to true when entry fires", () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback!([createMockEntry(true)])
    })

    expect(screen.getByTestId("target").textContent).toBe("visible")
  })

  it("updates isIntersecting to false when element leaves viewport", () => {
    render(<TestComponent />)

    act(() => {
      capturedCallback!([createMockEntry(true)])
    })
    expect(screen.getByTestId("target").textContent).toBe("visible")

    act(() => {
      capturedCallback!([createMockEntry(false)])
    })
    expect(screen.getByTestId("target").textContent).toBe("hidden")
  })

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<TestComponent />)
    unmount()
    expect(capturedObserver?.disconnect).toHaveBeenCalled()
  })

  it("disconnects after first intersection when once=true", () => {
    render(<TestComponent options={{ once: true }} />)

    act(() => {
      capturedCallback!([createMockEntry(true)])
    })

    expect(screen.getByTestId("target").textContent).toBe("visible")
    expect(capturedObserver?.disconnect).toHaveBeenCalled()
  })

  it("does not disconnect on first non-intersecting entry when once=true", () => {
    render(<TestComponent options={{ once: true }} />)

    act(() => {
      capturedCallback!([createMockEntry(false)])
    })

    expect(capturedObserver?.disconnect).not.toHaveBeenCalled()
  })
})
