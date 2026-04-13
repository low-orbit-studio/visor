import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useRef } from "react"
import { useClickOutside } from "../use-click-outside"

describe("useClickOutside", () => {
  it("calls handler when clicking outside the ref element", () => {
    const handler = vi.fn()
    const outer = document.createElement("div")
    const inner = document.createElement("button")
    document.body.appendChild(outer)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(inner)
      useClickOutside(ref, handler)
    })

    const event = new MouseEvent("mousedown", { bubbles: true })
    outer.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)

    unmount()
    document.body.removeChild(outer)
  })

  it("does not call handler when clicking inside the ref element", () => {
    const handler = vi.fn()
    const container = document.createElement("div")
    const button = document.createElement("button")
    container.appendChild(button)
    document.body.appendChild(container)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useClickOutside(ref, handler)
    })

    const event = new MouseEvent("mousedown", { bubbles: true })
    button.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()

    unmount()
    document.body.removeChild(container)
  })

  it("does not call handler when clicking on the ref element itself", () => {
    const handler = vi.fn()
    const container = document.createElement("div")
    document.body.appendChild(container)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useClickOutside(ref, handler)
    })

    const event = new MouseEvent("mousedown", { bubbles: true })
    container.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()

    unmount()
    document.body.removeChild(container)
  })

  it("calls handler on touchstart events outside the ref element", () => {
    const handler = vi.fn()
    const outer = document.createElement("div")
    const inner = document.createElement("span")
    document.body.appendChild(outer)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(inner)
      useClickOutside(ref, handler)
    })

    const event = new TouchEvent("touchstart", { bubbles: true })
    outer.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)

    unmount()
    document.body.removeChild(outer)
  })

  it("removes event listeners on unmount", () => {
    const handler = vi.fn()
    const outer = document.createElement("div")
    const inner = document.createElement("button")
    document.body.appendChild(outer)

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(inner)
      useClickOutside(ref, handler)
    })

    unmount()

    const event = new MouseEvent("mousedown", { bubbles: true })
    outer.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()

    document.body.removeChild(outer)
  })
})
