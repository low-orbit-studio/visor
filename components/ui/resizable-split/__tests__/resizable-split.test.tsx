import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ResizableSplit, type ResizableSplitProps } from "../resizable-split"

// happy-dom lays nothing out: the root is 808px wide and the divider 8px, so the panes share 800px.
const WIDTHS: Record<string, number> = { "resizable-split": 808, "resizable-split-divider": 8 }

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const width = WIDTHS[this.dataset.slot ?? ""] ?? 0
    return { width, height: 0, top: 0, left: 0, right: width, bottom: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
  })
})
afterEach(() => vi.restoreAllMocks())

function setup(over: Partial<ResizableSplitProps> = {}) {
  const onSizeChange = vi.fn()
  const utils = render(
    <ResizableSplit defaultSize={400} minStart={200} minEnd={300} onSizeChange={onSizeChange} {...over}>
      <div>Editor</div>
      <div>Preview</div>
    </ResizableSplit>
  )
  const divider = screen.getByRole("separator")
  const start = utils.container.querySelector<HTMLElement>('[data-slot="resizable-split-start"]')!
  return { ...utils, divider, start, onSizeChange }
}

describe("ResizableSplit", () => {
  it("renders both panes and a focusable vertical separator with its range", () => {
    const { divider } = setup()
    expect(screen.getByText("Editor")).toBeInTheDocument()
    expect(screen.getByText("Preview")).toBeInTheDocument()
    expect(divider).toHaveAttribute("tabindex", "0")
    expect(divider).toHaveAttribute("aria-orientation", "vertical")
    expect(divider).toHaveAccessibleName("Resize panes")
    expect(divider).toHaveAttribute("aria-valuenow", "400")
    expect(divider).toHaveAttribute("aria-valuemin", "200")
    expect(divider).toHaveAttribute("aria-valuemax", "500")
  })

  it("steps by `step` on arrows and four steps with Shift", () => {
    const { divider, start, onSizeChange } = setup({ step: 10 })
    fireEvent.keyDown(divider, { key: "ArrowRight" })
    expect(onSizeChange).toHaveBeenLastCalledWith(410)
    expect(divider).toHaveAttribute("aria-valuenow", "410")
    expect(start.style.flex).toBe("0 1 410px")
    fireEvent.keyDown(divider, { key: "ArrowLeft", shiftKey: true })
    expect(onSizeChange).toHaveBeenLastCalledWith(370)
    fireEvent.keyDown(divider, { key: "Enter" })
    expect(onSizeChange).toHaveBeenCalledTimes(2)
  })

  it("stops at the start pane's minimum", () => {
    const { divider, onSizeChange } = setup({ defaultSize: 210, step: 16 })
    fireEvent.keyDown(divider, { key: "ArrowLeft" })
    expect(onSizeChange).toHaveBeenLastCalledWith(200)
    fireEvent.keyDown(divider, { key: "End" })
    fireEvent.keyDown(divider, { key: "Home" })
    expect(onSizeChange).toHaveBeenLastCalledWith(200)
  })

  it("stops where the end pane would go below its minimum", () => {
    const { divider, onSizeChange } = setup({ defaultSize: 490, step: 16 })
    fireEvent.keyDown(divider, { key: "ArrowRight" })
    expect(onSizeChange).toHaveBeenLastCalledWith(500)
    fireEvent.keyDown(divider, { key: "End" })
    expect(onSizeChange).toHaveBeenLastCalledWith(500)
  })

  it("follows a pointer drag and clamps it to both minimums", () => {
    const { divider, container, onSizeChange } = setup()
    const root = container.querySelector('[data-slot="resizable-split"]')!
    fireEvent.pointerDown(divider, { button: 0, pointerId: 1, clientX: 400 })
    expect(root).toHaveAttribute("data-dragging")
    expect(divider).toHaveFocus()
    fireEvent.pointerMove(divider, { pointerId: 1, clientX: 450 })
    expect(onSizeChange).toHaveBeenLastCalledWith(450)
    fireEvent.pointerMove(divider, { pointerId: 1, clientX: 900 })
    expect(onSizeChange).toHaveBeenLastCalledWith(500)
    fireEvent.pointerMove(divider, { pointerId: 1, clientX: 0 })
    expect(onSizeChange).toHaveBeenLastCalledWith(200)
    fireEvent.pointerUp(divider, { pointerId: 1, clientX: 0 })
    expect(root).not.toHaveAttribute("data-dragging")
    onSizeChange.mockClear()
    fireEvent.pointerMove(divider, { pointerId: 1, clientX: 300 })
    expect(onSizeChange).not.toHaveBeenCalled()
  })

  it("ignores a drag with any button but the main one", () => {
    const { divider, onSizeChange } = setup()
    fireEvent.pointerDown(divider, { button: 2, pointerId: 1, clientX: 400 })
    fireEvent.pointerMove(divider, { pointerId: 1, clientX: 450 })
    expect(onSizeChange).not.toHaveBeenCalled()
  })

  it("is controlled by `size`: it reports the new width and draws the one it is given", () => {
    const { divider, start, onSizeChange, rerender } = setup({ size: 300, defaultSize: undefined })
    fireEvent.keyDown(divider, { key: "ArrowRight" })
    expect(onSizeChange).toHaveBeenLastCalledWith(316)
    expect(start.style.flex).toBe("0 1 300px")
    rerender(
      <ResizableSplit size={316} minStart={200} minEnd={300} onSizeChange={onSizeChange}>
        <div>Editor</div>
        <div>Preview</div>
      </ResizableSplit>
    )
    expect(start.style.flex).toBe("0 1 316px")
    expect(screen.getByRole("separator")).toHaveAttribute("aria-valuenow", "316")
  })

  it("starts with equal panes without a size", () => {
    const { divider, start } = setup({ defaultSize: undefined })
    expect(start.style.flex).toBe("1 1 0%")
    expect(divider).toHaveAttribute("aria-valuenow", "400")
  })
})
