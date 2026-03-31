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
    expect(screen.getByText("Center")).toHaveFocus()
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
