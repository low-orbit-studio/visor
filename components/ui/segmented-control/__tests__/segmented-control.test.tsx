import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { SegmentedControl } from "../segmented-control"
import { checkA11y } from "../../../../test-utils/a11y"

const OPTIONS = [
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "any", label: "Any" },
]

function renderControl(props?: Partial<React.ComponentProps<typeof SegmentedControl>>) {
  return render(
    <SegmentedControl aria-label="Payment status" options={OPTIONS} {...props} />,
  )
}

describe("SegmentedControl", () => {
  it("renders one radio per option inside a labelled group", () => {
    renderControl()
    expect(screen.getByRole("group", { name: "Payment status" })).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(3)
  })

  it("is single-select: exactly one segment is on", async () => {
    const user = userEvent.setup()
    renderControl({ defaultValue: "unpaid" })
    expect(screen.getByRole("radio", { name: "Unpaid" })).toBeChecked()
    await user.click(screen.getByRole("radio", { name: "Paid" }))
    expect(screen.getByRole("radio", { name: "Paid" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Unpaid" })).not.toBeChecked()
    expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1)
  })

  it("starts on the first enabled option when given no value", () => {
    renderControl({
      options: [{ value: "a", label: "A", disabled: true }, ...OPTIONS],
    })
    expect(screen.getByRole("radio", { name: "Unpaid" })).toBeChecked()
  })

  it("calls onValueChange with the new value", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderControl({ defaultValue: "unpaid", onValueChange })
    await user.click(screen.getByRole("radio", { name: "Any" }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith("any")
  })

  it("follows `value` when controlled, and only the parent moves it", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    const { rerender } = renderControl({ value: "unpaid", onValueChange })
    await user.click(screen.getByRole("radio", { name: "Paid" }))
    expect(onValueChange).toHaveBeenCalledWith("paid")
    expect(screen.getByRole("radio", { name: "Unpaid" })).toBeChecked()
    rerender(<SegmentedControl aria-label="Payment status" options={OPTIONS} value="paid" onValueChange={onValueChange} />)
    expect(screen.getByRole("radio", { name: "Paid" })).toBeChecked()
  })

  describe("one option is always on", () => {
    it("uncontrolled: clicking the active segment keeps it and reports nothing", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      renderControl({ defaultValue: "paid", onValueChange })
      await user.click(screen.getByRole("radio", { name: "Paid" }))
      expect(screen.getByRole("radio", { name: "Paid" })).toBeChecked()
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it("controlled: clicking the active segment keeps it and reports nothing", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      renderControl({ value: "paid", onValueChange })
      await user.click(screen.getByRole("radio", { name: "Paid" }))
      expect(screen.getByRole("radio", { name: "Paid" })).toBeChecked()
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it("never reports an empty string across a run of clicks and keys", async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      renderControl({ defaultValue: "unpaid", onValueChange })
      const unpaid = screen.getByRole("radio", { name: "Unpaid" })
      await user.click(unpaid)
      await user.click(unpaid)
      await user.click(screen.getByRole("radio", { name: "Paid" }))
      await user.click(screen.getByRole("radio", { name: "Paid" }))
      await user.keyboard(" ")
      for (const call of onValueChange.mock.calls) expect(call[0]).not.toBe("")
      expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1)
    })
  })

  it("does not select a disabled option", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderControl({
      defaultValue: "unpaid",
      onValueChange,
      options: [OPTIONS[0], OPTIONS[1], { value: "any", label: "Any", disabled: true }],
    })
    expect(screen.getByRole("radio", { name: "Any" })).toBeDisabled()
    await user.click(screen.getByRole("radio", { name: "Any" }))
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("disables every segment with `disabled`", () => {
    renderControl({ disabled: true })
    for (const r of screen.getAllByRole("radio")) expect(r).toBeDisabled()
  })

  it("moves between segments with the arrow keys", async () => {
    const user = userEvent.setup()
    renderControl({ defaultValue: "unpaid" })
    await user.tab()
    expect(screen.getByRole("radio", { name: "Unpaid" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Paid" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Any" })).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("radio", { name: "Paid" })).toHaveFocus()
  })

  it("renders an option icon", () => {
    renderControl({
      options: [{ value: "a", label: "A", icon: <svg data-testid="icon" /> }, OPTIONS[1]],
    })
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })

  it("composes ToggleGroup's sliding indicator", () => {
    const { container } = renderControl()
    const root = container.querySelector('[data-slot="segmented-control"]') as HTMLElement
    expect(root).toHaveAttribute("data-variant", "outline")
    expect(root).toHaveAttribute("data-type", "single")
    expect(root.querySelector(':scope > [aria-hidden="true"]')).not.toBeNull()
  })

  it("wraps bare label text for optical centring (inherited from ToggleGroup)", () => {
    const { container } = renderControl()
    expect(container.querySelectorAll('[data-slot="toggle-group-text"]')).toHaveLength(3)
  })

  describe("fullWidth", () => {
    it("is off by default", () => {
      const { container } = renderControl()
      const root = container.querySelector('[data-slot="segmented-control"]') as HTMLElement
      expect(root).not.toHaveAttribute("data-full-width")
      expect(root.className).not.toMatch(/fullWidth/)
    })

    it("marks the root and applies the equal-width class", () => {
      const { container } = renderControl({ fullWidth: true })
      const root = container.querySelector('[data-slot="segmented-control"]') as HTMLElement
      expect(root).toHaveAttribute("data-full-width", "true")
      expect(root.className).toMatch(/fullWidth/)
    })

    it("the stylesheet gives every segment an equal flex basis", () => {
      const css = readFileSync(join(__dirname, "..", "segmented-control.module.css"), "utf-8")
      const rule = css.match(/\.root\.fullWidth > \[data-slot="toggle-group-item"\] \{([^}]*)\}/)?.[1] ?? ""
      expect(rule).toMatch(/flex:\s*1 1 0/)
      expect(rule).toMatch(/min-width:\s*0/)
      expect(css).toMatch(/\.root\.fullWidth \{[^}]*display:\s*flex[^}]*width:\s*100%/)
    })
  })

  it("forwards ref and className", () => {
    const ref = React.createRef<HTMLDivElement>()
    const { container } = renderControl({ ref, className: "custom" })
    expect(ref.current).toBe(container.querySelector('[data-slot="segmented-control"]'))
    expect(ref.current).toHaveClass("custom")
  })

  describe("styles", () => {
    const css = readFileSync(join(__dirname, "..", "segmented-control.module.css"), "utf-8")

    it("snaps the indicator under prefers-reduced-motion", () => {
      const block = css.match(/@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/)?.[1] ?? ""
      expect(block).toMatch(/\[aria-hidden="true"\]/)
      expect(block).toMatch(/transition:\s*none/)
    })

    it("draws its resting edge from --control-edge-* tokens and no visible border", () => {
      expect(css).toMatch(/border:\s*1px solid transparent/)
      expect(css).toMatch(/outline:\s*var\(--control-edge-width, 1px\) var\(--control-edge-style, solid\) var\(--control-edge-color/)
      expect(css).not.toMatch(/border(-\w+)?:\s*[^;]*var\(--border-default/)
    })

    it("seats the pill in a well that is the page nudged toward the ink, on a token", () => {
      expect(css).toContain(
        "var(--segmented-control-track-bg, color-mix(in srgb, var(--text-primary, #111827) 12%, var(--surface-page, #ffffff)))",
      )
      // --surface-subtle is the page itself in dark themes, so it must not be the default well.
      expect(css).not.toMatch(/segmented-control-track-bg[^;]*surface-subtle/)
    })

    it("sets label weight to medium, never light", () => {
      expect(css).toMatch(/font-weight:\s*var\(--font-weight-medium, 500\)/)
    })

    it("reads its indicator fill from a component token that defaults to ToggleGroup's", () => {
      expect(css).toContain(
        "var(--segmented-control-indicator-bg, var(--interactive-primary-bg, var(--primary, #111827)))",
      )
    })
  })

  describe("accessibility", () => {
    it("has no violations (default)", async () => {
      const { container } = renderControl({ defaultValue: "unpaid" })
      await checkA11y(container)
    })

    it("has no violations (fullWidth, disabled option, icons)", async () => {
      const { container } = renderControl({
        fullWidth: true,
        defaultValue: "paid",
        options: [
          { value: "unpaid", label: "Unpaid", icon: <svg aria-hidden="true" /> },
          OPTIONS[1],
          { value: "any", label: "Any", disabled: true },
        ],
      })
      await checkA11y(container)
    })

    it("has no violations (every size)", async () => {
      for (const size of ["xs", "sm", "md", "lg"] as const) {
        const { container, unmount } = renderControl({ size })
        await checkA11y(container)
        unmount()
      }
    })
  })
})
