import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, it, expect, vi } from "vitest"
import { AdminShell } from "../admin-shell"
import { checkA11y } from "../../../test-utils/a11y"

const defaultProps = {
  sidebarNav: <nav aria-label="Sidebar nav"><a href="/home">Home</a></nav>,
  children: <div>Main content</div>,
}

describe("AdminShell", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(<AdminShell {...defaultProps} />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the main content", () => {
    render(<AdminShell {...defaultProps} />)
    expect(screen.getByText("Main content")).toBeInTheDocument()
  })

  it("renders the sidebar nav", () => {
    render(<AdminShell {...defaultProps} />)
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument()
  })

  it("renders the skip link", () => {
    render(<AdminShell {...defaultProps} />)
    expect(screen.getByText("Skip to main content")).toBeInTheDocument()
  })

  it("renders topbar by default", () => {
    const { container } = render(
      <AdminShell {...defaultProps} topbarEnd={<span>User menu</span>} />
    )
    expect(container.querySelector("[data-slot='admin-shell-topbar']")).toBeInTheDocument()
  })

  it("hides topbar when hideTopbar=true", () => {
    const { container } = render(
      <AdminShell {...defaultProps} hideTopbar />
    )
    expect(container.querySelector("[data-slot='admin-shell-topbar']")).not.toBeInTheDocument()
  })

  // ─── Slots ──────────────────────────────────────────────────────────

  it("renders logo slot when provided", () => {
    render(
      <AdminShell {...defaultProps} logo={<span>MyLogo</span>} />
    )
    expect(screen.getByText("MyLogo")).toBeInTheDocument()
  })

  it("renders sidebarFooter slot when provided", () => {
    render(
      <AdminShell {...defaultProps} sidebarFooter={<span>Footer content</span>} />
    )
    expect(screen.getByText("Footer content")).toBeInTheDocument()
  })

  it("renders breadcrumb in topbar", () => {
    render(
      <AdminShell {...defaultProps} breadcrumb={<span>Dashboard / Users</span>} />
    )
    expect(screen.getByText("Dashboard / Users")).toBeInTheDocument()
  })

  it("renders topbarEnd slot", () => {
    render(
      <AdminShell {...defaultProps} topbarEnd={<button>Profile</button>} />
    )
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument()
  })

  // ─── Data attributes ────────────────────────────────────────────────

  it("sets data-slot on the root element", () => {
    const { container } = render(<AdminShell {...defaultProps} />)
    expect(container.firstChild).toHaveAttribute("data-slot", "admin-shell")
  })

  it("sets data-padding on the main element", () => {
    const { container } = render(
      <AdminShell {...defaultProps} mainPadding="sm" />
    )
    const main = container.querySelector("[data-slot='admin-shell-main']")
    expect(main).toHaveAttribute("data-padding", "sm")
  })

  // ─── className passthrough ──────────────────────────────────────────

  it("applies custom className to the root element", () => {
    const { container } = render(
      <AdminShell {...defaultProps} className="custom-shell" />
    )
    expect(container.firstChild).toHaveClass("custom-shell")
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AdminShell
        logo={<span>Acme Inc</span>}
        sidebarNav={<nav aria-label="Sidebar nav"><a href="/home">Home</a><a href="/users">Users</a></nav>}
        sidebarFooter={<span>Logged in as admin</span>}
        topbarEnd={<button>Profile</button>}
      >
        <h1>Dashboard</h1>
        <p>Welcome to the admin panel.</p>
      </AdminShell>
    )
    await checkA11y(container)
  })

  // ─── Collapsible rail (VI-770) ──────────────────────────────────────

  describe("collapsible", () => {
    const railNav = (
      <a href="/home" title="Home">
        <svg aria-hidden="true" />
        <span data-admin-shell-label>Home</span>
      </a>
    )
    const sidebar = (c: HTMLElement) => c.querySelector("[data-slot='admin-shell-sidebar']")

    afterEach(() => window.localStorage.clear())

    it("draws no fold button and no data-collapsed unless collapsible", () => {
      const { container } = render(<AdminShell {...defaultProps} />)
      expect(screen.queryByRole("button", { name: /sidebar/ })).not.toBeInTheDocument()
      expect(container.firstChild).not.toHaveAttribute("data-collapsed")
    })

    it("folds and opens from the button, which keeps focus and follows the state", () => {
      const { container } = render(<AdminShell {...defaultProps} sidebarNav={railNav} collapsible />)
      const button = screen.getByRole("button", { name: "Collapse the sidebar" })
      expect(button).toHaveAttribute("aria-expanded", "true")
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")

      button.focus()
      fireEvent.click(button)
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")
      expect(container.firstChild).toHaveAttribute("data-collapsed", "true")
      expect(button).toHaveAttribute("aria-expanded", "false")
      expect(button).toHaveAccessibleName("Expand the sidebar")
      expect(button).toHaveFocus()
      // The label is hidden visually in the rail but still names the link.
      expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument()

      fireEvent.click(button)
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")
    })

    it("toggles with ⌘\\ or Ctrl+\\, and a configured key instead", () => {
      const { container, rerender } = render(<AdminShell {...defaultProps} collapsible />)
      fireEvent.keyDown(window, { key: "\\", metaKey: true })
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")
      fireEvent.keyDown(window, { key: "\\", ctrlKey: true })
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")
      fireEvent.keyDown(window, { key: "\\" })
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")

      rerender(<AdminShell {...defaultProps} collapsible collapseShortcut="j" />)
      fireEvent.keyDown(window, { key: "\\", metaKey: true })
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")
      fireEvent.keyDown(window, { key: "j", metaKey: true })
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")

      rerender(<AdminShell {...defaultProps} collapsible collapseShortcut={false} />)
      fireEvent.keyDown(window, { key: "j", metaKey: true })
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")
    })

    it("remembers the choice under storageKey", () => {
      const { container, unmount } = render(
        <AdminShell {...defaultProps} collapsible storageKey="test-sidebar" />
      )
      fireEvent.click(screen.getByRole("button", { name: "Collapse the sidebar" }))
      expect(window.localStorage.getItem("test-sidebar")).toBe("rail")
      unmount()

      const again = render(<AdminShell {...defaultProps} collapsible storageKey="test-sidebar" />)
      expect(sidebar(again.container)).toHaveAttribute("data-collapsed", "true")
      expect(sidebar(container)).toBeNull()
    })

    it("opens expanded when storage throws (private window)", () => {
      const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("blocked")
      })
      const set = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("blocked")
      })
      const { container } = render(<AdminShell {...defaultProps} collapsible storageKey="test-sidebar" />)
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")
      fireEvent.click(screen.getByRole("button", { name: "Collapse the sidebar" }))
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")
      spy.mockRestore()
      set.mockRestore()
    })

    it("starts from defaultCollapsed when nothing is remembered", () => {
      const { container } = render(<AdminShell {...defaultProps} collapsible defaultCollapsed />)
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")
    })

    it("follows a controlled collapsed prop and reports the next state", () => {
      const onCollapsedChange = vi.fn()
      const { container, rerender } = render(
        <AdminShell {...defaultProps} collapsible collapsed={false} onCollapsedChange={onCollapsedChange} />
      )
      fireEvent.click(screen.getByRole("button", { name: "Collapse the sidebar" }))
      expect(onCollapsedChange).toHaveBeenCalledWith(true)
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")

      rerender(<AdminShell {...defaultProps} collapsible collapsed onCollapsedChange={onCollapsedChange} />)
      expect(sidebar(container)).toHaveAttribute("data-collapsed", "true")
    })

    it("stays open with no button at phone width", () => {
      const original = window.matchMedia
      window.matchMedia = ((query: string) => ({
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia
      try {
        const { container } = render(<AdminShell {...defaultProps} collapsible defaultCollapsed />)
        expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")
        expect(screen.queryByRole("button", { name: /sidebar/ })).not.toBeInTheDocument()
        fireEvent.keyDown(window, { key: "\\", metaKey: true })
        expect(sidebar(container)).toHaveAttribute("data-collapsed", "false")
      } finally {
        window.matchMedia = original
      }
    })

    it("passes accessibility checks in the rail", async () => {
      const { container } = render(
        <AdminShell {...defaultProps} logo={<span>Acme</span>} sidebarNav={railNav} collapsible defaultCollapsed>
          <h1>Dashboard</h1>
        </AdminShell>
      )
      await checkA11y(container)
    })
  })
})
