import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "../popover"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Popover", () => {
  it("renders trigger without crashing", () => {
    render(
      <Popover>
        <PopoverTrigger>Click me</PopoverTrigger>
        <PopoverContent>Popover text</PopoverContent>
      </Popover>
    )
    expect(screen.getByText("Click me")).toBeInTheDocument()
  })

  it("applies data-slot to trigger", () => {
    render(
      <Popover>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    )
    expect(screen.getByText("Trigger")).toHaveAttribute("data-slot", "popover-trigger")
  })

  it("renders content with data-slot when open", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Popover content</PopoverContent>
      </Popover>
    )
    const content = screen.getByText("Popover content")
    expect(content.closest("[data-slot='popover-content']")).toBeInTheDocument()
  })

  it("renders with custom className on content", () => {
    render(
      <Popover open={true}>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent className="custom-popover">Popover text</PopoverContent>
      </Popover>
    )
    const content = screen.getByText("Popover text").closest("[data-slot='popover-content']")
    expect(content).toHaveClass("custom-popover")
  })

  it("renders PopoverAnchor", () => {
    render(
      <Popover>
        <PopoverAnchor>
          <span>Anchor element</span>
        </PopoverAnchor>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    )
    expect(screen.getByText("Anchor element")).toBeInTheDocument()
  })

  it("PopoverAnchor applies data-slot", () => {
    render(
      <Popover>
        <PopoverAnchor data-testid="anchor">
          <span>Anchor</span>
        </PopoverAnchor>
        <PopoverTrigger>Trigger</PopoverTrigger>
        <PopoverContent>Content</PopoverContent>
      </Popover>
    )
    expect(screen.getByTestId("anchor")).toHaveAttribute("data-slot", "popover-anchor")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (closed state)", async () => {
    const { container } = render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Open popover</button>
        </PopoverTrigger>
        <PopoverContent>Popover information</PopoverContent>
      </Popover>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    const { container } = render(
      <Popover open={true}>
        <PopoverTrigger asChild>
          <button>Open popover</button>
        </PopoverTrigger>
        <PopoverContent>Popover information</PopoverContent>
      </Popover>
    )
    await checkA11y(container)
  })
})
