import { render } from "@testing-library/react"
import { describe, it, beforeEach, afterEach, vi } from "vitest"
import { CommandDialog, type CommandDialogGroup } from "../command-dialog"
import { checkA11y } from "../../../test-utils/a11y"

// Suppress Radix's "Missing `Description`" warning — the palette intentionally
// uses a visually-hidden DialogTitle and no description.
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

const GROUPS: CommandDialogGroup[] = [
  {
    id: "events",
    heading: "Events",
    count: 2,
    items: [
      {
        id: "resolute",
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
        id: "nowadays",
        value: "Nowadays Volvox b2b Eris",
        label: "Nowadays — Volvox b2b Eris",
        meta: "May 17 · 22:00",
      },
    ],
  },
  {
    id: "actions",
    heading: "Actions",
    items: [
      {
        id: "new",
        value: "new event with eris drew",
        label: "New event with Eris Drew",
        shortcut: "N",
      },
    ],
  },
]

describe("CommandDialog — accessibility", () => {
  it("has no WCAG 2.1 AA violations when open", async () => {
    const { baseElement } = render(
      <CommandDialog
        open
        onOpenChange={() => {}}
        scope="Events"
        groups={GROUPS}
        footerHints={[
          { keys: "↑↓", label: "navigate" },
          { keys: "↵", label: "open" },
          { keys: ["⌘", "↵"], label: "open in tab" },
          { keys: "tab", label: "filter" },
        ]}
      />
    )
    // cmdk wraps items in group divs between listbox and option roles.
    // axe-core flags this as aria-required-children but cmdk manages ARIA
    // semantics correctly — same exemption pattern as the Command primitive
    // test suite.
    await checkA11y(baseElement, {
      rules: { "aria-required-children": { enabled: false } },
    })
  })
})
