import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { Button } from "../button"
import { TooltipProvider } from "../../tooltip/tooltip"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Button", () => {
  it("renders with default props", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it("renders with custom className", () => {
    render(<Button className="custom-class">Button</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
  })

  it("renders as disabled when disabled prop is set", () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("passes through HTML button attributes", () => {
    render(<Button type="submit">Submit</Button>)
    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("type", "submit")
  })

  it("renders children correctly", () => {
    render(
      <Button>
        <span>Icon</span>
        Label
      </Button>
    )
    expect(screen.getByText("Label")).toBeInTheDocument()
    expect(screen.getByText("Icon")).toBeInTheDocument()
  })
})

describe("Button — gated state", () => {
  // State 1: gated=true, no gatedReason
  it("emits data-gated and aria-disabled when gated=true", () => {
    render(<Button gated>Delete</Button>)
    const button = screen.getByRole("button", { name: /delete/i })
    expect(button).toHaveAttribute("data-gated", "true")
    expect(button).toHaveAttribute("aria-disabled", "true")
  })

  it("does NOT emit native disabled attribute when gated=true", () => {
    render(<Button gated>Delete</Button>)
    const button = screen.getByRole("button", { name: /delete/i })
    expect(button).not.toBeDisabled()
  })

  it("suppresses click handler when gated=true", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button gated onClick={onClick}>Delete</Button>)
    await user.click(screen.getByRole("button", { name: /delete/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  it("does not render tooltip when gated=true but gatedReason is absent", () => {
    render(<TooltipProvider><Button gated>Delete</Button></TooltipProvider>)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  // State 2: gated=true, gatedReason present
  it("emits data-gated-reason attribute when both gated and gatedReason are set", () => {
    render(
      <TooltipProvider>
        <Button gated gatedReason="You are not an owner">Delete</Button>
      </TooltipProvider>
    )
    const button = screen.getByRole("button", { name: /delete/i })
    expect(button).toHaveAttribute("data-gated-reason", "You are not an owner")
  })

  it("renders TooltipContent with reason text when gated and gatedReason are both set", async () => {
    const user = userEvent.setup()
    render(
      <TooltipProvider>
        <Button gated gatedReason="You are not an owner">Delete</Button>
      </TooltipProvider>
    )
    await user.hover(screen.getByRole("button", { name: /delete/i }))
    // Radix tooltip renders the reason text in the visible content div
    const tooltipEls = await screen.findAllByText("You are not an owner")
    expect(tooltipEls.length).toBeGreaterThanOrEqual(1)
  })

  // State 3: gated=false (default) — existing behavior preserved
  it("fires click handler when not gated", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    await user.click(screen.getByRole("button", { name: /save/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("does not emit data-gated or aria-disabled when gated is absent", () => {
    render(<Button>Save</Button>)
    const button = screen.getByRole("button", { name: /save/i })
    expect(button).not.toHaveAttribute("data-gated")
    expect(button).not.toHaveAttribute("aria-disabled")
  })

  // State 4: gatedReason without gated — gatedReason is a no-op
  it("does not emit data-gated or data-gated-reason when gated is absent even with gatedReason", () => {
    render(<TooltipProvider><Button gatedReason="Some reason">Save</Button></TooltipProvider>)
    const button = screen.getByRole("button", { name: /save/i })
    expect(button).not.toHaveAttribute("data-gated")
    expect(button).not.toHaveAttribute("data-gated-reason")
    expect(button).not.toHaveAttribute("aria-disabled")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(<Button>Click me</Button>)
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (disabled)", async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    await checkA11y(container)
  })
})
