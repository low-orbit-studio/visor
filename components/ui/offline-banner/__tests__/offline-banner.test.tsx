import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { OfflineBanner, useNetworkStatus } from "../offline-banner"
import { renderHook } from "@testing-library/react"
import { checkA11y } from "../../../../test-utils/a11y"

// ─── OfflineBanner component tests ───────────────────────────────────────────

describe("OfflineBanner", () => {
  describe("offline state", () => {
    it("renders offline banner when networkState is offline", () => {
      render(<OfflineBanner networkState="offline" onRetry={() => {}} />)
      expect(screen.getByRole("status")).toBeInTheDocument()
    })

    it("shows the offline label", () => {
      render(<OfflineBanner networkState="offline" onRetry={() => {}} />)
      expect(screen.getByText("You're offline")).toBeInTheDocument()
    })

    it("shows the retry button when offline", () => {
      render(<OfflineBanner networkState="offline" onRetry={() => {}} />)
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })

    it("calls onRetry when retry button is pressed", () => {
      const onRetry = vi.fn()
      render(<OfflineBanner networkState="offline" onRetry={onRetry} />)
      fireEvent.click(screen.getByRole("button", { name: /retry/i }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it("does not show retry button when onRetry is not provided", () => {
      render(<OfflineBanner networkState="offline" />)
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })

    it("applies data-slot attribute", () => {
      render(<OfflineBanner networkState="offline" />)
      expect(screen.getByRole("status")).toHaveAttribute("data-slot", "offline-banner")
    })

    it("sets data-state to 'offline'", () => {
      render(<OfflineBanner networkState="offline" />)
      expect(screen.getByRole("status")).toHaveAttribute("data-state", "offline")
    })

    it("uses a custom offline label", () => {
      render(<OfflineBanner networkState="offline" offlineLabel="No connection" />)
      expect(screen.getByText("No connection")).toBeInTheDocument()
    })
  })

  describe("reconnecting state", () => {
    it("renders reconnecting banner", () => {
      render(<OfflineBanner networkState="reconnecting" onRetry={() => {}} />)
      expect(screen.getByRole("status")).toBeInTheDocument()
    })

    it("shows the reconnecting label", () => {
      render(<OfflineBanner networkState="reconnecting" />)
      expect(screen.getByText("Reconnecting…")).toBeInTheDocument()
    })

    it("does not show the retry button when reconnecting", () => {
      render(<OfflineBanner networkState="reconnecting" onRetry={() => {}} />)
      expect(screen.queryByRole("button")).not.toBeInTheDocument()
    })

    it("sets data-state to 'reconnecting'", () => {
      render(<OfflineBanner networkState="reconnecting" />)
      expect(screen.getByRole("status")).toHaveAttribute("data-state", "reconnecting")
    })
  })

  describe("restored state", () => {
    it("renders restored banner", () => {
      render(<OfflineBanner networkState="restored" />)
      expect(screen.getByRole("status")).toBeInTheDocument()
    })

    it("shows the restored label", () => {
      render(<OfflineBanner networkState="restored" />)
      expect(screen.getByText("Back online")).toBeInTheDocument()
    })

    it("sets data-state to 'restored'", () => {
      render(<OfflineBanner networkState="restored" />)
      expect(screen.getByRole("status")).toHaveAttribute("data-state", "restored")
    })

    it("uses a custom restored label", () => {
      render(<OfflineBanner networkState="restored" restoredLabel="Connection restored" />)
      expect(screen.getByText("Connection restored")).toBeInTheDocument()
    })
  })

  describe("online state", () => {
    it("renders nothing when networkState is online", () => {
      const { container } = render(<OfflineBanner networkState="online" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe("custom labels", () => {
    it("uses custom retry label", () => {
      render(<OfflineBanner networkState="offline" onRetry={() => {}} retryLabel="Try again" />)
      expect(screen.getByText("Try again")).toBeInTheDocument()
    })

    it("uses custom reconnecting label", () => {
      render(<OfflineBanner networkState="reconnecting" reconnectingLabel="Checking connection…" />)
      expect(screen.getByText("Checking connection…")).toBeInTheDocument()
    })
  })

  describe("ref forwarding", () => {
    it("forwards ref", () => {
      const ref = { current: null }
      render(<OfflineBanner ref={ref} networkState="offline" />)
      expect(ref.current).not.toBeNull()
    })
  })
})

// ─── useNetworkStatus hook tests ──────────────────────────────────────────────

describe("useNetworkStatus", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener")
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    // Default: browser is online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("starts online when navigator.onLine is true", () => {
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.networkState).toBe("online")
  })

  it("starts offline when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false })
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.networkState).toBe("offline")
  })

  it("transitions to offline on window offline event", () => {
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current.networkState).toBe("online")

    act(() => {
      fireEvent(window, new Event("offline"))
    })
    expect(result.current.networkState).toBe("offline")
  })

  it("transitions to restored on window online event", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false })
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      fireEvent(window, new Event("online"))
    })
    expect(result.current.networkState).toBe("restored")
  })

  it("auto-dismisses restored state after restoredDisplayDuration", async () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useNetworkStatus({ restoredDisplayDuration: 500 }))

    act(() => {
      fireEvent(window, new Event("online"))
    })
    expect(result.current.networkState).toBe("restored")

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.networkState).toBe("online")

    vi.useRealTimers()
  })

  it("transitions to reconnecting then offline on retry when still offline", async () => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, "onLine", { writable: true, value: false })
    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current.networkState).toBe("offline")

    act(() => {
      result.current.retry()
    })
    expect(result.current.networkState).toBe("reconnecting")

    await act(async () => {
      vi.advanceTimersByTime(800)
    })
    expect(result.current.networkState).toBe("offline")

    vi.useRealTimers()
  })

  it("transitions to reconnecting then restored on retry when online", async () => {
    const onRetry = vi.fn().mockResolvedValue(true)
    const { result } = renderHook(() => useNetworkStatus({ onRetry }))

    await act(async () => {
      result.current.retry()
    })

    expect(result.current.networkState).toBe("restored")
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it("falls back to offline if onRetry resolves false", async () => {
    const onRetry = vi.fn().mockResolvedValue(false)
    const { result } = renderHook(() => useNetworkStatus({ onRetry }))

    await act(async () => {
      result.current.retry()
    })

    expect(result.current.networkState).toBe("offline")
  })

  it("falls back to offline if onRetry throws", async () => {
    const onRetry = vi.fn().mockRejectedValue(new Error("Network error"))
    const { result } = renderHook(() => useNetworkStatus({ onRetry }))

    await act(async () => {
      result.current.retry()
    })

    expect(result.current.networkState).toBe("offline")
  })

  it("registers and removes event listeners", () => {
    const { unmount } = renderHook(() => useNetworkStatus())
    expect(addEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function))

    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function))
  })
})

// ─── Accessibility ────────────────────────────────────────────────────────────

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (offline state)", async () => {
    const { container } = render(
      <OfflineBanner networkState="offline" onRetry={() => {}} />
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (reconnecting state)", async () => {
    const { container } = render(<OfflineBanner networkState="reconnecting" />)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (restored state)", async () => {
    const { container } = render(<OfflineBanner networkState="restored" />)
    await checkA11y(container)
  })
})
