import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { usePrevious } from "../use-previous"

describe("usePrevious", () => {
  it("returns undefined on the first render", () => {
    const { result } = renderHook(() => usePrevious("initial"))
    expect(result.current).toBeUndefined()
  })

  it("returns the previous value after a re-render", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: "first" } }
    )

    rerender({ value: "second" })
    expect(result.current).toBe("first")
  })

  it("tracks each sequential value correctly", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: 1 } }
    )

    rerender({ value: 2 })
    expect(result.current).toBe(1)

    rerender({ value: 3 })
    expect(result.current).toBe(2)

    rerender({ value: 4 })
    expect(result.current).toBe(3)
  })

  it("works with boolean values", () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: false } }
    )

    rerender({ value: true })
    expect(result.current).toBe(false)
  })

  it("works with object values", () => {
    const objA = { x: 1 }
    const objB = { x: 2 }

    const { result, rerender } = renderHook(
      ({ value }) => usePrevious(value),
      { initialProps: { value: objA } }
    )

    rerender({ value: objB })
    expect(result.current).toBe(objA)
  })
})
