import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { EmptyState } from "../empty-state"

describe("EmptyState", () => {
  it("renders the heading", () => {
    render(<EmptyState heading="No profiles yet" />)
    const heading = screen.getByRole("heading", { name: /no profiles yet/i })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe("H3")
  })

  it("renders the description when provided", () => {
    render(
      <EmptyState
        heading="No profiles yet"
        description="Create your first profile to get started."
      />
    )
    expect(
      screen.getByText(/create your first profile to get started/i)
    ).toBeInTheDocument()
  })

  it("renders the icon slot with aria-hidden", () => {
    const { container } = render(
      <EmptyState
        heading="Empty"
        icon={<svg data-testid="icon" />}
      />
    )
    const iconSlot = container.querySelector('[data-slot="empty-state-icon"]')
    expect(iconSlot).not.toBeNull()
    expect(iconSlot).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("icon")).toBeInTheDocument()
  })

  it("renders the action slot", () => {
    render(
      <EmptyState
        heading="Empty"
        action={<button type="button">New profile</button>}
      />
    )
    expect(
      screen.getByRole("button", { name: /new profile/i })
    ).toBeInTheDocument()
  })

  it("renders both action and secondaryAction slots", () => {
    const { container } = render(
      <EmptyState
        heading="Empty"
        action={<button type="button">New profile</button>}
        secondaryAction={<button type="button">Learn more</button>}
      />
    )
    expect(
      screen.getByRole("button", { name: /new profile/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /learn more/i })
    ).toBeInTheDocument()
    // When both actions present, cluster uses role="group"
    const actions = container.querySelector('[data-slot="empty-state-actions"]')
    expect(actions).toHaveAttribute("role", "group")
  })

  it("does not render the actions cluster when no action slots given", () => {
    const { container } = render(<EmptyState heading="Empty" />)
    expect(
      container.querySelector('[data-slot="empty-state-actions"]')
    ).toBeNull()
  })

  it("does not set role=group when only one action slot provided", () => {
    const { container } = render(
      <EmptyState
        heading="Empty"
        action={<button type="button">Do it</button>}
      />
    )
    const actions = container.querySelector('[data-slot="empty-state-actions"]')
    expect(actions).not.toBeNull()
    expect(actions).not.toHaveAttribute("role", "group")
  })

  it("applies size variant classes", () => {
    const { container, rerender } = render(
      <EmptyState heading="Empty" size="sm" />
    )
    let root = container.querySelector('[data-slot="empty-state"]')
    expect(root?.className).toMatch(/sizeSm/)

    rerender(<EmptyState heading="Empty" size="lg" />)
    root = container.querySelector('[data-slot="empty-state"]')
    expect(root?.className).toMatch(/sizeLg/)
  })

  it("applies tone variant classes", () => {
    const { container, rerender } = render(
      <EmptyState heading="Empty" tone="default" />
    )
    let root = container.querySelector('[data-slot="empty-state"]')
    expect(root?.className).toMatch(/toneDefault/)
    expect(root).toHaveAttribute("data-tone", "default")

    rerender(<EmptyState heading="Empty" tone="subtle" />)
    root = container.querySelector('[data-slot="empty-state"]')
    expect(root?.className).toMatch(/toneSubtle/)
    expect(root).toHaveAttribute("data-tone", "subtle")
  })

  it("defaults to the default variant with no editorial class", () => {
    const { container } = render(<EmptyState heading="Empty" />)
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root?.className).not.toMatch(/editorial/)
    expect(root).toHaveAttribute("data-variant", "default")
  })

  it("applies the editorial variant class and data attribute", () => {
    const { container } = render(
      <EmptyState heading="Empty" variant="editorial" />
    )
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root?.className).toMatch(/editorial/)
    expect(root).toHaveAttribute("data-variant", "editorial")
  })

  it("respects headingAs to change heading level", () => {
    const { rerender } = render(
      <EmptyState heading="H2 heading" headingAs="h2" />
    )
    expect(
      screen.getByRole("heading", { level: 2, name: /h2 heading/i })
    ).toBeInTheDocument()

    rerender(<EmptyState heading="H4 heading" headingAs="h4" />)
    expect(
      screen.getByRole("heading", { level: 4, name: /h4 heading/i })
    ).toBeInTheDocument()
  })

  it('has role="status" on the root', () => {
    render(<EmptyState heading="Empty" />)
    const status = screen.getByRole("status")
    expect(status).toBeInTheDocument()
    expect(status).toHaveAttribute("data-slot", "empty-state")
  })

  it("passes through HTML attributes and className", () => {
    const { container } = render(
      <EmptyState
        heading="Empty"
        id="empty-root"
        aria-label="Empty list"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root).toHaveAttribute("id", "empty-root")
    expect(root).toHaveAttribute("aria-label", "Empty list")
    expect(root).toHaveClass("custom-class")
  })

  it("forwards ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<EmptyState ref={ref} heading="Ref test" />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.getAttribute("data-slot")).toBe("empty-state")
  })
})

