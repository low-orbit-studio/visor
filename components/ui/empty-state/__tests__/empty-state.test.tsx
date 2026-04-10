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
