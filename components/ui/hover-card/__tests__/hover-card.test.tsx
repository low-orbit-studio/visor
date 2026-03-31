import { render, screen, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../hover-card"
import { checkA11y } from "../../../../test-utils/a11y"

describe("HoverCard", () => {
  it("renders trigger correctly", () => {
    render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByText("Hover me")).toBeInTheDocument()
  })

  it("trigger has correct data-slot", () => {
    render(
      <HoverCard>
        <HoverCardTrigger data-testid="trigger">Hover</HoverCardTrigger>
        <HoverCardContent>Content</HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByTestId("trigger")).toHaveAttribute("data-slot", "hover-card-trigger")
  })

  it("renders content when open", () => {
    render(
      <HoverCard open={true}>
        <HoverCardTrigger>Hover</HoverCardTrigger>
        <HoverCardContent>
          <p>Rich hover content</p>
        </HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByText("Rich hover content")).toBeInTheDocument()
  })

  it("HoverCardContent has data-slot attribute", () => {
    render(
      <HoverCard open={true}>
        <HoverCardTrigger>Hover</HoverCardTrigger>
        <HoverCardContent data-testid="content">Content here</HoverCardContent>
      </HoverCard>
    )
    expect(screen.getByTestId("content")).toHaveAttribute("data-slot", "hover-card-content")
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (trigger/closed state)", async () => {
    const { container } = render(
      <HoverCard>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent>Card content</HoverCardContent>
      </HoverCard>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (open state)", async () => {
    let container: HTMLElement
    await act(async () => {
      const result = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>
            <p>Rich hover content with details</p>
          </HoverCardContent>
        </HoverCard>
      )
      container = result.container
    })
    await checkA11y(container!)
  })
})
