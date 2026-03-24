import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../collapsible"
import { checkA11y } from "../../../../test-utils/a11y"

function BasicCollapsible({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger>Toggle section</CollapsibleTrigger>
      <CollapsibleContent>Hidden content</CollapsibleContent>
    </Collapsible>
  )
}

describe("Collapsible", () => {
  it("renders collapsible with trigger and content", () => {
    render(<BasicCollapsible />)
    expect(screen.getByText("Toggle section")).toBeInTheDocument()
  })

  it("Collapsible root has data-slot attribute", () => {
    render(
      <Collapsible data-testid="col-root">
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    expect(screen.getByTestId("col-root")).toHaveAttribute("data-slot", "collapsible")
  })

  it("CollapsibleTrigger has data-slot attribute", () => {
    render(<BasicCollapsible />)
    expect(screen.getByRole("button")).toHaveAttribute("data-slot", "collapsible-trigger")
  })

  it("CollapsibleContent has data-slot attribute", () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent data-testid="col-content">Content</CollapsibleContent>
      </Collapsible>
    )
    expect(screen.getByTestId("col-content")).toHaveAttribute("data-slot", "collapsible-content")
  })

  it("content is hidden by default", () => {
    render(<BasicCollapsible />)
    // Radix removes closed content from the DOM
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument()
  })

  it("expands content when trigger is clicked", async () => {
    const user = userEvent.setup()
    render(<BasicCollapsible />)

    await user.click(screen.getByRole("button"))
    expect(screen.getByText("Hidden content")).toBeInTheDocument()
  })

  it("collapses content when trigger is clicked again", async () => {
    const user = userEvent.setup()
    render(<BasicCollapsible defaultOpen />)

    expect(screen.getByText("Hidden content")).toBeInTheDocument()

    await user.click(screen.getByRole("button"))
    // Radix removes closed content from the DOM
    expect(screen.queryByText("Hidden content")).not.toBeInTheDocument()
  })

  it("accepts custom className on root", () => {
    render(
      <Collapsible className="custom-class" data-testid="col">
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    expect(screen.getByTestId("col")).toHaveClass("custom-class")
  })

  it("forwards ref to root element", () => {
    const ref = { current: null }
    render(
      <Collapsible ref={ref}>
        <CollapsibleTrigger>Toggle</CollapsibleTrigger>
        <CollapsibleContent>Content</CollapsibleContent>
      </Collapsible>
    )
    expect(ref.current).toBeInstanceOf(HTMLElement)
  })

  it("trigger indicates expanded state with aria-expanded", async () => {
    const user = userEvent.setup()
    render(<BasicCollapsible />)

    const trigger = screen.getByRole("button")
    expect(trigger).toHaveAttribute("aria-expanded", "false")

    await user.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })
})

describe("Collapsible accessibility", () => {
  it("has no WCAG 2.1 AA violations (collapsed)", async () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger>Show advanced options</CollapsibleTrigger>
        <CollapsibleContent>
          <p>These are the advanced options for configuration.</p>
        </CollapsibleContent>
      </Collapsible>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (expanded)", async () => {
    const { container } = render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Show advanced options</CollapsibleTrigger>
        <CollapsibleContent>
          <p>These are the advanced options for configuration.</p>
        </CollapsibleContent>
      </Collapsible>
    )
    await checkA11y(container)
  })
})
