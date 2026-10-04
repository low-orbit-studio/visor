import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CalendarDots, Gear, Tray, UsersThree } from "@phosphor-icons/react"
import { BottomNav, bottomNavItemName } from "../bottom-nav"
import type { BottomNavItem } from "../bottom-nav"

const items: BottomNavItem[] = [
  { label: "Edit", icon: CalendarDots, href: "/edit", active: true },
  { label: "Inbox", icon: Tray, href: "/inbox", mark: 3 },
  { label: "Team", icon: UsersThree, href: "/team", group: "admin" },
  { label: "Settings", icon: Gear, group: "admin", onSelect: () => {} },
]

afterEach(() => {
  cleanup()
  document.documentElement.style.removeProperty("--bottom-nav-height")
  vi.restoreAllMocks()
})

describe("BottomNav", () => {
  it("renders a labelled nav landmark with one destination per item", () => {
    render(<BottomNav aria-label="Workspace" items={items} />)
    expect(screen.getByRole("navigation", { name: "Workspace" })).toBeInTheDocument()
    expect(screen.getAllByRole("listitem").filter((li) => li.getAttribute("aria-hidden") !== "true")).toHaveLength(4)
  })

  it("renders an <a> for href and a <button> without one", () => {
    render(<BottomNav aria-label="Workspace" items={items} />)
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("href", "/edit")
    expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("type", "button")
  })

  describe("active state", () => {
    it("marks only the active destination aria-current=page", () => {
      render(<BottomNav aria-label="Workspace" items={items} />)
      expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("aria-current", "page")
      expect(screen.getByRole("link", { name: /Inbox/ })).not.toHaveAttribute("aria-current")
      expect(document.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
    })

    it("fills the active icon, so colour is not the only cue", () => {
      render(<BottomNav aria-label="Workspace" items={items} />)
      const active = screen.getByRole("link", { name: "Edit" }).querySelector("svg")
      const idle = screen.getByRole("link", { name: /Inbox/ }).querySelector("svg")
      expect(active?.innerHTML).not.toBe(idle?.innerHTML)
      expect(active).toHaveAttribute("aria-hidden", "true")
    })
  })

  describe("mark", () => {
    it("composes the count into the accessible name", () => {
      render(<BottomNav aria-label="Workspace" items={items} />)
      expect(screen.getByRole("link", { name: "Inbox, 3 unread" })).toBeInTheDocument()
    })

    it("draws a solid dot that is hidden from assistive tech and carries no number", () => {
      render(<BottomNav aria-label="Workspace" items={items} />)
      const dot = document.querySelector('[data-slot="bottom-nav-mark"]')
      expect(dot).toHaveAttribute("aria-hidden", "true")
      expect(dot).toHaveTextContent("")
      expect(document.querySelectorAll('[data-slot="bottom-nav-mark"]')).toHaveLength(1)
    })

    it("names a bare mark and a custom markLabel", () => {
      expect(bottomNavItemName({ label: "Inbox", icon: Tray, mark: true })).toBe("Inbox, unread")
      expect(
        bottomNavItemName({ label: "Inbox", icon: Tray, mark: 2, markLabel: "new" }),
      ).toBe("Inbox, 2 new")
    })

    it("draws nothing and leaves the name alone for 0 and false", () => {
      render(
        <BottomNav
          aria-label="Workspace"
          items={[
            { label: "Inbox", icon: Tray, href: "/a", mark: 0 },
            { label: "Team", icon: UsersThree, href: "/b", mark: false },
          ]}
        />,
      )
      expect(screen.getByRole("link", { name: "Inbox" })).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Team" })).toBeInTheDocument()
      expect(document.querySelector('[data-slot="bottom-nav-mark"]')).toBeNull()
    })
  })

  describe("labels", () => {
    it("keeps labels in the DOM but visually hidden by default", () => {
      render(<BottomNav aria-label="Workspace" items={items} />)
      expect(screen.getByText("Edit")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: "Edit" })).not.toHaveAttribute("data-labelled")
    })

    it("flags labelled bars when showLabels is set", () => {
      render(<BottomNav aria-label="Workspace" items={items} showLabels />)
      expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute("data-labelled", "true")
    })
  })

  describe("group break", () => {
    it("draws one hairline where the group changes, hidden from assistive tech", () => {
      render(<BottomNav aria-label="Workspace" items={items} />)
      const breaks = document.querySelectorAll('[data-slot="bottom-nav-group"]')
      expect(breaks).toHaveLength(1)
      expect(breaks[0]).toHaveAttribute("aria-hidden", "true")
      expect(breaks[0]).toHaveAttribute("role", "presentation")
      expect(breaks[0].nextElementSibling).toHaveTextContent("Team")
    })

    it("draws no break when no item has a group", () => {
      render(<BottomNav aria-label="Workspace" items={items.map(({ group: _g, ...rest }) => rest)} />)
      expect(document.querySelector('[data-slot="bottom-nav-group"]')).toBeNull()
    })
  })

  describe("selection", () => {
    it("fires onSelect from a button and from a link", async () => {
      const user = userEvent.setup()
      const onButton = vi.fn()
      const onLink = vi.fn((e: React.MouseEvent) => e.preventDefault())
      render(
        <BottomNav
          aria-label="Workspace"
          items={[
            { label: "Edit", icon: CalendarDots, href: "/edit", onSelect: onLink },
            { label: "Settings", icon: Gear, onSelect: onButton },
          ]}
        />,
      )
      await user.click(screen.getByRole("link", { name: "Edit" }))
      await user.click(screen.getByRole("button", { name: "Settings" }))
      expect(onLink).toHaveBeenCalledTimes(1)
      expect(onButton).toHaveBeenCalledTimes(1)
    })

    it("reaches every destination by keyboard", async () => {
      const user = userEvent.setup()
      render(<BottomNav aria-label="Workspace" items={items} />)
      await user.tab()
      expect(screen.getByRole("link", { name: "Edit" })).toHaveFocus()
      await user.tab()
      expect(screen.getByRole("link", { name: "Inbox, 3 unread" })).toHaveFocus()
    })
  })

  describe("height token (WCAG 2.4.11)", () => {
    it("publishes --bottom-nav-height on the document root, and removes it on unmount", () => {
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        height: 64,
      } as DOMRect)
      const { unmount } = render(<BottomNav aria-label="Workspace" items={items} />)
      expect(document.documentElement.style.getPropertyValue("--bottom-nav-height")).toBe("64px")
      unmount()
      expect(document.documentElement.style.getPropertyValue("--bottom-nav-height")).toBe("")
    })

    it("publishes nothing when the bar is not fixed", () => {
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        height: 64,
      } as DOMRect)
      render(<BottomNav aria-label="Workspace" items={items} fixed={false} />)
      expect(document.documentElement.style.getPropertyValue("--bottom-nav-height")).toBe("")
    })
  })

  it("forwards ref and className to the nav", () => {
    const ref = { current: null as HTMLElement | null }
    render(<BottomNav aria-label="Workspace" items={items} ref={ref} className="custom" />)
    expect(ref.current).toBe(screen.getByRole("navigation"))
    expect(ref.current).toHaveClass("custom")
  })
})
