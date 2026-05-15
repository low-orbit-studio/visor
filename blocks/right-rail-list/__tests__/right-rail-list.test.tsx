import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { RightRailList, type RightRailRow } from "../right-rail-list"
import { checkA11y } from "../../../test-utils/a11y"

const weekRows: RightRailRow[] = [
  { id: "sun", leading: "Sun", primary: "Sunday Service", trailing: "42%" },
  {
    id: "wed",
    leading: "Wed",
    primary: "Discwoman pres. LSDXOXO",
    trailing: "Sold",
    trailingTone: "mint",
  },
  { id: "fri", leading: "Fri", primary: "Friday Night", trailing: "78%" },
]

describe("RightRailList", () => {
  // ─── Rendering ─────────────────────────────────────────────────────────

  it("renders a row for each entry", () => {
    render(<RightRailList rows={weekRows} aria-label="This week" />)
    expect(screen.getByText("Sunday Service")).toBeInTheDocument()
    expect(screen.getByText("Discwoman pres. LSDXOXO")).toBeInTheDocument()
    expect(screen.getByText("Friday Night")).toBeInTheDocument()
  })

  it("renders an empty <ul> when rows is empty (no chrome)", () => {
    const { container } = render(<RightRailList rows={[]} />)
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root).toBeInTheDocument()
    expect(root?.tagName).toBe("UL")
    expect(root?.children).toHaveLength(0)
  })

  it("renders the leading slot when supplied", () => {
    render(<RightRailList rows={weekRows} />)
    expect(screen.getByText("Sun")).toBeInTheDocument()
    expect(screen.getByText("Wed")).toBeInTheDocument()
  })

  it("omits the leading slot when not supplied", () => {
    const { container } = render(
      <RightRailList
        rows={[{ id: "x", primary: "No leading here", trailing: "1" }]}
      />
    )
    expect(
      container.querySelector('[data-slot="right-rail-list-leading"]')
    ).toBeNull()
  })

  it("omits the trailing slot when not supplied", () => {
    const { container } = render(
      <RightRailList rows={[{ id: "x", primary: "No trailing here" }]} />
    )
    expect(
      container.querySelector('[data-slot="right-rail-list-trailing"]')
    ).toBeNull()
  })

  it("renders ReactNode leading content (e.g. an avatar)", () => {
    render(
      <RightRailList
        rows={[
          {
            id: "p1",
            leading: <span data-testid="avatar">JS</span>,
            primary: "Justin",
            trailing: "$48.2k",
          },
        ]}
      />
    )
    expect(screen.getByTestId("avatar")).toBeInTheDocument()
  })

  it("renders a link as primary content", () => {
    render(
      <RightRailList
        rows={[
          {
            id: "evt",
            primary: <a href="/events/sunday">Sunday Service</a>,
            trailing: "42%",
          },
        ]}
      />
    )
    const link = screen.getByRole("link", { name: "Sunday Service" })
    expect(link).toHaveAttribute("href", "/events/sunday")
  })

  // ─── data-slot attributes ──────────────────────────────────────────────

  it('applies data-slot="right-rail-list" to root', () => {
    const { container } = render(<RightRailList rows={weekRows} />)
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root?.tagName).toBe("UL")
  })

  it('applies data-slot="right-rail-list-row" to each row', () => {
    const { container } = render(<RightRailList rows={weekRows} />)
    const rows = container.querySelectorAll(
      '[data-slot="right-rail-list-row"]'
    )
    expect(rows).toHaveLength(weekRows.length)
  })

  it("applies leading / primary / trailing data-slot attributes", () => {
    const { container } = render(<RightRailList rows={weekRows} />)
    expect(
      container.querySelectorAll('[data-slot="right-rail-list-leading"]')
    ).toHaveLength(3)
    expect(
      container.querySelectorAll('[data-slot="right-rail-list-primary"]')
    ).toHaveLength(3)
    expect(
      container.querySelectorAll('[data-slot="right-rail-list-trailing"]')
    ).toHaveLength(3)
  })

  // ─── Trailing tone ─────────────────────────────────────────────────────

  it('sets data-tone="default" on trailing when tone is omitted', () => {
    const { container } = render(
      <RightRailList
        rows={[{ id: "x", primary: "Plain", trailing: "42%" }]}
      />
    )
    const trailing = container.querySelector(
      '[data-slot="right-rail-list-trailing"]'
    )
    expect(trailing).toHaveAttribute("data-tone", "default")
  })

  it("propagates the trailingTone prop to data-tone", () => {
    const { container } = render(
      <RightRailList
        rows={[
          { id: "a", primary: "Mint", trailing: "Sold", trailingTone: "mint" },
          { id: "b", primary: "Muted", trailing: "—", trailingTone: "muted" },
          { id: "c", primary: "Warn", trailing: "Low", trailingTone: "warn" },
        ]}
      />
    )
    expect(
      container.querySelector('[data-tone="mint"]')?.textContent
    ).toBe("Sold")
    expect(
      container.querySelector('[data-tone="muted"]')?.textContent
    ).toBe("—")
    expect(
      container.querySelector('[data-tone="warn"]')?.textContent
    ).toBe("Low")
  })

  // ─── Compact mode ──────────────────────────────────────────────────────

  it("sets data-compact attribute when compact prop is true", () => {
    const { container } = render(
      <RightRailList rows={weekRows} compact />
    )
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root).toHaveAttribute("data-compact", "true")
  })

  it("does not set data-compact when compact is false (default)", () => {
    const { container } = render(<RightRailList rows={weekRows} />)
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root).not.toHaveAttribute("data-compact")
  })

  // ─── Root element variants ─────────────────────────────────────────────

  it('renders as <ol> when as="ol"', () => {
    const { container } = render(<RightRailList rows={weekRows} as="ol" />)
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root?.tagName).toBe("OL")
    // Rows are still <li> children of an ordered list.
    expect(
      container.querySelectorAll('li[data-slot="right-rail-list-row"]')
    ).toHaveLength(weekRows.length)
  })

  it('renders as <div> when as="div" (rows are <div> too)', () => {
    const { container } = render(<RightRailList rows={weekRows} as="div" />)
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root?.tagName).toBe("DIV")
    expect(
      container.querySelectorAll('div[data-slot="right-rail-list-row"]')
    ).toHaveLength(weekRows.length)
    // No stray <li> elements when the root is a <div>.
    expect(container.querySelectorAll("li")).toHaveLength(0)
  })

  // ─── HTML attribute forwarding ─────────────────────────────────────────

  it("forwards arbitrary attributes (aria-label) to the root", () => {
    render(<RightRailList rows={weekRows} aria-label="This week" />)
    expect(screen.getByLabelText("This week")).toBeInTheDocument()
  })

  it("merges className with the internal root class", () => {
    const { container } = render(
      <RightRailList rows={weekRows} className="custom-rail" />
    )
    const root = container.querySelector('[data-slot="right-rail-list"]')
    expect(root?.className).toMatch(/custom-rail/)
  })

  // ─── Accessibility ─────────────────────────────────────────────────────

  it("has no axe violations (default)", async () => {
    const { container } = render(
      <RightRailList rows={weekRows} aria-label="This week" />
    )
    await checkA11y(container)
  })

  it("has no axe violations (compact mode)", async () => {
    const { container } = render(
      <RightRailList rows={weekRows} compact aria-label="This week" />
    )
    await checkA11y(container)
  })

  it("has no axe violations (links in primary slot)", async () => {
    const { container } = render(
      <RightRailList
        aria-label="This week"
        rows={[
          {
            id: "evt",
            leading: "Sun",
            primary: <a href="#evt">Sunday Service</a>,
            trailing: "42%",
          },
        ]}
      />
    )
    await checkA11y(container)
  })
})
