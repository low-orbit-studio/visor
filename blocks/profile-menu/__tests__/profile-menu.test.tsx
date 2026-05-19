import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { BuildingsIcon } from "@phosphor-icons/react"
import {
  ProfileMenu,
  defaultProfileMenuItems,
  type ProfileMenuItem,
  type ProfileMenuUser,
} from "../profile-menu"
import { AdminShell } from "../../admin-shell/admin-shell"
import { checkA11y } from "../../../test-utils/a11y"

const user: ProfileMenuUser = {
  name: "Justin Schier",
  email: "justin@loworbit.studio",
  initials: "JS",
  status: "online",
}

const baselineItems: ProfileMenuItem[] = [
  { type: "item", label: "Account settings" },
  { type: "item", label: "Notifications", badge: 3 },
  { type: "separator" },
  { type: "label", text: "Workspace" },
  { type: "item", label: "Keyboard shortcuts", shortcut: "⌘/" },
  { type: "item", label: "Sign out", variant: "destructive", shortcut: "⌘⇧Q" },
]

function renderMenu(
  overrides?: Partial<React.ComponentProps<typeof ProfileMenu>>
) {
  const utils = render(
    <ProfileMenu
      user={user}
      context={{ label: "ENTR · Owner", icon: <BuildingsIcon /> }}
      items={baselineItems}
      side="bottom"
      {...overrides}
    />
  )
  return utils
}

