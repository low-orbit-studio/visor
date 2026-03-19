import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useDebounce } from "../use-debounce"

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("initial", 300))
    expect(result.current).toBe("initial")
  })

  it("does not update value before delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "updated" })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe("initial")
  })

  it("updates value after the delay has elapsed", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "initial" } }
    )

    rerender({ value: "updated" })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("updated")
  })

  it("resets the timer when value changes rapidly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: "a" } }
    )

    rerender({ value: "b" })
    act(() => { vi.advanceTimersByTime(200) })

    rerender({ value: "c" })
    act(() => { vi.advanceTimersByTime(200) })

    // Still not settled — 200ms into the last debounce period
    expect(result.current).toBe("a")

    act(() => { vi.advanceTimersByTime(100) })
    expect(result.current).toBe("c")
  })

  it("works with numeric values", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: 0 } }
    )

    rerender({ value: 42 })
    act(() => { vi.advanceTimersByTime(200) })

    expect(result.current).toBe(42)
  })

  it("works with object values", () => {
    const initial = { name: "Alice" }
    const updated = { name: "Bob" }

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 200),
      { initialProps: { value: initial } }
    )

    rerender({ value: updated })
    act(() => { vi.advanceTimersByTime(200) })

    expect(result.current).toEqual({ name: "Bob" })
  })
})
