import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { ToggleGroup, ToggleGroupItem } from "../toggle-group"
import { checkA11y } from "../../../../test-utils/a11y"

function renderToggleGroup(
  groupProps?: Record<string, unknown>,
  type: "single" | "multiple" = "single"
) {
  return render(
    <ToggleGroup type={type} aria-label="Text alignment" {...groupProps}>
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  )
}

describe("ToggleGroup", () => {
  it("renders with default props (single)", () => {
    renderToggleGroup()
    // In single mode, Radix ToggleGroup renders items with role="radio"
    const buttons = screen.getAllByRole("radio")
    expect(buttons).toHaveLength(3)
  })

  it("renders with custom className", () => {
    const { container } = renderToggleGroup({ className: "custom-class" })
    const group = container.querySelector('[data-slot="toggle-group"]')
    expect(group).toHaveClass("custom-class")
  })

  it("renders in multiple mode", () => {
    renderToggleGroup({}, "multiple")
    // In multiple mode, Radix ToggleGroup renders items with aria-pressed (button role)
    const buttons = screen.getAllByRole("button")
    expect(buttons).toHaveLength(3)
  })

  it("selects an item on click (single)", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderToggleGroup({ onValueChange: handleChange })
    await user.click(screen.getByText("Center"))
    expect(handleChange).toHaveBeenCalledWith("center")
  })

  it("can select multiple items in multiple mode", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderToggleGroup({ onValueChange: handleChange }, "multiple")
    await user.click(screen.getByText("Left"))
    await user.click(screen.getByText("Right"))
    expect(handleChange).toHaveBeenCalledTimes(2)
  })

  it("forwards ref on ToggleGroup", () => {
    const ref = { current: null }
    render(
      <ToggleGroup type="single" ref={ref}>
        <ToggleGroupItem value="a">A</ToggleGroupItem>
      </ToggleGroup>
    )
    expect(ref.current).not.toBeNull()
  })

  it("forwards ref on ToggleGroupItem", () => {
    const ref = { current: null }
    render(
      <ToggleGroup type="single">
        <ToggleGroupItem value="a" ref={ref}>A</ToggleGroupItem>
      </ToggleGroup>
    )
    expect(ref.current).not.toBeNull()
  })

  it("renders with outline variant", () => {
    const { container } = renderToggleGroup({ variant: "outline" })
    const group = container.querySelector('[data-slot="toggle-group"]')
    expect(group).toHaveAttribute("data-variant", "outline")
  })

  it("renders with sm size", () => {
    const { container } = renderToggleGroup({ size: "sm" })
    const group = container.querySelector('[data-slot="toggle-group"]')
    expect(group).toHaveAttribute("data-size", "sm")
  })

  it("renders disabled items", () => {
    render(
      <ToggleGroup type="single" aria-label="Options">
        <ToggleGroupItem value="a" disabled>A</ToggleGroupItem>
      </ToggleGroup>
    )
    // Single mode renders radio role
    const button = screen.getByRole("radio", { name: "A" })
    expect(button).toBeDisabled()
  })
})

describe("ToggleGroup keyboard navigation", () => {
  it("navigates items with arrow keys", async () => {
    const user = userEvent.setup()
    renderToggleGroup({ defaultValue: "left" })
    await user.click(screen.getByText("Left"))
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Center" })).toHaveFocus()
  })
})

describe("ToggleGroup roles (VI-690)", () => {
  it("single-select is a radiogroup of radios", () => {
    renderToggleGroup({ defaultValue: "left" })
    const group = screen.getByRole("radiogroup", { name: "Text alignment" })
    expect(group).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: "Left" })).toHaveAttribute("aria-checked", "true")
  })

  it("multi-select stays a group of pressed buttons", () => {
    renderToggleGroup({ defaultValue: ["left"] }, "multiple")
    expect(screen.getByRole("group", { name: "Text alignment" })).toBeInTheDocument()
    expect(screen.queryByRole("radiogroup")).toBeNull()
    expect(screen.getByRole("button", { name: "Left" })).toHaveAttribute("aria-pressed", "true")
  })
})

describe("ToggleGroup focus ring (VI-690)", () => {
  const css = readFileSync(join(process.cwd(), "components/ui/toggle-group/toggle-group.module.css"), "utf-8")
  const rule = css.match(/\.item:focus-visible \{([^}]*)\}/)?.[1] ?? ""

  it("draws a solid --border-focus outline at the focus ring width, not only a translucent shadow", () => {
    expect(rule).toMatch(/outline:\s*var\(--focus-ring-width[^)]*\)\s+solid\s+var\(--border-focus/)
    expect(rule).toMatch(/outline-offset:\s*var\(--focus-ring-offset/)
  })

  it("does not suppress the outline on the item", () => {
    expect(css.match(/\.item \{([^}]*)\}/)?.[1] ?? "").not.toMatch(/outline:\s*none/)
  })
})

describe("ToggleGroup accessibility", () => {
  it("has no WCAG 2.1 AA violations (single, empty)", async () => {
    const { container } = renderToggleGroup()
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (single, with selection)", async () => {
    const { container } = renderToggleGroup({ defaultValue: "left" })
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (multiple)", async () => {
    const { container } = renderToggleGroup({ defaultValue: ["left", "right"] }, "multiple")
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (outline variant)", async () => {
    const { container } = renderToggleGroup({ variant: "outline" })
    await checkA11y(container)
  })
})

