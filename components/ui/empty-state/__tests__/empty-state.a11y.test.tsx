import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { EmptyState } from "../empty-state"

describe("EmptyState a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default, heading only)", async () => {
    const { container } = render(<EmptyState heading="No profiles yet" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with description)", async () => {
    const { container } = render(
      <EmptyState
        heading="No profiles yet"
        description="Create your first profile to get started."
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with icon)", async () => {
    const { container } = render(
      <EmptyState
        heading="No profiles yet"
        description="Create your first profile to get started."
        icon={
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <rect width="24" height="24" />
          </svg>
        }
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with primary action)", async () => {
    const { container } = render(
      <EmptyState
        heading="No profiles yet"
        description="Create your first profile to get started."
        action={<button type="button">New profile</button>}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (with both actions)", async () => {
    const { container } = render(
      <EmptyState
        heading="No profiles yet"
        description="Create your first profile to get started."
        action={<button type="button">New profile</button>}
        secondaryAction={<button type="button">Learn more</button>}
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (size sm)", async () => {
    const { container } = render(
      <EmptyState size="sm" heading="No results" description="Try another search." />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (size md)", async () => {
    const { container } = render(
      <EmptyState size="md" heading="No results" description="Try another search." />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (size lg)", async () => {
    const { container } = render(
      <EmptyState size="lg" heading="No results" description="Try another search." />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (tone default)", async () => {
    const { container } = render(
      <EmptyState tone="default" heading="Inbox is empty" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no WCAG 2.1 AA violations (tone subtle)", async () => {
    const { container } = render(
      <EmptyState tone="subtle" heading="Inbox is empty" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
