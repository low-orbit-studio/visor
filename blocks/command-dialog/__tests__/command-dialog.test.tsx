import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { CommandDialog, type CommandDialogGroup } from "../command-dialog"

// CommandDialog renders DialogContent without a DialogDescription. Suppress
// Radix's "Missing `Description`" warning so the test output stays clean.
let originalWarn: typeof console.warn
beforeEach(() => {
  originalWarn = console.warn
  console.warn = vi.fn((...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : ""
    if (msg.includes("Missing `Description`")) return
    originalWarn(...args)
  })
})
afterEach(() => {
  console.warn = originalWarn
})

const EVENTS_GROUP: CommandDialogGroup = {
  id: "events",
  heading: "Events",
  count: 3,
  items: [
    {
      id: "resolute-eris",
      value: "Resolute presents Eris Drew",
      label: (
        <>
          Resolute pres. <span data-hit>Eris</span> Drew
        </>
      ),
      meta: "Tonight · 22:00 · House of Yes",
      shortcut: "↵",
    },
    {
      id: "nowadays-volvox",
      value: "Nowadays Volvox b2b Eris",
      label: "Nowadays — Volvox b2b Eris",
      meta: "May 17 · 22:00 · Nowadays",
    },
  ],
}

const GUESTS_GROUP: CommandDialogGroup = {
  id: "guests",
  heading: "Guests",
  count: 1,
  items: [
    {
      id: "eris-drew-guest",
      value: "Eris Drew",
      label: "Eris Drew",
      meta: "DJ · 12 events",
    },
  ],
}

const ACTIONS_GROUP: CommandDialogGroup = {
  id: "actions",
  heading: "Actions",
  items: [
    {
      id: "new-event",
      value: "new event with eris drew",
      label: "New event with Eris Drew",
      shortcut: "N",
    },
  ],
}

const ALL_GROUPS: CommandDialogGroup[] = [
  EVENTS_GROUP,
  GUESTS_GROUP,
  ACTIONS_GROUP,
]

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  groups: ALL_GROUPS,
}

