import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useRef } from "react"
import { useClickOutside } from "../use-click-outside"

function TestComponent({
  onClickOutside,
}: {
  onClickOutside: (e: MouseEvent | TouchEvent) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, onClickOutside)

  return (
    <div data-testid="outside">
      <div ref={ref} data-testid="inside">
        inside
      </div>
    </div>
  )
}

describe("useClickOutside", () => {
  it("does not call handler when clicking inside the element", () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)

    fireEvent.mouseDown(getByTestId("inside"))
    expect(handler).not.toHaveBeenCalled()
  })

  it("calls handler when clicking outside the element", () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)

    fireEvent.mouseDown(getByTestId("outside"))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("calls handler on touch start outside the element", () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)

    fireEvent.touchStart(getByTestId("outside"))
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it("does not call handler on touch start inside the element", () => {
    const handler = vi.fn()
    const { getByTestId } = render(<TestComponent onClickOutside={handler} />)

    fireEvent.touchStart(getByTestId("inside"))
    expect(handler).not.toHaveBeenCalled()
  })

  it("removes event listeners on unmount", () => {
    const handler = vi.fn()
    const addSpy = vi.spyOn(document, "addEventListener")
    const removeSpy = vi.spyOn(document, "removeEventListener")

    const { unmount } = render(<TestComponent onClickOutside={handler} />)
    unmount()

    // Verify remove was called for each event added
    const addCalls = addSpy.mock.calls.map(([event]) => event)
    const removeCalls = removeSpy.mock.calls.map(([event]) => event)

    for (const event of addCalls) {
      expect(removeCalls).toContain(event)
    }
  })
})
