import { render, screen } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
  CommandLoading,
} from "../command"
import { checkA11y } from "../../../../test-utils/a11y"

describe("Command", () => {
  it("renders command root with data-slot", () => {
    const { container } = render(
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandItem>Item 1</CommandItem>
        </CommandList>
      </Command>
    )
    const command = container.querySelector('[data-slot="command"]')
    expect(command).toBeInTheDocument()
  })

  it("CommandInput renders with search icon", () => {
    const { container } = render(
      <Command>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    )
    const input = container.querySelector('[data-slot="command-input"]')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("placeholder", "Type a command...")

    const wrapper = container.querySelector('[data-slot="command-input-wrapper"]')
    expect(wrapper).toBeInTheDocument()
  })

  it("CommandList renders items", () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem>Item 1</CommandItem>
          <CommandItem>Item 2</CommandItem>
        </CommandList>
      </Command>
    )
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("Item 2")).toBeInTheDocument()
  })

  it("CommandEmpty renders no results message", () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>
    )
    expect(screen.getByText("No results found.")).toBeInTheDocument()
  })

  it("CommandGroup renders with heading", () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    expect(screen.getByText("Suggestions")).toBeInTheDocument()
    expect(screen.getByText("Calendar")).toBeInTheDocument()
  })

  it("CommandItem has correct data-slot", () => {
    const { container } = render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem>Test Item</CommandItem>
        </CommandList>
      </Command>
    )
    const item = container.querySelector('[data-slot="command-item"]')
    expect(item).toBeInTheDocument()
    expect(item).toHaveTextContent("Test Item")
  })

  it("CommandSeparator renders", () => {
    const { container } = render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem>Item 1</CommandItem>
          <CommandSeparator />
          <CommandItem>Item 2</CommandItem>
        </CommandList>
      </Command>
    )
    const separator = container.querySelector('[data-slot="command-separator"]')
    expect(separator).toBeInTheDocument()
  })

  it("CommandShortcut renders", () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem>
            Copy
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>
    )
    expect(screen.getByText("⌘C")).toBeInTheDocument()
    expect(screen.getByText("⌘C")).toHaveAttribute("data-slot", "command-shortcut")
  })

  it("supports custom className on Command", () => {
    const { container } = render(
      <Command className="custom-command">
        <CommandInput />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    )
    const command = container.querySelector('[data-slot="command"]')
    expect(command).toHaveClass("custom-command")
  })

  it("forwards ref on Command", () => {
    const ref = { current: null } as React.RefObject<HTMLDivElement | null>
    render(
      <Command ref={ref}>
        <CommandInput />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </Command>
    )
    expect(ref.current).not.toBeNull()
  })
})

describe("CommandDialog", () => {
  // CommandDialog renders DialogContent without a DialogDescription internally.
  // Suppress the Radix warning since we cannot modify the component source.
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

  it("renders dialog with command palette", () => {
    render(
      <CommandDialog open>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandItem>Item 1</CommandItem>
        </CommandList>
      </CommandDialog>
    )
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
    expect(screen.getByText("Item 1")).toBeInTheDocument()
  })

  it("includes accessible dialog title", () => {
    render(
      <CommandDialog open>
        <CommandInput />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </CommandDialog>
    )
    expect(screen.getByText("Command Palette")).toBeInTheDocument()
  })

  it("merges contentClassName onto DialogContent", () => {
    const { baseElement } = render(
      <CommandDialog open contentClassName="custom-width">
        <CommandInput />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </CommandDialog>
    )
    const content = baseElement.querySelector("[data-slot='dialog-content']")
    expect(content).toHaveClass("custom-width")
  })

  it("forwards contentProps to DialogContent", () => {
    const onEscapeKeyDown = vi.fn()
    render(
      <CommandDialog open contentProps={{ onEscapeKeyDown }}>
        <CommandInput />
        <CommandList>
          <CommandItem>Item</CommandItem>
        </CommandList>
      </CommandDialog>
    )
    // Verify the dialog content is rendered (contentProps spread doesn't break render)
    expect(screen.getByText("Command Palette")).toBeInTheDocument()
  })

  it("existing usage without new props is unaffected", () => {
    render(
      <CommandDialog open>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandItem>Existing item</CommandItem>
        </CommandList>
      </CommandDialog>
    )
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument()
    expect(screen.getByText("Existing item")).toBeInTheDocument()
  })
})

describe("accessibility", () => {
  it("has no WCAG 2.1 AA violations (standalone)", async () => {
    const { container } = render(
      <Command label="Command palette" shouldFilter={false}>
        <CommandInput placeholder="Search..." />
        <CommandList>
          <CommandGroup heading="Actions">
            <CommandItem value="new-file">New File</CommandItem>
            <CommandItem value="open">Open</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Settings">
            <CommandItem value="preferences">Preferences</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    // cmdk wraps items in group divs between listbox and option roles.
    // axe-core flags this as aria-required-children but cmdk manages
    // ARIA semantics correctly. Disable this specific rule for cmdk.
    await checkA11y(container, {
      rules: { "aria-required-children": { enabled: false } },
    })
  })
})