describe("EmptyState — intent variants", () => {
  it("renders first-use intent with data-intent attribute", () => {
    const { container } = render(
      <EmptyState intent="first-use" heading="No projects yet" />
    )
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root).toHaveAttribute("data-intent", "first-use")
    expect(root?.className).toMatch(/intentFirstUse/)
  })

  it("renders zero-results intent with data-intent attribute", () => {
    const { container } = render(
      <EmptyState intent="zero-results" heading='No results for "foo"' />
    )
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root).toHaveAttribute("data-intent", "zero-results")
    expect(root?.className).toMatch(/intentZeroResults/)
  })

  it("renders no-access intent with data-intent attribute", () => {
    const { container } = render(
      <EmptyState intent="no-access" heading="You don't have access" />
    )
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root).toHaveAttribute("data-intent", "no-access")
    expect(root?.className).toMatch(/intentNoAccess/)
  })

  it("does not add data-intent when intent is not set", () => {
    const { container } = render(<EmptyState heading="Empty" />)
    const root = container.querySelector('[data-slot="empty-state"]')
    expect(root).not.toHaveAttribute("data-intent")
  })

  it("auto-wraps icon in iconWrap slot when intent is set", () => {
    const { container } = render(
      <EmptyState
        intent="first-use"
        icon={<svg data-testid="icon" />}
        heading="No projects yet"
      />
    )
    const iconSlot = container.querySelector('[data-slot="empty-state-icon"]')
    expect(iconSlot).not.toBeNull()
    expect(iconSlot).toHaveAttribute("aria-hidden", "true")
    expect(iconSlot?.className).toMatch(/iconWrap/)
  })

  it("does not wrap icon when no intent and iconWrap is not set", () => {
    const { container } = render(
      <EmptyState icon={<svg data-testid="icon" />} heading="Empty" />
    )
    const iconSlot = container.querySelector('[data-slot="empty-state-icon"]')
    expect(iconSlot).not.toBeNull()
    expect(iconSlot?.className).not.toMatch(/iconWrap/)
  })

  it("wraps icon when iconWrap=true even without intent", () => {
    const { container } = render(
      <EmptyState iconWrap icon={<svg data-testid="icon" />} heading="Empty" />
    )
    const iconSlot = container.querySelector('[data-slot="empty-state-icon"]')
    expect(iconSlot?.className).toMatch(/iconWrap/)
  })

  it("does not render icon wrap slot when no icon is provided", () => {
    const { container } = render(
      <EmptyState intent="first-use" heading="No projects yet" />
    )
    expect(
      container.querySelector('[data-slot="empty-state-icon"]')
    ).toBeNull()
  })

  it("first-use: renders with description and creation CTA", () => {
    render(
      <EmptyState
        intent="first-use"
        icon={<svg />}
        heading="No projects yet"
        description="Create your first project to get started."
        action={<button type="button">Create a project</button>}
      />
    )
    expect(
      screen.getByRole("heading", { name: /no projects yet/i })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/create your first project/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /create a project/i })
    ).toBeInTheDocument()
  })

  it("zero-results: renders with clear-filter secondary action", () => {
    render(
      <EmptyState
        intent="zero-results"
        icon={<svg />}
        heading='No results for "lighthouse redesign"'
        description="Try a different search term or clear your filters."
        secondaryAction={<button type="button">Clear search</button>}
      />
    )
    expect(
      screen.getByRole("heading", { name: /no results for/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /clear search/i })
    ).toBeInTheDocument()
  })

  it("no-access: renders without CTA (terminal state)", () => {
    const { container } = render(
      <EmptyState
        intent="no-access"
        icon={<svg />}
        heading="You don't have access"
        description="Ask your workspace admin to give you permission."
      />
    )
    expect(
      screen.getByRole("heading", { name: /you don't have access/i })
    ).toBeInTheDocument()
    expect(
      container.querySelector('[data-slot="empty-state-actions"]')
    ).toBeNull()
  })
})
