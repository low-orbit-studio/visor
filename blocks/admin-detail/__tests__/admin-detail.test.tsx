import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect } from "vitest"
import { AdminDetail } from "../admin-detail"
import { checkA11y } from "../../../test-utils/a11y"

const baseProps = {
  title: "Nadia Reyes",
}

describe("AdminDetail", () => {
  // ─── Identity header ──────────────────────────────────────────────────

  it("renders the record title as the page heading", () => {
    render(<AdminDetail {...baseProps} />)
    expect(
      screen.getByRole("heading", { level: 1, name: "Nadia Reyes" })
    ).toBeInTheDocument()
  })

  it("renders eyebrow, subtitle, and actions", () => {
    render(
      <AdminDetail
        {...baseProps}
        eyebrow="Artist"
        subtitle="Techno · Brooklyn"
        actions={<button type="button">Book</button>}
      />
    )
    expect(screen.getByText("Artist")).toBeInTheDocument()
    expect(screen.getByText("Techno · Brooklyn")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument()
  })

  it("renders a StatusBadge when status is a status string", () => {
    render(<AdminDetail {...baseProps} status="active" />)
    // StatusBadge default label for "active" is "Active".
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders a custom status node verbatim", () => {
    render(<AdminDetail {...baseProps} status={<span>Custom</span>} />)
    expect(screen.getByText("Custom")).toBeInTheDocument()
  })

  it("replaces the identity header when `header` is provided", () => {
    render(
      <AdminDetail {...baseProps} header={<div>Custom header</div>} />
    )
    expect(screen.getByText("Custom header")).toBeInTheDocument()
    // Default title heading is suppressed.
    expect(
      screen.queryByRole("heading", { level: 1, name: "Nadia Reyes" })
    ).not.toBeInTheDocument()
  })

  // ─── Key-value sections ───────────────────────────────────────────────

  it("renders sections that compose KeyValueList items", () => {
    render(
      <AdminDetail
        {...baseProps}
        sections={[
          {
            id: "profile",
            title: "Profile",
            items: [
              { label: "Agency", value: "Animal Bookings" },
              { label: "Home base", value: "Brooklyn, NY" },
            ],
          },
        ]}
      />
    )
    expect(
      screen.getByRole("heading", { level: 2, name: "Profile" })
    ).toBeInTheDocument()
    expect(screen.getByText("Agency")).toBeInTheDocument()
    expect(screen.getByText("Animal Bookings")).toBeInTheDocument()
    expect(screen.getByText("Home base")).toBeInTheDocument()
  })

  it("renders a section's arbitrary sub-list content", () => {
    render(
      <AdminDetail
        {...baseProps}
        sections={[
          {
            id: "history",
            title: "Booking history",
            content: <div>Ledger rows here</div>,
          },
        ]}
      />
    )
    expect(screen.getByText("Ledger rows here")).toBeInTheDocument()
  })

  // ─── Sensitive / reveal panel ─────────────────────────────────────────

  it("hides sensitive items until revealed", async () => {
    const user = userEvent.setup()
    render(
      <AdminDetail
        {...baseProps}
        sensitive={{
          title: "Tax & banking",
          hiddenNote: "Hidden for privacy.",
          items: [{ label: "Tax ID", value: "**-***4821" }],
        }}
      />
    )

    // Hidden by default: the note shows, the value does not.
    expect(screen.getByText("Hidden for privacy.")).toBeInTheDocument()
    expect(screen.queryByText("**-***4821")).not.toBeInTheDocument()

    // Toggle the reveal switch.
    await user.click(screen.getByRole("switch"))
    expect(screen.getByText("**-***4821")).toBeInTheDocument()
    expect(screen.queryByText("Hidden for privacy.")).not.toBeInTheDocument()
  })

  it("respects defaultRevealed", () => {
    render(
      <AdminDetail
        {...baseProps}
        sensitive={{
          title: "Tax & banking",
          defaultRevealed: true,
          items: [{ label: "Tax ID", value: "**-***4821" }],
        }}
      />
    )
    expect(screen.getByText("**-***4821")).toBeInTheDocument()
  })

  it("supports controlled reveal via revealed + onRevealedChange", async () => {
    const user = userEvent.setup()
    const changes: boolean[] = []
    render(
      <AdminDetail
        {...baseProps}
        sensitive={{
          title: "Tax & banking",
          revealed: false,
          onRevealedChange: (next) => changes.push(next),
          items: [{ label: "Tax ID", value: "**-***4821" }],
        }}
      />
    )
    // Still hidden — external state pins it closed.
    await user.click(screen.getByRole("switch"))
    expect(changes).toEqual([true])
    expect(screen.queryByText("**-***4821")).not.toBeInTheDocument()
  })

  // ─── Sub-list slots ───────────────────────────────────────────────────

  it("renders trailing children after the sections", () => {
    render(
      <AdminDetail {...baseProps}>
        <div>Invoice ledger</div>
      </AdminDetail>
    )
    expect(screen.getByText("Invoice ledger")).toBeInTheDocument()
  })

  // ─── Accessibility ────────────────────────────────────────────────────

  it("has no a11y violations for a full record", async () => {
    const { container } = render(
      <AdminDetail
        {...baseProps}
        eyebrow="Artist"
        subtitle="Techno · Brooklyn"
        status="active"
        sections={[
          {
            id: "profile",
            title: "Profile",
            items: [{ label: "Agency", value: "Animal Bookings" }],
          },
        ]}
        sensitive={{
          title: "Tax & banking",
          items: [{ label: "Tax ID", value: "**-***4821" }],
        }}
      />
    )
    await checkA11y(container)
  })
})