describe("CommandDialog", () => {
  // ── Rendering ─────────────────────────────────────────────────────────

  it("renders the palette when open", () => {
    render(<CommandDialog {...defaultProps} />)
    expect(
      screen.getByPlaceholderText("Type a command, search…")
    ).toBeInTheDocument()
  })

  it("does not render content when closed", () => {
    render(<CommandDialog {...defaultProps} open={false} />)
    expect(
      screen.queryByPlaceholderText("Type a command, search…")
    ).not.toBeInTheDocument()
  })

  it("renders a visually-hidden DialogTitle for a11y", () => {
    render(<CommandDialog {...defaultProps} />)
    expect(screen.getByText("Command Palette")).toBeInTheDocument()
  })

  it("forwards className to DialogContent", () => {
    const { baseElement } = render(
      <CommandDialog {...defaultProps} className="custom-palette" />
    )
    const content = baseElement.querySelector(
      "[data-slot='command-dialog']"
    )
    expect(content).toHaveClass("custom-palette")
  })

  it("renders a custom placeholder", () => {
    render(
      <CommandDialog {...defaultProps} placeholder="Find anything…" />
    )
    expect(
      screen.getByPlaceholderText("Find anything…")
    ).toBeInTheDocument()
  })

  // ── Scope chip ────────────────────────────────────────────────────────

  it("renders the scope chip when supplied (string form)", () => {
    const { baseElement } = render(
      <CommandDialog {...defaultProps} scope="Events" />
    )
    const chip = baseElement.querySelector(
      "[data-slot='command-dialog-scope-chip']"
    )
    expect(chip).toBeInTheDocument()
    expect(chip).toHaveTextContent("in Events")
    expect(
      baseElement.querySelector("[data-slot='command-dialog-scope-label']")
    ).toHaveTextContent("in")
  })

  it("renders the scope chip when supplied (ReactNode form)", () => {
    const { baseElement } = render(
      <CommandDialog
        {...defaultProps}
        scope={<span data-testid="custom-scope">custom</span>}
      />
    )
    const chip = baseElement.querySelector(
      "[data-slot='command-dialog-scope-chip']"
    )
    expect(chip).toBeInTheDocument()
    expect(screen.getByTestId("custom-scope")).toBeInTheDocument()
  })

  it("does not render the scope chip when scope is omitted", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    expect(
      baseElement.querySelector("[data-slot='command-dialog-scope-chip']")
    ).not.toBeInTheDocument()
  })

  // ── Groups ────────────────────────────────────────────────────────────

  it("renders every group heading with the slot data attribute", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const headings = baseElement.querySelectorAll(
      "[data-slot='command-dialog-group-heading']"
    )
    expect(headings).toHaveLength(3)
    expect(headings[0]).toHaveTextContent("Events")
    expect(headings[1]).toHaveTextContent("Guests")
    expect(headings[2]).toHaveTextContent("Actions")
  })

  it("renders the optional count adjacent to the group heading", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const eventsHeading = baseElement.querySelectorAll(
      "[data-slot='command-dialog-group-heading']"
    )[0]
    expect(eventsHeading).toHaveTextContent("Events")
    expect(eventsHeading).toHaveTextContent("3")
  })

  it("omits the count when group.count is undefined", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const actionsHeading = baseElement.querySelectorAll(
      "[data-slot='command-dialog-group-heading']"
    )[2]
    expect(actionsHeading).toHaveTextContent("Actions")
    // Actions has no count — heading should not include a stray number.
    expect(actionsHeading.textContent?.trim()).toBe("Actions")
  })

  // ── Items ─────────────────────────────────────────────────────────────

  it("renders each item label", () => {
    render(<CommandDialog {...defaultProps} />)
    expect(screen.getByText("Eris Drew")).toBeInTheDocument()
    expect(
      screen.getByText("Nowadays — Volvox b2b Eris")
    ).toBeInTheDocument()
    expect(screen.getByText("New event with Eris Drew")).toBeInTheDocument()
  })

  it("renders hit-highlighting spans passed inside item labels", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const hits = baseElement.querySelectorAll("[data-hit]")
    expect(hits.length).toBeGreaterThan(0)
    expect(hits[0]).toHaveTextContent("Eris")
  })

  it("renders item meta when supplied", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const metas = baseElement.querySelectorAll(
      "[data-slot='command-dialog-item-meta']"
    )
    expect(metas.length).toBeGreaterThan(0)
    expect(metas[0]).toHaveTextContent("Tonight · 22:00 · House of Yes")
  })

  it("omits item meta when not supplied", () => {
    const groups: CommandDialogGroup[] = [
      {
        id: "g",
        heading: "Group",
        items: [{ id: "x", value: "x", label: "Plain item" }],
      },
    ]
    const { baseElement } = render(
      <CommandDialog open onOpenChange={vi.fn()} groups={groups} />
    )
    expect(
      baseElement.querySelector("[data-slot='command-dialog-item-meta']")
    ).not.toBeInTheDocument()
  })

  it("renders item shortcut as a Kbd with the slot data attribute", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const kbds = baseElement.querySelectorAll(
      "[data-slot='command-dialog-item-kbd']"
    )
    expect(kbds.length).toBeGreaterThan(0)
    expect(kbds[0]).toHaveTextContent("↵")
  })

  it("renders an item icon when supplied", () => {
    const groups: CommandDialogGroup[] = [
      {
        id: "g",
        heading: "Group",
        items: [
          {
            id: "x",
            value: "x",
            label: "Item",
            icon: <span data-testid="ico">●</span>,
          },
        ],
      },
    ]
    render(<CommandDialog open onOpenChange={vi.fn()} groups={groups} />)
    expect(screen.getByTestId("ico")).toBeInTheDocument()
  })

  it("fires onSelect when an item is activated", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    const groups: CommandDialogGroup[] = [
      {
        id: "g",
        heading: "Group",
        items: [
          { id: "x", value: "clickable", label: "Click me", onSelect },
        ],
      },
    ]
    render(<CommandDialog open onOpenChange={vi.fn()} groups={groups} />)
    await user.click(screen.getByText("Click me"))
    expect(onSelect).toHaveBeenCalledWith("clickable")
  })

  // ── Footer ────────────────────────────────────────────────────────────

  it("renders the footer hint row from the prop array", () => {
    const { baseElement } = render(
      <CommandDialog
        {...defaultProps}
        footerHints={[
          { keys: "↑↓", label: "navigate" },
          { keys: "↵", label: "open" },
          { keys: ["⌘", "↵"], label: "open in tab" },
        ]}
      />
    )
    const hints = baseElement.querySelector(
      "[data-slot='command-dialog-footer-hints']"
    )
    expect(hints).toBeInTheDocument()
    expect(hints).toHaveTextContent("navigate")
    expect(hints).toHaveTextContent("open")
    expect(hints).toHaveTextContent("open in tab")
  })

  it("derives the result count from total items by default", () => {
    const { baseElement } = render(<CommandDialog {...defaultProps} />)
    const count = baseElement.querySelector(
      "[data-slot='command-dialog-result-count']"
    )
    // 2 events + 1 guest + 1 action = 4 items
    expect(count).toHaveTextContent("4 results")
  })

  it("honors explicit resultCount when supplied", () => {
    const { baseElement } = render(
      <CommandDialog {...defaultProps} resultCount={42} />
    )
    const count = baseElement.querySelector(
      "[data-slot='command-dialog-result-count']"
    )
    expect(count).toHaveTextContent("42 results")
  })

  it("uses singular 'result' when count is 1", () => {
    const groups: CommandDialogGroup[] = [
      {
        id: "g",
        heading: "Group",
        items: [{ id: "x", value: "x", label: "Only" }],
      },
    ]
    const { baseElement } = render(
      <CommandDialog open onOpenChange={vi.fn()} groups={groups} />
    )
    const count = baseElement.querySelector(
      "[data-slot='command-dialog-result-count']"
    )
    expect(count).toHaveTextContent("1 result")
  })

  it("hides the result count when hideResultCount is true", () => {
    const { baseElement } = render(
      <CommandDialog {...defaultProps} hideResultCount />
    )
    expect(
      baseElement.querySelector("[data-slot='command-dialog-result-count']")
    ).not.toBeInTheDocument()
  })

  it("renders no footer when there are no hints and hideResultCount is true", () => {
    const { baseElement } = render(
      <CommandDialog {...defaultProps} hideResultCount />
    )
    expect(
      baseElement.querySelector("[data-slot='command-dialog-footer']")
    ).not.toBeInTheDocument()
  })

  // ── ⌘K shortcut ───────────────────────────────────────────────────────

  it("opens via ⌘K when closed", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CommandDialog
        open={false}
        onOpenChange={onOpenChange}
        groups={ALL_GROUPS}
      />
    )
    await user.keyboard("{Meta>}k{/Meta}")
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("opens via Ctrl+K when closed", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CommandDialog
        open={false}
        onOpenChange={onOpenChange}
        groups={ALL_GROUPS}
      />
    )
    await user.keyboard("{Control>}k{/Control}")
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("toggles closed via ⌘K when open", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CommandDialog
        open
        onOpenChange={onOpenChange}
        groups={ALL_GROUPS}
      />
    )
    await user.keyboard("{Meta>}k{/Meta}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("does not bind ⌘K when enableShortcut is false", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    render(
      <CommandDialog
        open={false}
        onOpenChange={onOpenChange}
        groups={ALL_GROUPS}
        enableShortcut={false}
      />
    )
    await user.keyboard("{Meta>}k{/Meta}")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("removes the ⌘K listener on unmount", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()
    const { unmount } = render(
      <CommandDialog
        open={false}
        onOpenChange={onOpenChange}
        groups={ALL_GROUPS}
      />
    )
    unmount()
    await user.keyboard("{Meta>}k{/Meta}")
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