describe("ToggleGroup option variant (VI-787)", () => {
  function renderOptions(groupProps?: Record<string, unknown>, type: "single" | "multiple" = "single") {
    return render(
      <ToggleGroup type={type} variant="option" aria-label="Shirt size" {...groupProps}>
        <ToggleGroupItem value="s">Small</ToggleGroupItem>
        <ToggleGroupItem value="m">Medium</ToggleGroupItem>
        <ToggleGroupItem value="l" disabled>Large</ToggleGroupItem>
        <ToggleGroupItem value="xl">Extra Large</ToggleGroupItem>
      </ToggleGroup>
    )
  }

  it("single: rows are radios named by their label alone, each with a hidden key and no check", () => {
    const { container } = renderOptions({ defaultValue: "m" })
    expect(screen.getByRole("radiogroup", { name: "Shirt size" })).toHaveAttribute("data-variant", "option")
    const medium = screen.getByRole("radio", { name: "Medium" })
    expect(medium).toHaveAttribute("aria-checked", "true")
    expect(medium.querySelector('[data-slot="toggle-group-key"]')).toHaveAttribute("aria-hidden", "true")
    expect(container.querySelector('[data-slot="toggle-group-check"]')).toBeNull()
  })

  it("single: tapping a row picks it and keeps ToggleGroup's semantics", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderOptions({ onValueChange: handleChange })
    await user.click(screen.getByText("Small"))
    expect(handleChange).toHaveBeenLastCalledWith("s")
    expect(screen.getByRole("radio", { name: "Small" })).toHaveAttribute("data-state", "on")
  })

  it("multiple: rows are pressed buttons with a hidden check, and several can be picked", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderOptions({ onValueChange: handleChange }, "multiple")
    expect(screen.getAllByRole("button")[0].querySelector('[data-slot="toggle-group-check"]')).toHaveAttribute("aria-hidden", "true")
    await user.click(screen.getByText("Small"))
    await user.click(screen.getByText("Extra Large"))
    expect(handleChange).toHaveBeenLastCalledWith(["s", "xl"])
    expect(screen.getByRole("button", { name: "Extra Large" })).toHaveAttribute("aria-pressed", "true")
  })

  it("arrow keys move focus and Space picks, as in the other variants", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderOptions({ onValueChange: handleChange })
    await user.tab()
    expect(screen.getByRole("radio", { name: "Small" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("radio", { name: "Medium" })).toHaveFocus()
    await user.keyboard(" ")
    expect(handleChange).toHaveBeenLastCalledWith("m")
    await user.keyboard("{ArrowDown}{Enter}")
    expect(handleChange).toHaveBeenLastCalledWith("xl")
  })

  it("shortcuts: a letter picks the item at that position and focuses it; a disabled one is skipped", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderOptions({ shortcuts: true, onValueChange: handleChange }, "multiple")
    await user.tab()
    await user.keyboard("d")
    expect(handleChange).toHaveBeenLastCalledWith(["xl"])
    expect(screen.getByRole("button", { name: "Extra Large" })).toHaveFocus()
    await user.keyboard("c")
    expect(handleChange).toHaveBeenCalledTimes(1)
    await user.keyboard("{Control>}a{/Control}")
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it("letters do nothing without the shortcuts prop, and a caller's onKeyDown still runs with it", async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    const handleKeyDown = vi.fn()
    const { unmount } = renderOptions({ onValueChange: handleChange })
    await user.tab()
    await user.keyboard("a")
    expect(handleChange).not.toHaveBeenCalled()
    unmount()
    renderOptions({ shortcuts: true, onKeyDown: handleKeyDown, onValueChange: handleChange })
    await user.tab()
    await user.keyboard("b")
    expect(handleKeyDown).toHaveBeenCalled()
    expect(handleChange).toHaveBeenLastCalledWith("m")
  })

  it("columns={2} marks the group for the two-column grid; other variants never get it", () => {
    const { container, unmount } = renderOptions({ columns: 2 })
    expect(container.querySelector('[data-slot="toggle-group"]')).toHaveAttribute("data-columns", "2")
    unmount()
    const outline = renderToggleGroup({ variant: "outline", columns: 2 })
    expect(outline.container.querySelector('[data-slot="toggle-group"]')).not.toHaveAttribute("data-columns")
  })

  it("leaves the existing variants' markup as it was (no size class dropped, no option parts)", () => {
    const { container } = renderToggleGroup({ defaultValue: "left" })
    expect(container.querySelector('[data-slot="toggle-group-key"]')).toBeNull()
    expect(container.querySelector('[data-slot="toggle-group-text"]')?.textContent).toBe("Left")
    expect(container.querySelector('[data-slot="toggle-group"]')).not.toHaveAttribute("data-columns")
  })

  it("has no WCAG 2.1 AA violations (option, single and multiple)", async () => {
    const single = renderOptions({ defaultValue: "m" })
    await checkA11y(single.container)
    single.unmount()
    const multiple = renderOptions({ defaultValue: ["s", "xl"] }, "multiple")
    await checkA11y(multiple.container)
  })
})
