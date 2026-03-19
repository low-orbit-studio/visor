import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useBoolean } from "../use-boolean"

describe("useBoolean", () => {
  it("starts with false by default", () => {
    const { result } = renderHook(() => useBoolean())
    expect(result.current.value).toBe(false)
  })

  it("starts with the provided initial value", () => {
    const { result } = renderHook(() => useBoolean(true))
    expect(result.current.value).toBe(true)
  })

  it("setTrue sets value to true", () => {
    const { result } = renderHook(() => useBoolean(false))

    act(() => {
      result.current.setTrue()
    })

    expect(result.current.value).toBe(true)
  })

  it("setFalse sets value to false", () => {
    const { result } = renderHook(() => useBoolean(true))

    act(() => {
      result.current.setFalse()
    })

    expect(result.current.value).toBe(false)
  })

  it("toggle flips value from false to true", () => {
    const { result } = renderHook(() => useBoolean(false))

    act(() => {
      result.current.toggle()
    })

    expect(result.current.value).toBe(true)
  })

  it("toggle flips value from true to false", () => {
    const { result } = renderHook(() => useBoolean(true))

    act(() => {
      result.current.toggle()
    })

    expect(result.current.value).toBe(false)
  })

  it("setValue sets an explicit value", () => {
    const { result } = renderHook(() => useBoolean(false))

    act(() => {
      result.current.setValue(true)
    })

    expect(result.current.value).toBe(true)

    act(() => {
      result.current.setValue(false)
    })

    expect(result.current.value).toBe(false)
  })

  it("handlers are stable references across renders", () => {
    const { result, rerender } = renderHook(() => useBoolean())

    const { setTrue, setFalse, toggle } = result.current
    rerender()

    expect(result.current.setTrue).toBe(setTrue)
    expect(result.current.setFalse).toBe(setFalse)
    expect(result.current.toggle).toBe(toggle)
  })
})
