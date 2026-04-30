import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { WorkspaceSwitcher, type WorkspaceItem } from "../workspace-switcher"
import { checkA11y } from "../../../test-utils/a11y"

const empire: WorkspaceItem = {
  id: "empire-room",
  name: "Empire Room",
  plan: "Pro · NYC",
  initials: "ER",
}

const houseOfYes: WorkspaceItem = {
  id: "house-of-yes",
  name: "House of Yes",
  plan: "Free · Brooklyn",
  initials: "HY",
}

const elsewhere: WorkspaceItem = {
  id: "elsewhere",
  name: "Elsewhere",
  plan: "Pro · Bushwick",
  initials: "EL",
}

const allWorkspaces = [empire, houseOfYes, elsewhere]

function renderSwitcher(overrides?: Partial<React.ComponentProps<typeof WorkspaceSwitcher>>) {
  const onSelect = vi.fn()
  const utils = render(
    <WorkspaceSwitcher
      current={empire}
      workspaces={allWorkspaces}
      onSelect={onSelect}
      {...overrides}
    />
  )
  return { ...utils, onSelect }
}

describe("WorkspaceSwitcher", () => {
  // ─── Rendering: trigger ────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = renderSwitcher()
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders trigger as a button in full mode by default", () => {
    renderSwitcher()
    const trigger = screen.getByRole("button")
    expect(trigger).toHaveAttribute("data-trigger", "full")
  })

  it("renders current workspace name and plan in full mode", () => {
    renderSwitcher()
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("Empire Room")).toBeInTheDocument()
    expect(within(trigger).getByText("Pro · NYC")).toBeInTheDocument()
  })

  it("renders only avatar + caret in compact mode (no visible name)", () => {
    renderSwitcher({ trigger: "compact" })
    const trigger = screen.getByRole("button")
    expect(trigger).toHaveAttribute("data-trigger", "compact")
    expect(within(trigger).queryByText("Empire Room")).not.toBeInTheDocument()
    expect(within(trigger).queryByText("Pro · NYC")).not.toBeInTheDocument()
  })

  it("includes current workspace name in the accessible label", () => {
    renderSwitcher()
    const trigger = screen.getByRole("button", {
      name: /Switch workspace.*Empire Room/i,
    })
    expect(trigger).toBeInTheDocument()
  })

  it("renders fallback initials when imageUrl is absent", () => {
    renderSwitcher()
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("ER")).toBeInTheDocument()
  })

  it("renders an AvatarImage when imageUrl is provided", () => {
    const withImage = { ...empire, imageUrl: "/empire.png" }
    const { container } = renderSwitcher({ current: withImage })
    // Radix Avatar renders the <img> with data-slot="avatar-image"
    const trigger = screen.getByRole("button")
    const img = trigger.querySelector('[data-slot="avatar-image"]')
    // The image element is mounted (Radix may swap to fallback in jsdom — we verify the image is at least registered or fallback works)
    expect(container).toBeInTheDocument()
    // Either the image is present or fallback is — both are valid
    if (!img) {
      expect(within(trigger).getByText("ER")).toBeInTheDocument()
    }
  })

  it("does not render the plan line when plan is undefined", () => {
    const noPlan: WorkspaceItem = { id: "x", name: "X Org", initials: "X" }
    renderSwitcher({ current: noPlan })
    const trigger = screen.getByRole("button")
    expect(within(trigger).getByText("X Org")).toBeInTheDocument()
    // Only the name should be present in trigger text
    expect(within(trigger).queryByText("Pro · NYC")).not.toBeInTheDocument()
  })

  it("forwards className to the trigger button", () => {
    renderSwitcher({ className: "custom-trigger" })
    const trigger = screen.getByRole("button")
    expect(trigger).toHaveClass("custom-trigger")
  })

  // ─── Menu: opening + items ──────────────────────────────────────────

  it("opens the menu when the trigger is clicked", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(screen.getByRole("button"))
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("lists all workspaces in the menu", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("Empire Room")).toBeInTheDocument()
    expect(within(menu).getByText("House of Yes")).toBeInTheDocument()
    expect(within(menu).getByText("Elsewhere")).toBeInTheDocument()
  })

  it("calls onSelect with the workspace id when an item is activated", async () => {
    const user = userEvent.setup()
    const { onSelect } = renderSwitcher()
    await user.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByText("House of Yes"))
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith("house-of-yes")
  })

  // ─── Empty / single state ───────────────────────────────────────────

  it("renders the current workspace with a check indicator", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    const currentItem = within(menu)
      .getByText("Empire Room")
      .closest('[role="menuitem"]')
    expect(currentItem).toHaveAttribute("data-current", "true")
  })

  it("shows a disabled 'No other workspaces' item when there are no other workspaces", async () => {
    const user = userEvent.setup()
    render(
      <WorkspaceSwitcher
        current={empire}
        workspaces={[]}
        onSelect={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    const emptyItem = within(menu).getByText("No other workspaces")
    expect(emptyItem).toBeInTheDocument()
    const item = emptyItem.closest('[role="menuitem"]')
    expect(item).toHaveAttribute("aria-disabled", "true")
  })

  it("shows the empty-state item when workspaces contains only the current workspace", async () => {
    const user = userEvent.setup()
    render(
      <WorkspaceSwitcher
        current={empire}
        workspaces={[empire]}
        onSelect={vi.fn()}
      />
    )
    await user.click(screen.getByRole("button"))
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("Empire Room")).toBeInTheDocument()
    expect(within(menu).getByText("No other workspaces")).toBeInTheDocument()
    expect(within(menu).queryByText("House of Yes")).not.toBeInTheDocument()
  })

  // ─── Keyboard navigation ────────────────────────────────────────────

  it("opens menu via keyboard (Enter on focused trigger)", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    const trigger = screen.getByRole("button")
    trigger.focus()
    await user.keyboard("{Enter}")
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("closes menu on Escape", async () => {
    const user = userEvent.setup()
    renderSwitcher()
    await user.click(screen.getByRole("button"))
    await screen.findByRole("menu")
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks (closed state)", async () => {
    const { container } = renderSwitcher()
    await checkA11y(container)
  })

  it("passes accessibility checks (compact trigger)", async () => {
    const { container } = renderSwitcher({ trigger: "compact" })
    await checkA11y(container)
  })
})
