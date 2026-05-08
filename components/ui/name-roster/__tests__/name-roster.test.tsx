import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { NameRoster, NameRosterItem } from "../name-roster"
import { checkA11y } from "../../../../test-utils/a11y"

// --------------------------------------------------------------------------
// Happy path
// --------------------------------------------------------------------------

describe("NameRoster — happy path", () => {
  it("renders a list with children", () => {
    render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
        <NameRosterItem>Visor</NameRosterItem>
      </NameRoster>
    )
    expect(screen.getByText("SCRUFF")).toBeInTheDocument()
    expect(screen.getByText("Visor")).toBeInTheDocument()
  })

  it("sets data-slot on the roster", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "name-roster")
  })

  it("sets data-slot on each item", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    const item = container.querySelector("[data-slot='name-roster-item']")
    expect(item).toBeInTheDocument()
  })

  it("renders as <ul> by default", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    expect(container.firstChild?.nodeName).toBe("UL")
  })

  it("renders as <ol> when as='ol'", () => {
    const { container } = render(
      <NameRoster as="ol">
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    expect(container.firstChild?.nodeName).toBe("OL")
  })

  it("forwards custom className to roster", () => {
    const { container } = render(
      <NameRoster className="custom-roster">
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    expect(container.firstChild).toHaveClass("custom-roster")
  })
})

// --------------------------------------------------------------------------
// Dot toggle
// --------------------------------------------------------------------------

describe("NameRoster — dot toggle", () => {
  it("sets data-dot='true' by default", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    expect(container.firstChild).toHaveAttribute("data-dot", "true")
  })

  it("sets data-dot='false' when dot=false", () => {
    const { container } = render(
      <NameRoster dot={false}>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    expect(container.firstChild).toHaveAttribute("data-dot", "false")
  })
})

// --------------------------------------------------------------------------
// Highlighted variant
// --------------------------------------------------------------------------

describe("NameRosterItem — highlighted variant", () => {
  it("does not set data-highlighted when highlighted is false", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    const item = container.querySelector("[data-slot='name-roster-item']")
    expect(item).not.toHaveAttribute("data-highlighted")
  })

  it("sets data-highlighted='true' when highlighted=true", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem highlighted>Visor</NameRosterItem>
      </NameRoster>
    )
    const item = container.querySelector("[data-slot='name-roster-item']")
    expect(item).toHaveAttribute("data-highlighted", "true")
  })

  it("renders both highlighted and non-highlighted items", () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>SCRUFF</NameRosterItem>
        <NameRosterItem highlighted>Visor</NameRosterItem>
      </NameRoster>
    )
    const items = container.querySelectorAll("[data-slot='name-roster-item']")
    expect(items).toHaveLength(2)
    expect(items[0]).not.toHaveAttribute("data-highlighted")
    expect(items[1]).toHaveAttribute("data-highlighted", "true")
  })
})

// --------------------------------------------------------------------------
// Responsive columns
// --------------------------------------------------------------------------

