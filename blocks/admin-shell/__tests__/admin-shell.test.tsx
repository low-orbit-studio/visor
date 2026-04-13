import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
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
})