describe("ProfileMenu", () => {
  // ─── Rendering: trigger ────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = renderMenu()
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the user name in the trigger", () => {
    renderMenu()
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("Justin Schier")).toBeInTheDocument()
  })

  it("renders the context line when provided", () => {
    renderMenu()
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("ENTR · Owner")).toBeInTheDocument()
  })

  it("omits the context line when context is undefined", () => {
    renderMenu({ context: undefined })
    const trigger = screen.getByRole("button")
    expect(within(trigger).queryByText("ENTR · Owner")).not.toBeInTheDocument()
  })

  it("renders initials fallback when avatarUrl is absent", () => {
    renderMenu()
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("JS")).toBeInTheDocument()
  })

  it("derives initials from name when initials are not provided", () => {
    renderMenu({ user: { name: "Veronica Smith" } })
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("VS")).toBeInTheDocument()
  })

  it("renders the status dot with an accessible label when status is set", () => {
    renderMenu()
    const trigger = screen.getByRole("button")
    const status = within(trigger).getByRole("img", { name: "Online" })
    expect(status).toHaveAttribute("data-status", "online")
  })

  it("uses the matching label for each status", () => {
    const cases: Array<{ status: ProfileMenuUser["status"]; label: string }> = [
      { status: "away", label: "Away" },
      { status: "busy", label: "Busy" },
      { status: "offline", label: "Offline" },
    ]
    for (const { status, label } of cases) {
      const { unmount } = renderMenu({
        user: { ...user, status },
      })
      const trigger = screen.getByRole("button")
      expect(within(trigger).getByRole("img", { name: label })).toBeInTheDocument()
      unmount()
    }
  })

  it("omits the status dot when status is undefined", () => {
    renderMenu({ user: { ...user, status: undefined } })
    const trigger = screen.getByRole("button")
    expect(within(trigger).queryByRole("img")).not.toBeInTheDocument()
  })

  it("includes the user name in the accessible label", () => {
    renderMenu()
    const trigger = screen.getByRole("button", {
      name: /Account menu.*Justin Schier/i,
    })
    expect(trigger).toBeInTheDocument()
  })

  it("forwards className to the trigger button", () => {
    renderMenu({ className: "custom-trigger" })
    const trigger = screen.getByRole("button")
    expect(trigger).toHaveClass("custom-trigger")
  })

  // ─── Menu: opening + items ──────────────────────────────────────────

  it("opens the menu when the trigger is clicked", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("renders all item entries", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("Account settings")).toBeInTheDocument()
    expect(within(menu).getByText("Notifications")).toBeInTheDocument()
    expect(within(menu).getByText("Keyboard shortcuts")).toBeInTheDocument()
    expect(within(menu).getByText("Sign out")).toBeInTheDocument()
  })

  it("renders separator entries", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(menu.querySelector('[data-slot="dropdown-menu-separator"]')).toBeInTheDocument()
  })

  it("renders label entries", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("Workspace")).toBeInTheDocument()
  })

  it("renders the email header when email is provided", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("Signed in as")).toBeInTheDocument()
    expect(within(menu).getByText("justin@loworbit.studio")).toBeInTheDocument()
  })

  it("omits the email header when email is undefined", async () => {
    const user_ = userEvent.setup()
    renderMenu({ user: { ...user, email: undefined } })
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).queryByText("Signed in as")).not.toBeInTheDocument()
  })

  it("renders shortcut text on items that have a shortcut", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("⌘/")).toBeInTheDocument()
    expect(within(menu).getByText("⌘⇧Q")).toBeInTheDocument()
  })

  it("renders badge content on items that have a badge", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    const notifications = within(menu)
      .getByText("Notifications")
      .closest('[role="menuitem"]')
    expect(notifications).not.toBeNull()
    const badge = notifications?.querySelector('[data-slot="profile-menu-item-badge"]')
    expect(badge).toHaveTextContent("3")
  })

  it("applies the destructive variant via data attribute", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    const signOut = within(menu)
      .getByText("Sign out")
      .closest('[role="menuitem"]')
    expect(signOut).toHaveAttribute("data-variant", "destructive")
  })

  it("calls item.onSelect when an item is activated", async () => {
    const user_ = userEvent.setup()
    const onSelect = vi.fn()
    renderMenu({
      items: [
        { type: "item", label: "Account settings", onSelect },
      ],
    })
    await user_.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    await user_.click(within(menu).getByText("Account settings"))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  // ─── Admin-shell integration ────────────────────────────────────────

  it("renders inside the admin-shell sidebarFooter slot", () => {
    const { container } = render(
      <AdminShell
        sidebarNav={<nav aria-label="Sidebar"><a href="/home">Home</a></nav>}
        sidebarFooter={
          <ProfileMenu user={user} items={baselineItems} side="bottom" />
        }
      >
        <div>Main</div>
      </AdminShell>
    )
    const footer = container.querySelector(
      '[data-slot="admin-shell-sidebar-footer"]'
    )
    expect(footer).not.toBeNull()
    const trigger = footer?.querySelector('[data-slot="profile-menu-trigger"]')
    expect(trigger).not.toBeNull()
  })

  // ─── Keyboard navigation ────────────────────────────────────────────

  it("opens via keyboard (Enter on focused trigger)", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    const trigger = screen.getByRole("button")
    trigger.focus()
    await user_.keyboard("{Enter}")
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("closes on Escape", async () => {
    const user_ = userEvent.setup()
    renderMenu()
    await user_.click(screen.getByRole("button"))
    await screen.findByRole("menu")
    await user_.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  // ─── Global shortcut (⌘⇧Q) ──────────────────────────────────────────

  it("registers a window-level ⌘⇧Q handler when enableGlobalShortcuts is true", async () => {
    const user_ = userEvent.setup()
    const onSignOut = vi.fn()
    renderMenu({ enableGlobalShortcuts: true, onSignOut })
    await user_.keyboard("{Meta>}{Shift>}q{/Shift}{/Meta}")
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it("does not register a global handler when enableGlobalShortcuts is false", async () => {
    const user_ = userEvent.setup()
    const onSignOut = vi.fn()
    renderMenu({ enableGlobalShortcuts: false, onSignOut })
    await user_.keyboard("{Meta>}{Shift>}q{/Shift}{/Meta}")
    expect(onSignOut).not.toHaveBeenCalled()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks (closed state)", async () => {
    const { container } = renderMenu()
    await checkA11y(container)
  })
})

describe("defaultProfileMenuItems", () => {
  it("returns 6 item entries plus one separator", () => {
    const items = defaultProfileMenuItems(user)
    const itemEntries = items.filter((i) => i.type === "item")
    const separators = items.filter((i) => i.type === "separator")
    expect(itemEntries).toHaveLength(6)
    expect(separators).toHaveLength(1)
  })

  it("returns the baseline labels in order", () => {
    const items = defaultProfileMenuItems(user)
    const labels = items
      .filter((i): i is Extract<ProfileMenuItem, { type: "item" }> => i.type === "item")
      .map((i) => i.label)
    expect(labels).toEqual([
      "Account settings",
      "Notifications",
      "Appearance",
      "Keyboard shortcuts",
      "Help & docs",
      "Sign out",
    ])
  })

  it("marks the Sign out entry as destructive with the ⌘⇧Q shortcut", () => {
    const items = defaultProfileMenuItems(user)
    const signOut = items
      .filter((i): i is Extract<ProfileMenuItem, { type: "item" }> => i.type === "item")
      .find((i) => i.label === "Sign out")
    expect(signOut?.variant).toBe("destructive")
    expect(signOut?.shortcut).toBe("⌘⇧Q")
  })

  it("wires opts.onSignOut to the Sign out entry", () => {
    const onSignOut = vi.fn()
    const items = defaultProfileMenuItems(user, { onSignOut })
    const signOut = items
      .filter((i): i is Extract<ProfileMenuItem, { type: "item" }> => i.type === "item")
      .find((i) => i.label === "Sign out")
    signOut?.onSelect?.()
    expect(onSignOut).toHaveBeenCalledTimes(1)
  })

  it("populates the Notifications badge when opts.notificationCount > 0", () => {
    const items = defaultProfileMenuItems(user, { notificationCount: 3 })
    const notifications = items
      .filter((i): i is Extract<ProfileMenuItem, { type: "item" }> => i.type === "item")
      .find((i) => i.label === "Notifications")
    expect(notifications?.badge).toBe(3)
  })

  it("omits the badge when opts.notificationCount is 0 or undefined", () => {
    const zero = defaultProfileMenuItems(user, { notificationCount: 0 })
    const undef = defaultProfileMenuItems(user)
    const notificationsZero = zero
      .filter((i): i is Extract<ProfileMenuItem, { type: "item" }> => i.type === "item")
      .find((i) => i.label === "Notifications")
    const notificationsUndef = undef
      .filter((i): i is Extract<ProfileMenuItem, { type: "item" }> => i.type === "item")
      .find((i) => i.label === "Notifications")
    expect(notificationsZero?.badge).toBeUndefined()
    expect(notificationsUndef?.badge).toBeUndefined()
  })
})
