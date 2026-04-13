import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useRef } from "react"
import { useKeyboardNav } from "../use-keyboard-nav"

function fireKeydown(
  target: EventTarget,
  key: string,
  modifiers: Partial<{ metaKey: boolean }> = {}
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    metaKey: modifiers.metaKey ?? false,
  })
  target.dispatchEvent(event)
}

describe("useKeyboardNav", () => {
  it("navigates forward with ArrowDown", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(2)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, "ArrowDown")
    expect(goTo).toHaveBeenCalledWith(3)
  })

  it("navigates forward with Space", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(0)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, " ")
    expect(goTo).toHaveBeenCalledWith(1)
  })

  it("navigates backward with ArrowUp", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(3)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, "ArrowUp")
    expect(goTo).toHaveBeenCalledWith(2)
  })

  it("navigates to first section with Home", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(3)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, "Home")
    expect(goTo).toHaveBeenCalledWith(0)
  })

  it("navigates to last section with End", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(0)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, "End")
    expect(goTo).toHaveBeenCalledWith(4)
  })

  it("navigates to first section with Cmd+ArrowUp", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(3)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, "ArrowUp", { metaKey: true })
    expect(goTo).toHaveBeenCalledWith(0)
  })

  it("ignores Cmd+ArrowLeft (browser navigation)", () => {
    const goTo = vi.fn()

    renderHook(() => {
      const currentIndexRef = useRef(1)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(document, "ArrowLeft", { metaKey: true })
    expect(goTo).not.toHaveBeenCalled()
  })

  it("listens on a custom containerRef when provided", () => {
    const goTo = vi.fn()
    const container = document.createElement("div")
    document.body.appendChild(container)

    renderHook(() => {
      const containerRef = useRef<HTMLElement>(container)
      const currentIndexRef = useRef(0)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ containerRef, goTo, currentIndexRef, totalSectionsRef })
    })

    fireKeydown(container, "ArrowDown")
    expect(goTo).toHaveBeenCalledWith(1)

    document.body.removeChild(container)
  })

  it("removes keydown listener on unmount", () => {
    const goTo = vi.fn()

    const { unmount } = renderHook(() => {
      const currentIndexRef = useRef(0)
      const totalSectionsRef = useRef(5)
      useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
    })

    unmount()
    fireKeydown(document, "ArrowDown")
    expect(goTo).not.toHaveBeenCalled()
  })
})
