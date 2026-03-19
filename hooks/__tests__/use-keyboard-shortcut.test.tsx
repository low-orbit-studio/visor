import { render, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { useKeyboardShortcut } from "../use-keyboard-shortcut"

function TestComponent({
  shortcutKey,
  callback,
  options = {},
}: {
  shortcutKey: string
  callback: (e: KeyboardEvent) => void
  options?: Parameters<typeof useKeyboardShortcut>[2]
}) {
  useKeyboardShortcut(shortcutKey, callback, options)
  return <div />
}

describe("useKeyboardShortcut", () => {
  it("calls callback when matching key is pressed", () => {
    const callback = vi.fn()
    render(<TestComponent shortcutKey="k" callback={callback} />)

    fireEvent.keyDown(document, { key: "k" })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("does not call callback for a different key", () => {
    const callback = vi.fn()
    render(<TestComponent shortcutKey="k" callback={callback} />)

    fireEvent.keyDown(document, { key: "j" })
    expect(callback).not.toHaveBeenCalled()
  })

  it("is case-insensitive for the key", () => {
    const callback = vi.fn()
    render(<TestComponent shortcutKey="k" callback={callback} />)

    fireEvent.keyDown(document, { key: "K" })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("requires Meta key when meta=true", () => {
    const callback = vi.fn()
    render(
      <TestComponent
        shortcutKey="s"
        callback={callback}
        options={{ meta: true }}
      />
    )

    fireEvent.keyDown(document, { key: "s" })
    expect(callback).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: "s", metaKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("requires Ctrl key when ctrl=true", () => {
    const callback = vi.fn()
    render(
      <TestComponent
        shortcutKey="z"
        callback={callback}
        options={{ ctrl: true }}
      />
    )

    fireEvent.keyDown(document, { key: "z" })
    expect(callback).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: "z", ctrlKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("requires Shift key when shift=true", () => {
    const callback = vi.fn()
    render(
      <TestComponent
        shortcutKey="k"
        callback={callback}
        options={{ shift: true }}
      />
    )

    fireEvent.keyDown(document, { key: "k" })
    expect(callback).not.toHaveBeenCalled()

    fireEvent.keyDown(document, { key: "k", shiftKey: true })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it("prevents default when preventDefault=true", () => {
    const callback = vi.fn()
    render(
      <TestComponent
        shortcutKey="s"
        callback={callback}
        options={{ preventDefault: true }}
      />
    )

    const event = new KeyboardEvent("keydown", {
      key: "s",
      bubbles: true,
      cancelable: true,
    })
    const preventDefaultSpy = vi.spyOn(event, "preventDefault")
    document.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