describe("NameRoster — responsive columns", () => {
  it("sets --roster-columns via style for a plain number", () => {
    const { container } = render(
      <NameRoster columns={3}>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    const roster = container.firstChild as HTMLElement
    expect(roster.style.getPropertyValue("--roster-columns")).toBe("3")
  })

  it("sets breakpoint CSS custom properties for a responsive object", () => {
    const { container } = render(
      <NameRoster columns={{ base: 1, sm: 2, md: 3, lg: 4 }}>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    const roster = container.firstChild as HTMLElement
    expect(roster.style.getPropertyValue("--roster-columns")).toBe("1")
    expect(roster.style.getPropertyValue("--roster-columns-sm")).toBe("2")
    expect(roster.style.getPropertyValue("--roster-columns-md")).toBe("3")
    expect(roster.style.getPropertyValue("--roster-columns-lg")).toBe("4")
  })
})

// --------------------------------------------------------------------------
// Alpha sort
// --------------------------------------------------------------------------

describe("NameRoster — alpha sort", () => {
  it("renders items in insertion order when sort='none'", () => {
    render(
      <NameRoster sort="none">
        <NameRosterItem>Zebra</NameRosterItem>
        <NameRosterItem>Apple</NameRosterItem>
      </NameRoster>
    )
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Zebra")
    expect(items[1]).toHaveTextContent("Apple")
  })

  it("sorts children alphabetically when sort='alpha'", () => {
    render(
      <NameRoster sort="alpha">
        <NameRosterItem>Zebra</NameRosterItem>
        <NameRosterItem>Apple</NameRosterItem>
        <NameRosterItem>Mango</NameRosterItem>
      </NameRoster>
    )
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Apple")
    expect(items[1]).toHaveTextContent("Mango")
    expect(items[2]).toHaveTextContent("Zebra")
  })

  it("sorts items array alphabetically when sort='alpha'", () => {
    render(
      <NameRoster
        sort="alpha"
        items={[
          { name: "Zebra" },
          { name: "Apple" },
          { name: "Mango" },
        ]}
      />
    )
    const items = screen.getAllByRole("listitem")
    expect(items[0]).toHaveTextContent("Apple")
    expect(items[1]).toHaveTextContent("Mango")
    expect(items[2]).toHaveTextContent("Zebra")
  })
})

// --------------------------------------------------------------------------
// items vs children mode
// --------------------------------------------------------------------------

describe("NameRoster — items vs children mode", () => {
  it("renders from items array (shorthand mode)", () => {
    render(
      <NameRoster
        items={[
          { name: "SCRUFF" },
          { name: "Visor", highlighted: true },
          { name: "Blacklight", highlighted: true },
        ]}
      />
    )
    expect(screen.getByText("SCRUFF")).toBeInTheDocument()
    expect(screen.getByText("Visor")).toBeInTheDocument()
    expect(screen.getByText("Blacklight")).toBeInTheDocument()
  })

  it("applies highlighted from items array", () => {
    const { container } = render(
      <NameRoster
        items={[
          { name: "SCRUFF" },
          { name: "Visor", highlighted: true },
        ]}
      />
    )
    const items = container.querySelectorAll("[data-slot='name-roster-item']")
    expect(items[0]).not.toHaveAttribute("data-highlighted")
    expect(items[1]).toHaveAttribute("data-highlighted", "true")
  })

  it("items mode takes precedence over children", () => {
    render(
      <NameRoster items={[{ name: "FromItems" }]}>
        <NameRosterItem>FromChildren</NameRosterItem>
      </NameRoster>
    )
    expect(screen.getByText("FromItems")).toBeInTheDocument()
    expect(screen.queryByText("FromChildren")).not.toBeInTheDocument()
  })
})

// --------------------------------------------------------------------------
// Accessibility
// --------------------------------------------------------------------------

describe("NameRoster — accessibility", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>ANIMAL</NameRosterItem>
        <NameRosterItem>Blacklight</NameRosterItem>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (with highlighted items)", async () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>ANIMAL</NameRosterItem>
        <NameRosterItem highlighted>Blacklight</NameRosterItem>
        <NameRosterItem highlighted>Visor</NameRosterItem>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (dot=false)", async () => {
    const { container } = render(
      <NameRoster dot={false}>
        <NameRosterItem>SCRUFF</NameRosterItem>
      </NameRoster>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (multi-column)", async () => {
    const { container } = render(
      <NameRoster columns={{ base: 1, md: 3, lg: 4 }}>
        <NameRosterItem>ANIMAL</NameRosterItem>
        <NameRosterItem>Blacklight</NameRosterItem>
        <NameRosterItem>SCRUFF</NameRosterItem>
        <NameRosterItem>Visor</NameRosterItem>
      </NameRoster>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (anchor children)", async () => {
    const { container } = render(
      <NameRoster>
        <NameRosterItem>
          <a href="/clients/scruff">SCRUFF</a>
        </NameRosterItem>
        <NameRosterItem highlighted>
          <a href="/products/visor">Visor</a>
        </NameRosterItem>
      </NameRoster>
    )
    await checkA11y(container)
  })

  it("has no WCAG 2.1 AA violations (items shorthand)", async () => {
    const { container } = render(
      <NameRoster
        items={[
          { name: "ANIMAL" },
          { name: "Blacklight", highlighted: true },
          { name: "Knowmentum", highlighted: true },
          { name: "SCRUFF" },
          { name: "Visor", highlighted: true },
        ]}
      />
    )
    await checkA11y(container)
  })
})
