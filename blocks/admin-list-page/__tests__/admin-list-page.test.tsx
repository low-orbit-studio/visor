import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import type { ColumnDef } from "@tanstack/react-table"
import { AdminListPage } from "../admin-list-page"
import { checkA11y } from "../../../test-utils/a11y"

interface RowData {
  id: string
  name: string
  role: string
}

const columns: ColumnDef<RowData, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
]

const data: RowData[] = [
  { id: "1", name: "Alice", role: "Admin" },
  { id: "2", name: "Bob", role: "Editor" },
  { id: "3", name: "Carol", role: "Viewer" },
]

describe("AdminListPage", () => {
  // ─── Rendering ──────────────────────────────────────────────────────

  it("renders without crashing", () => {
    const { container } = render(
      <AdminListPage title="Users" columns={columns} data={data} />
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it("renders the page title", () => {
    render(<AdminListPage title="Users" columns={columns} data={data} />)
    expect(screen.getByText("Users")).toBeInTheDocument()
  })

  it("renders eyebrow when provided", () => {
    render(
      <AdminListPage title="Users" eyebrow="Admin Panel" columns={columns} data={data} />
    )
    expect(screen.getByText("Admin Panel")).toBeInTheDocument()
  })

  it("renders description when provided", () => {
    render(
      <AdminListPage
        title="Users"
        description="Manage your team members."
        columns={columns}
        data={data}
      />
    )
    expect(screen.getByText("Manage your team members.")).toBeInTheDocument()
  })

  it("renders data rows", () => {
    render(<AdminListPage title="Users" columns={columns} data={data} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("Carol")).toBeInTheDocument()
  })

  // ─── Filter bar ──────────────────────────────────────────────────────

  it("renders filter bar by default", () => {
    const { container } = render(
      <AdminListPage title="Users" columns={columns} data={data} />
    )
    // FilterBar renders a search input
    expect(container.querySelector("[data-slot='admin-list-page-header']")).toBeInTheDocument()
  })

  it("hides filter bar when hideFilterBar=true", () => {
    render(
      <AdminListPage title="Users" columns={columns} data={data} hideFilterBar />
    )
    // When FilterBar is hidden there should be no search input
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument()
  })

  it("calls onSearchChange when search input changes", async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        searchValue=""
        onSearchChange={onSearchChange}
        searchPlaceholder="Search users..."
      />
    )
    const input = screen.getByPlaceholderText("Search users...")
    await user.type(input, "A")
    expect(onSearchChange).toHaveBeenCalled()
  })

  it("renders resultsCount when provided", () => {
    render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        resultsCount="3 results"
      />
    )
    expect(screen.getByText("3 results")).toBeInTheDocument()
  })

  // ─── data-slot ──────────────────────────────────────────────────────

  it("sets data-slot on the root element", () => {
    const { container } = render(
      <AdminListPage title="Users" columns={columns} data={data} />
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "admin-list-page")
  })

  // ─── className passthrough ──────────────────────────────────────────

  it("applies custom className to root element", () => {
    const { container } = render(
      <AdminListPage title="Users" columns={columns} data={data} className="custom" />
    )
    expect(container.firstChild).toHaveClass("custom")
  })

  // ─── customFilterBar slot ───────────────────────────────────────────

  it("renders customFilterBar in place of FilterBar when provided", () => {
    const { container } = render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        customFilterBar={
          <div data-testid="custom-bar">Custom filter UI</div>
        }
      />
    )
    expect(screen.getByTestId("custom-bar")).toBeInTheDocument()
    // The default FilterBar's searchbox should not render.
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument()
    // Wrapper slot exists for CSS hooks.
    expect(
      container.querySelector(
        "[data-slot='admin-list-page-custom-filter-bar']"
      )
    ).toBeInTheDocument()
  })

  it("renders default FilterBar when customFilterBar is omitted (backwards compat)", () => {
    const { container } = render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        searchValue=""
        onSearchChange={vi.fn()}
      />
    )
    // FilterBar still drives the searchbox.
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
    // Custom slot wrapper is absent.
    expect(
      container.querySelector(
        "[data-slot='admin-list-page-custom-filter-bar']"
      )
    ).not.toBeInTheDocument()
  })

  it("hideFilterBar wins over customFilterBar", () => {
    render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        hideFilterBar
        customFilterBar={
          <div data-testid="custom-bar">Custom filter UI</div>
        }
      />
    )
    expect(screen.queryByTestId("custom-bar")).not.toBeInTheDocument()
  })

  it("dev-mode warns when customFilterBar is mixed with FilterBar-specific props", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        searchValue=""
        onSearchChange={vi.fn()}
        customFilterBar={<div>Custom</div>}
      />
    )
    expect(warnSpy).toHaveBeenCalled()
    const message = warnSpy.mock.calls[0]?.[0] as string
    expect(message).toMatch(/customFilterBar/)
    expect(message).toMatch(/searchValue/)
    warnSpy.mockRestore()
  })

  it("does not warn when customFilterBar is used without FilterBar props", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        customFilterBar={<div>Custom</div>}
      />
    )
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  // ─── footerStatus slot ──────────────────────────────────────────────

  it("renders footerStatus below the table when provided", () => {
    const { container } = render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        footerStatus={
          <div data-testid="footer-status">1 selected · 3 of 3</div>
        }
      />
    )
    expect(screen.getByTestId("footer-status")).toBeInTheDocument()
    const wrapper = container.querySelector(
      "[data-slot='admin-list-page-footer-status']"
    )
    expect(wrapper).toBeInTheDocument()
    // Footer wrapper lives inside the table section, not the header.
    const tableSection = container.querySelector(
      "[data-slot='admin-list-page-table']"
    )
    expect(tableSection?.contains(wrapper)).toBe(true)
  })

  it("does not render footerStatus wrapper when omitted (backwards compat)", () => {
    const { container } = render(
      <AdminListPage title="Users" columns={columns} data={data} />
    )
    expect(
      container.querySelector("[data-slot='admin-list-page-footer-status']")
    ).not.toBeInTheDocument()
  })

  it("renders footerStatus + bulkActions together without collision", () => {
    const { container } = render(
      <AdminListPage
        title="Users"
        columns={columns}
        data={data}
        enableRowSelection
        rowSelection={{ "1": true }}
        bulkActions={<button type="button">Archive</button>}
        footerStatus={
          <div data-testid="footer-status">1 selected · 3 of 3</div>
        }
      />
    )
    expect(screen.getByTestId("footer-status")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Archive" })
    ).toBeInTheDocument()
    // Footer is the last child of the table section (sits below BulkActionBar).
    const tableSection = container.querySelector(
      "[data-slot='admin-list-page-table']"
    )
    const footerWrapper = container.querySelector(
      "[data-slot='admin-list-page-footer-status']"
    )
    expect(tableSection).not.toBeNull()
    expect(footerWrapper).not.toBeNull()
    if (tableSection && footerWrapper) {
      const children = Array.from(tableSection.children)
      const footerIndex = children.indexOf(footerWrapper)
      expect(footerIndex).toBe(children.length - 1)
    }
  })

  // ─── A11y ───────────────────────────────────────────────────────────

  it("passes accessibility checks", async () => {
    const { container } = render(
      <AdminListPage
        title="Users"
        description="Manage your team members."
        columns={columns}
        data={data}
        searchValue=""
        onSearchChange={vi.fn()}
      />
    )
    await checkA11y(container)
  })

  it("passes accessibility checks with customFilterBar and footerStatus", async () => {
    const { container } = render(
      <AdminListPage
        title="Users"
        description="Manage your team members."
        columns={columns}
        data={data}
        customFilterBar={
          <div role="toolbar" aria-label="Filters">
            <button type="button">Add filter</button>
          </div>
        }
        footerStatus={
          <div>
            <span>0 selected · 3 of 3</span>
          </div>
        }
      />
    )
    await checkA11y(container)
  })
})
