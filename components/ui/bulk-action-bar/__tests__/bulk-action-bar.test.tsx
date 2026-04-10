import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { BulkActionBar } from "../bulk-action-bar"
import { Button } from "../../button/button"

describe("BulkActionBar", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(
      <BulkActionBar count={0}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(
      container.querySelector('[data-slot="bulk-action-bar"]')
    ).toBeNull()
  })

  it("renders nothing when count is negative", () => {
    const { container } = render(
      <BulkActionBar count={-1}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(
      container.querySelector('[data-slot="bulk-action-bar"]')
    ).toBeNull()
  })

  it("renders the default count label and actions when count > 0", () => {
    render(
      <BulkActionBar count={3}>
        <Button>Delete</Button>
        <Button>Archive</Button>
      </BulkActionBar>
    )
    expect(screen.getByText("3 selected")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /archive/i })).toBeInTheDocument()
  })

  it("applies aria-live polite to the count", () => {
    const { container } = render(
      <BulkActionBar count={5}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    const node = container.querySelector('[data-slot="bulk-action-bar-count"]')
    expect(node).toHaveAttribute("aria-live", "polite")
    expect(node).toHaveAttribute("aria-atomic", "true")
  })

  it("uses a custom label function when provided", () => {
    render(
      <BulkActionBar count={7} label={(n) => `${n} items picked`}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(screen.getByText("7 items picked")).toBeInTheDocument()
  })

  it("fires onClear when the dismiss button is clicked", () => {
    const onClear = vi.fn()
    render(
      <BulkActionBar count={2} onClear={onClear}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    fireEvent.click(screen.getByRole("button", { name: /clear selection/i }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it("hides the dismiss button when dismissible is false", () => {
    const { container } = render(
      <BulkActionBar count={2} dismissible={false} onClear={() => {}}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(
      container.querySelector('[data-slot="bulk-action-bar-dismiss"]')
    ).toBeNull()
  })

  it("hides the dismiss button when onClear is not provided", () => {
    const { container } = render(
      <BulkActionBar count={2}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(
      container.querySelector('[data-slot="bulk-action-bar-dismiss"]')
    ).toBeNull()
  })

  it("fires onClear when Escape is pressed", () => {
    const onClear = vi.fn()
    render(
      <BulkActionBar count={2} onClear={onClear} autoFocus={false}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it("does not attach the Escape handler when onClear is omitted", () => {
    render(
      <BulkActionBar count={2} autoFocus={false}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    // No assertion beyond "does not throw" — ensures the optional branch
    // path is exercised without a consumer handler.
    expect(() =>
      fireEvent.keyDown(document, { key: "Escape" })
    ).not.toThrow()
  })

  it("auto-focuses the first enabled action button on mount", () => {
    render(
      <BulkActionBar count={1}>
        <Button>Delete</Button>
        <Button>Archive</Button>
      </BulkActionBar>
    )
    expect(screen.getByRole("button", { name: /delete/i })).toHaveFocus()
  })

  it("skips disabled buttons when auto-focusing", () => {
    render(
      <BulkActionBar count={1}>
        <Button disabled>Delete</Button>
        <Button>Archive</Button>
      </BulkActionBar>
    )
    expect(screen.getByRole("button", { name: /archive/i })).toHaveFocus()
  })

  it("does not auto-focus when autoFocus is false", () => {
    render(
      <BulkActionBar count={1} autoFocus={false}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(screen.getByRole("button", { name: /delete/i })).not.toHaveFocus()
  })

  it("applies the inline class and data attribute when inline is true", () => {
    const { container } = render(
      <BulkActionBar count={1} inline>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    const root = container.querySelector('[data-slot="bulk-action-bar"]')
    expect(root?.className).toMatch(/inline/)
    expect(root?.className).not.toMatch(/sticky/)
    expect(root).toHaveAttribute("data-inline", "true")
  })

  it("applies the sticky class by default", () => {
    const { container } = render(
      <BulkActionBar count={1}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    const root = container.querySelector('[data-slot="bulk-action-bar"]')
    expect(root?.className).toMatch(/sticky/)
    expect(root).not.toHaveAttribute("data-inline")
  })

  it("has role=toolbar with an accessible name", () => {
    render(
      <BulkActionBar count={1}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(
      screen.getByRole("toolbar", { name: /bulk actions/i })
    ).toBeInTheDocument()
  })

  it("passes through HTML attributes and className", () => {
    const { container } = render(
      <BulkActionBar
        count={1}
        id="bulk-bar-root"
        data-testid="bulk-bar"
        className="custom-class"
      >
        <Button>Delete</Button>
      </BulkActionBar>
    )
    const root = container.querySelector('[data-slot="bulk-action-bar"]')
    expect(root).toHaveAttribute("id", "bulk-bar-root")
    expect(root).toHaveAttribute("data-testid", "bulk-bar")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <BulkActionBar ref={ref} count={1}>
        <Button>Delete</Button>
      </BulkActionBar>
    )
    expect(ref.current).not.toBeNull()
    expect(ref.current?.getAttribute("data-slot")).toBe("bulk-action-bar")
  })
})
