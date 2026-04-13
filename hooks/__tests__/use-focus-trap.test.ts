import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useRef } from "react"
import { useFocusTrap } from "../use-focus-trap"

function createContainer() {
  const container = document.createElement("div")
  const btn1 = document.createElement("button")
  btn1.textContent = "Button 1"
  const btn2 = document.createElement("button")
  btn2.textContent = "Button 2"
  const btn3 = document.createElement("button")
  btn3.textContent = "Button 3"
  container.appendChild(btn1)
  container.appendChild(btn2)
  container.appendChild(btn3)
  document.body.appendChild(container)
  return { container, btn1, btn2, btn3 }
}

describe("useFocusTrap", () => {
  it("moves focus to the first focusable element when enabled", () => {
    const { container, btn1 } = createContainer()

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    expect(document.activeElement).toBe(btn1)

    document.body.removeChild(container)
  })

  it("does not move focus when disabled", () => {
    const { container } = createContainer()
    const initial = document.createElement("button")
    document.body.appendChild(initial)
    initial.focus()

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, false)
    })

    expect(document.activeElement).toBe(initial)

    document.body.removeChild(container)
    document.body.removeChild(initial)
  })

  it("wraps Tab forward from last element to first", () => {
    const { container, btn1, btn3 } = createContainer()

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    btn3.focus()
    expect(document.activeElement).toBe(btn3)

    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    })
    container.dispatchEvent(tabEvent)

    expect(document.activeElement).toBe(btn1)

    document.body.removeChild(container)
  })

  it("wraps Shift+Tab backward from first element to last", () => {
    const { container, btn1, btn3 } = createContainer()

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    btn1.focus()
    expect(document.activeElement).toBe(btn1)

    const shiftTabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    container.dispatchEvent(shiftTabEvent)

    expect(document.activeElement).toBe(btn3)

    document.body.removeChild(container)
  })

  it("does not intercept non-Tab keys", () => {
    const { container, btn1 } = createContainer()

    renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    btn1.focus()
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    })
    const prevented = !container.dispatchEvent(enterEvent)
    // Enter is not prevented by the focus trap
    expect(prevented).toBe(false)

    document.body.removeChild(container)
  })

  it("removes keydown listener on unmount", () => {
    const { container, btn1, btn3 } = createContainer()

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLElement>(container)
      useFocusTrap(ref, true)
    })

    unmount()

    btn3.focus()
    const tabEvent = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    })
    container.dispatchEvent(tabEvent)

    // After unmount, focus should not have been moved to btn1
    expect(document.activeElement).toBe(btn3)

    document.body.removeChild(container)
  })
})
