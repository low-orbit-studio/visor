import { render, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useRef } from "react"
import { useKeyboardNav } from "../use-keyboard-nav"

function TestComponent({ goTo }: { goTo: (index: number) => void }) {
  const currentIndexRef = useRef(2)
  const totalSectionsRef = useRef(5)
  useKeyboardNav({ goTo, currentIndexRef, totalSectionsRef })
  return <div />
}

describe("useKeyboardNav", () => {
  let goTo: ReturnType<typeof vi.fn>

  beforeEach(() => {
    goTo = vi.fn()
    render(<TestComponent goTo={goTo} />)
  })

  it("navigates forward on ArrowDown", () => {
    fireEvent.keyDown(document, { key: "ArrowDown" })
    expect(goTo).toHaveBeenCalledWith(3)
  })

  it("navigates backward on ArrowUp", () => {
    fireEvent.keyDown(document, { key: "ArrowUp" })
    expect(goTo).toHaveBeenCalledWith(1)
  })

  it("navigates forward on Space", () => {
    fireEvent.keyDown(document, { key: " " })
    expect(goTo).toHaveBeenCalledWith(3)
  })

  it("navigates to first on Home", () => {
    fireEvent.keyDown(document, { key: "Home" })
    expect(goTo).toHaveBeenCalledWith(0)
  })

  it("navigates to last on End", () => {
    fireEvent.keyDown(document, { key: "End" })
    expect(goTo).toHaveBeenCalledWith(4)
  })

  it("ignores Cmd+ArrowLeft/Right", () => {
    fireEvent.keyDown(document, { key: "ArrowLeft", metaKey: true })
    fireEvent.keyDown(document, { key: "ArrowRight", metaKey: true })
    expect(goTo).not.toHaveBeenCalled()
  })
})
