import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, beforeAll } from "vitest"
import {
  Sidebar,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "../sidebar"

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
  // Radix Popper measures with ResizeObserver
  ;(globalThis as { ResizeObserver?: unknown }).ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

function Rail({
  collapsible = "icon",
  defaultOpen = false,
  tooltip = "Inbox",
  buttonProps = {},
  providerProps = {},
}: {
  collapsible?: "icon" | "none" | "offcanvas"
  defaultOpen?: boolean
  tooltip?: React.ComponentProps<typeof SidebarMenuButton>["tooltip"]
  buttonProps?: React.ComponentProps<typeof SidebarMenuButton>
  providerProps?: Partial<React.ComponentProps<typeof SidebarProvider>>
}) {
  return (
    <SidebarProvider defaultOpen={defaultOpen} {...providerProps}>
      <Sidebar collapsible={collapsible} position="contained" data-testid="sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={tooltip} {...buttonProps}>
              <a href="/inbox">
                <svg aria-hidden="true" />
              </a>
            </SidebarMenuButton>
            <SidebarMenuBadge data-testid="dot" aria-hidden="true" />
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
    </SidebarProvider>
  )
}

describe("SidebarMenuButton asChild", () => {
  it("renders the child as the item and keeps the button treatment", () => {
    render(<Rail />)
    const link = screen.getByRole("link", { name: "Inbox" })
    expect(link.tagName).toBe("A")
    expect(link).toHaveAttribute("href", "/inbox")
    expect(link).toHaveAttribute("data-slot", "sidebar-menu-button")
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("keeps the badge a sibling of the item", () => {
    render(<Rail />)
    expect(screen.getByTestId("dot").parentElement).toBe(
      screen.getByRole("link").parentElement
    )
  })

  it("does not leak asChild or tooltip onto the DOM", () => {
    render(<Rail />)
    const link = screen.getByRole("link")
    expect(link).not.toHaveAttribute("aschild")
    expect(link).not.toHaveAttribute("tooltip")
  })
})

describe("SidebarMenuButton tooltip", () => {
  it("names an icon-only button from the tooltip string", () => {
    render(<Rail />)
    expect(screen.getByRole("link", { name: "Inbox" })).toHaveAttribute(
      "aria-label",
      "Inbox"
    )
  })

  it("names a rail button from a string in the object form", () => {
    render(<Rail tooltip={{ children: "Inbox, 3 unread", side: "bottom" }} />)
    expect(screen.getByRole("link", { name: "Inbox, 3 unread" })).toBeInTheDocument()
  })

  it("keeps the consumer's own aria-label", () => {
    render(<Rail buttonProps={{ "aria-label": "Open inbox" }} />)
    expect(screen.getByRole("link", { name: "Open inbox" })).toBeInTheDocument()
  })

  it("does not rename the button while the sidebar is expanded", () => {
    render(<Rail defaultOpen />)
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-label")
  })

  it("opens on keyboard focus when collapsed to icons, portaled into the sidebar", async () => {
    render(<Rail />)
    await act(async () => {
      screen.getByRole("link").focus()
    })
    const tip = await screen.findByRole("tooltip")
    expect(tip).toHaveTextContent("Inbox")
    expect(screen.getByTestId("sidebar")).toContainElement(tip)
  })

  it("honours an explicit container", async () => {
    const host = document.createElement("div")
    host.dataset.testid = "host"
    document.body.appendChild(host)
    render(<Rail tooltip={{ children: "Inbox", container: host }} />)
    await act(async () => {
      screen.getByRole("link").focus()
    })
    expect(host).toContainElement(await screen.findByRole("tooltip"))
    host.remove()
  })

  it("opens for a collapsible=none rail", async () => {
    render(<Rail collapsible="none" />)
    await act(async () => {
      screen.getByRole("link").focus()
    })
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Inbox")
  })

  it("stays closed while the sidebar is expanded", async () => {
    render(<Rail defaultOpen />)
    await act(async () => {
      screen.getByRole("link").focus()
    })
    expect(screen.queryByRole("tooltip")).toBeNull()
  })

  it("is a plain button with no tooltip prop", () => {
    render(
      <SidebarProvider>
        <Sidebar collapsible="none">
          <SidebarMenuButton>Go</SidebarMenuButton>
        </Sidebar>
      </SidebarProvider>
    )
    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument()
  })
})

describe("position", () => {
  it("defaults to fixed and offers contained", () => {
    const { rerender } = render(
      <SidebarProvider>
        <Sidebar data-testid="s" />
      </SidebarProvider>
    )
    expect(screen.getByTestId("s")).toHaveAttribute("data-position", "fixed")
    rerender(
      <SidebarProvider>
        <Sidebar data-testid="s" position="contained" />
      </SidebarProvider>
    )
    expect(screen.getByTestId("s")).toHaveAttribute("data-position", "contained")
  })
})

describe("Cmd/Ctrl+B", () => {
  function press() {
    const event = new KeyboardEvent("keydown", {
      key: "b",
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
    act(() => {
      window.dispatchEvent(event)
    })
    return event
  }

  it("toggles a collapsible sidebar and prevents the browser default", () => {
    render(<Rail />)
    const event = press()
    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-state", "expanded")
  })

  it("is left alone when only collapsible=none sidebars are mounted", () => {
    render(<Rail collapsible="none" />)
    expect(press().defaultPrevented).toBe(false)
  })

  it("can be turned off", () => {
    render(<Rail providerProps={{ keyboardShortcut: false }} />)
    const event = press()
    expect(event.defaultPrevented).toBe(false)
    expect(screen.getByTestId("sidebar")).toHaveAttribute("data-state", "collapsed")
  })
})

// VI-683: .sidebarContent clips overflow, so the focus ring must sit inside the
// button or the 48px rail shows only a bottom line (WCAG 2.4.7). jsdom has no
// layout, so the contract is asserted on the CSS source.
describe("menu button focus ring on the rail", () => {
  const css = readFileSync(
    join(process.cwd(), "components/ui/sidebar/sidebar.module.css"),
    "utf-8"
  )
  const block = css.match(/\.menuButton:focus-visible \{([^}]*)\}/)?.[1] ?? ""

  it("draws the ring inset by its width plus the offset token", () => {
    expect(block).toContain("outline: var(--focus-ring-width, 2px) solid")
    expect(block).toContain("outline-offset: calc(-1 * (var(--focus-ring-width, 2px) + var(--focus-ring-offset, 0px)));")
  })
})
