import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useKeyboardShortcut } from "../use-keyboard-shortcut"

function fireKeydown(
  target: EventTarget,
  key: string,
  modifiers: Partial<{
    metaKey: boolean
    ctrlKey: boolean
    shiftKey: boolean
    altKey: boolean
  }> = {}
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    metaKey: modifiers.metaKey ?? false,
    ctrlKey: modifiers.ctrlKey ?? false,
    shiftKey: modifiers.shiftKey ?? false,
    altKey: modifiers.altKey ?? false,
  })
  target.dispatchEvent(event)
  return event
}

describe("useKeyboardShortcut", () => {
  it("fires callback when the correct key is pressed", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("k", callback))

    fireKeydown(document, "k")
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("does not fire callback for a different key", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("k", callback))

    fireKeydown(document, "j")
    expect(callback).not.toHaveBeenCalled()
  })

  it("fires callback for case-insensitive key match", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("K", callback))

    fireKeydown(document, "k")
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("fires callback when Ctrl modifier matches", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("s", callback, { ctrl: true }))

    fireKeydown(document, "s", { ctrlKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("does not fire when Ctrl is required but not held", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("s", callback, { ctrl: true }))

    fireKeydown(document, "s")
    expect(callback).not.toHaveBeenCalled()
  })

  it("does not fire when Ctrl is held but not required", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("s", callback))

    fireKeydown(document, "s", { ctrlKey: true })
    expect(callback).not.toHaveBeenCalled()
  })

  it("fires callback when Meta modifier matches", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("k", callback, { meta: true }))

    fireKeydown(document, "k", { metaKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("fires callback when Shift modifier matches", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("K", callback, { shift: true }))

    fireKeydown(document, "K", { shiftKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("fires callback when Alt modifier matches", () => {
    const callback = vi.fn()
    renderHook(() => useKeyboardShortcut("a", callback, { alt: true }))

    fireKeydown(document, "a", { altKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("fires callback on a custom target element", () => {
    const callback = vi.fn()
    const div = document.createElement("div")
    document.body.appendChild(div)

    renderHook(() => useKeyboardShortcut("Enter", callback, { target: div }))

    fireKeydown(div, "Enter")
    expect(callback).toHaveBeenCalledTimes(1)

    document.body.removeChild(div)
  })

  it("does not fire on document when custom target is used", () => {
    const callback = vi.fn()
    const div = document.createElement("div")
    document.body.appendChild(div)

    renderHook(() => useKeyboardShortcut("Enter", callback, { target: div }))

    fireKeydown(document, "Enter")
    expect(callback).not.toHaveBeenCalled()

    document.body.removeChild(div)
  })

  it("removes event listener on unmount", () => {
    const callback = vi.fn()
    const { unmount } = renderHook(() => useKeyboardShortcut("k", callback))

    unmount()

    fireKeydown(document, "k")
    expect(callback).not.toHaveBeenCalled()
  })
})
