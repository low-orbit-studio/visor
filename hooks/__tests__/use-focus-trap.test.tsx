import { render, fireEvent } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useRef } from "react"
import { useFocusTrap } from "../use-focus-trap"

function TestComponent({
  enabled = true,
  onTabPress,
}: {
  enabled?: boolean
  onTabPress?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, enabled)

  return (
    <div ref={ref} data-testid="container">
      <button data-testid="btn-1">First</button>
      <button data-testid="btn-2">Second</button>
      <button data-testid="btn-3">Third</button>
      {onTabPress && (
        <button onClick={onTabPress} data-testid="trigger">
          Trigger
        </button>
      )}
    </div>
  )
}

describe("useFocusTrap", () => {
  it("moves focus to the first focusable element on mount", () => {
    const { getByTestId } = render(<TestComponent />)
    expect(document.activeElement).toBe(getByTestId("btn-1"))
  })

  it("does not move focus when enabled=false", () => {
    const { getByTestId } = render(<TestComponent enabled={false} />)
    // Focus should not have moved to btn-1
    expect(document.activeElement).not.toBe(getByTestId("btn-1"))
  })

  it("wraps Tab from last element to first", () => {
    const { getByTestId } = render(<TestComponent />)

    const lastButton = getByTestId("btn-3")
    lastButton.focus()
    expect(document.activeElement).toBe(lastButton)

    fireEvent.keyDown(getByTestId("container"), { key: "Tab" })
    expect(document.activeElement).toBe(getByTestId("btn-1"))
  })

  it("wraps Shift+Tab from first element to last", () => {
    const { getByTestId } = render(<TestComponent />)

    const firstButton = getByTestId("btn-1")
    firstButton.focus()

    fireEvent.keyDown(getByTestId("container"), {
      key: "Tab",
      shiftKey: true,
    })
    expect(document.activeElement).toBe(getByTestId("btn-3"))
  })

  it("does not intercept non-Tab keys", () => {
    const { getByTestId } = render(<TestComponent />)
    const firstButton = getByTestId("btn-1")
    firstButton.focus()

    // Press Enter — focus should not change
    fireEvent.keyDown(getByTestId("container"), { key: "Enter" })
    expect(document.activeElement).toBe(firstButton)
  })
})
