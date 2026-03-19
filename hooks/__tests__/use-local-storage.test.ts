import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { useLocalStorage } from "../use-local-storage"

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  it("returns the initial value when localStorage is empty", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default")
    )
    expect(result.current[0]).toBe("default")
  })

  it("returns existing localStorage value on first render", () => {
    window.localStorage.setItem("test-key", JSON.stringify("stored"))
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default")
    )
    expect(result.current[0]).toBe("stored")
  })

  it("updates state and localStorage when setValue is called", () => {
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "initial")
    )

    act(() => {
      result.current[1]("updated")
    })

    expect(result.current[0]).toBe("updated")
    expect(JSON.parse(window.localStorage.getItem("test-key")!)).toBe("updated")
  })

  it("supports functional updates", () => {
    const { result } = renderHook(() =>
      useLocalStorage("count", 0)
    )

    act(() => {
      result.current[1]((prev) => prev + 1)
    })

    expect(result.current[0]).toBe(1)
  })

  it("removes value from localStorage when removeValue is called", () => {
    window.localStorage.setItem("test-key", JSON.stringify("stored"))
    const { result } = renderHook(() =>
      useLocalStorage("test-key", "default")
    )

    act(() => {
      result.current[2]()
    })

    expect(result.current[0]).toBe("default")
    expect(window.localStorage.getItem("test-key")).toBeNull()
  })

  it("works with object values", () => {
    const { result } = renderHook(() =>
      useLocalStorage("obj-key", { name: "Alice" })
    )

    act(() => {
      result.current[1]({ name: "Bob" })
    })

    expect(result.current[0]).toEqual({ name: "Bob" })
  })

  it("handles JSON parse errors gracefully and returns initial value", () => {
    window.localStorage.setItem("bad-key", "not-valid-json{{{")
    const { result } = renderHook(() =>
      useLocalStorage("bad-key", "fallback")
    )
    expect(result.current[0]).toBe("fallback")
  })

  it("dispatches local-storage event on setValue", () => {
    const listener = vi.fn()
    window.addEventListener("local-storage", listener)

    const { result } = renderHook(() =>
      useLocalStorage("event-key", "initial")
    )

    act(() => {
      result.current[1]("new-value")
    })

    expect(listener).toHaveBeenCalled()
    window.removeEventListener("local-storage", listener)
  })
})
