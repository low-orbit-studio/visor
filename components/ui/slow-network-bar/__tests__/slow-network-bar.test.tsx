import { render, screen, act, renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SlowNetworkBar, useSlowRequest } from "../slow-network-bar"
import { checkA11y } from "../../../../test-utils/a11y"

// ── SlowNetworkBar component ─────────────────────────────────────────────────

describe("SlowNetworkBar", () => {
  it("renders with default props (hidden state)", () => {
    const { container } = render(<SlowNetworkBar />)
    const root = container.querySelector('[data-slot="slow-network-bar"]')
    expect(root).not.toBeNull()
    expect(root).toHaveAttribute("data-state", "hidden")
  })

  it("applies data-slot to the root", () => {
    const { container } = render(<SlowNetworkBar />)
    expect(container.querySelector('[data-slot="slow-network-bar"]')).not.toBeNull()
  })

  it("renders with visible state", () => {
    const { container } = render(<SlowNetworkBar state="visible" />)
    const root = container.querySelector('[data-slot="slow-network-bar"]')
    expect(root).toHaveAttribute("data-state", "visible")
  })

  it("renders with resolving state", () => {
    const { container } = render(<SlowNetworkBar state="resolving" />)
    const root = container.querySelector('[data-slot="slow-network-bar"]')
    expect(root).toHaveAttribute("data-state", "resolving")
  })

  it("sets role=progressbar on the root", () => {
    render(<SlowNetworkBar />)
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })

  it("sets aria-busy=false when hidden", () => {
    render(<SlowNetworkBar state="hidden" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-busy", "false")
  })

  it("sets aria-busy=true when visible", () => {
    render(<SlowNetworkBar state="visible" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-busy", "true")
  })

  it("sets aria-busy=true when resolving", () => {
    render(<SlowNetworkBar state="resolving" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-busy", "true")
  })

  it("uses default aria-label", () => {
    render(<SlowNetworkBar />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Loading, please wait…")
  })

  it("uses custom aria-label when provided", () => {
    render(<SlowNetworkBar label="Exporting report…" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Exporting report…")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<SlowNetworkBar ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
  })

  it("merges custom className", () => {
    const { container } = render(<SlowNetworkBar className="my-bar" />)
    const root = container.querySelector('[data-slot="slow-network-bar"]')
    expect(root).toHaveClass("my-bar")
  })

  it("renders the fill element inside the wrapper", () => {
    const { container } = render(<SlowNetworkBar />)
    const fill = container.querySelector('[data-slot="slow-network-bar-fill"]')
    expect(fill).not.toBeNull()
  })
})

// ── useSlowRequest hook ──────────────────────────────────────────────────────

describe("useSlowRequest", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts in hidden state", () => {
    const { result } = renderHook(() => useSlowRequest(3000))
    expect(result.current.state).toBe("hidden")
  })

  it("stays hidden when trigger is called and request resolves before threshold", () => {
    const { result } = renderHook(() => useSlowRequest(3000))

    act(() => {
      result.current.trigger()
    })

    // Resolve before 3s threshold
    act(() => {
      vi.advanceTimersByTime(1000)
      result.current.resolve()
    })

    expect(result.current.state).toBe("hidden")
  })

  it("transitions to visible after threshold delay", () => {
    const { result } = renderHook(() => useSlowRequest(3000))

    act(() => {
      result.current.trigger()
    })

    expect(result.current.state).toBe("hidden")

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.state).toBe("visible")
  })

  it("transitions to resolving when resolve() is called while visible", () => {
    const { result } = renderHook(() => useSlowRequest(3000))

    act(() => {
      result.current.trigger()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.state).toBe("visible")

    act(() => {
      result.current.resolve()
    })

    expect(result.current.state).toBe("resolving")
  })

  it("returns to hidden after resolving completes (800ms)", () => {
    const { result } = renderHook(() => useSlowRequest(3000))

    act(() => {
      result.current.trigger()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    act(() => {
      result.current.resolve()
    })

    expect(result.current.state).toBe("resolving")

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(result.current.state).toBe("hidden")
  })

  it("reset() returns to hidden immediately regardless of state", () => {
    const { result } = renderHook(() => useSlowRequest(3000))

    act(() => {
      result.current.trigger()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.state).toBe("visible")

    act(() => {
      result.current.reset()
    })

    expect(result.current.state).toBe("hidden")
  })

  it("respects custom threshold", () => {
    const { result } = renderHook(() => useSlowRequest(5000))

    act(() => {
      result.current.trigger()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Still hidden — threshold is 5000ms
    expect(result.current.state).toBe("hidden")

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Now past 5s threshold
    expect(result.current.state).toBe("visible")
  })

  it("re-triggering cancels the previous threshold timer", () => {
    const { result } = renderHook(() => useSlowRequest(3000))

    act(() => {
      result.current.trigger()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Re-trigger resets the timer
    act(() => {
      result.current.trigger()
    })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    // Only 2s since the second trigger — still hidden
    expect(result.current.state).toBe("hidden")

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Now 3s since second trigger — visible
    expect(result.current.state).toBe("visible")
  })
})

// ── Accessibility ────────────────────────────────────────────────────────────

describe("SlowNetworkBar accessibility", () => {
  it("has no WCAG 2.1 AA violations (hidden state)", async () => {
    const { container } = render(<SlowNetworkBar state="hidden" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (visible state)", async () => {
    const { container } = render(
      <SlowNetworkBar state="visible" label="Loading report, please wait…" />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (resolving state)", async () => {
    const { container } = render(<SlowNetworkBar state="resolving" />)
    await checkA11y(container)
  })
})
