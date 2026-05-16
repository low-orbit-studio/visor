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

  it("renders footerStatus below the table as a sibling of the table section", () => {
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
    // VI-404: footer wrapper is a sibling of the table section, NOT a child.
    const tableSection = container.querySelector(
      "[data-slot='admin-list-page-table']"
    )
    expect(tableSection?.contains(wrapper)).toBe(false)
    // Both live as direct children of the block root.
    const root = container.querySelector("[data-slot='admin-list-page']")
    expect(root).not.toBeNull()
    if (root && wrapper && tableSection) {
      expect(wrapper.parentElement).toBe(root)
      expect(tableSection.parentElement).toBe(root)
      // Footer renders AFTER the table section in document order.
      const rootChildren = Array.from(root.children)
      expect(rootChildren.indexOf(wrapper)).toBeGreaterThan(
        rootChildren.indexOf(tableSection)
      )
    }
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
    // VI-404: footer wrapper is a sibling of the table section (direct child
    // of the block root), rendered AFTER it. BulkActionBar stays inside the
    // table section as its last child.
    const root = container.querySelector("[data-slot='admin-list-page']")
    const tableSection = container.querySelector(
      "[data-slot='admin-list-page-table']"
    )
    const footerWrapper = container.querySelector(
      "[data-slot='admin-list-page-footer-status']"
    )
    expect(root).not.toBeNull()
    expect(tableSection).not.toBeNull()
    expect(footerWrapper).not.toBeNull()
    if (root && tableSection && footerWrapper) {
      // Footer is a sibling of the section, not a descendant.
      expect(tableSection.contains(footerWrapper)).toBe(false)
      expect(footerWrapper.parentElement).toBe(root)
      // Footer renders AFTER the table section in document order.
      const rootChildren = Array.from(root.children)
      expect(rootChildren.indexOf(footerWrapper)).toBeGreaterThan(
        rootChildren.indexOf(tableSection)
      )
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

  // ─── rows / rowTone / onRowClick passthrough (VI-390) ───────────────

  it("renders grouped rows when `rows` prop is provided", () => {
    const { container } = render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        rows={[
          { kind: "group", id: "admins", label: "Admins", count: 1 },
          { kind: "data", id: "1", row: data[0]! },
          { kind: "group", id: "editors", label: "Editors", count: 1 },
          { kind: "data", id: "2", row: data[1]! },
        ]}
      />
    )
    // Group rows render via data-table's group slot.
    expect(
      container.querySelectorAll("[data-slot='data-table-group-row']")
    ).toHaveLength(2)
    expect(screen.getByText("Admins")).toBeInTheDocument()
    expect(screen.getByText("Editors")).toBeInTheDocument()
    // Data rows from the discriminated union still render.
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("forwards `rowTone` to DataTable", () => {
    const rowTone = (row: RowData) =>
      row.role === "Admin" ? ("live" as const) : undefined
    const { container } = render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        data={data}
        rowTone={rowTone}
      />
    )
    const tonedRow = container.querySelector("tr[data-tone='live']")
    expect(tonedRow).not.toBeNull()
    expect(tonedRow?.textContent).toContain("Alice")
  })

  it("forwards `onRowClick` to DataTable and fires on click", async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        data={data}
        onRowClick={onRowClick}
      />
    )
    await user.click(screen.getByText("Alice"))
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(data[0])
  })

  it("dev-mode warns when both `rows` and `data` are supplied and `rows` wins", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { container } = render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        data={data}
        rows={[
          { kind: "group", id: "g", label: "Group A" },
          { kind: "data", id: "1", row: data[0]! },
        ]}
      />
    )
    expect(warnSpy).toHaveBeenCalled()
    const message = warnSpy.mock.calls[0]?.[0] as string
    expect(message).toMatch(/rows/)
    expect(message).toMatch(/data/)
    // `rows` wins — only one data row from the union renders, not all three.
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.queryByText("Bob")).not.toBeInTheDocument()
    expect(screen.queryByText("Carol")).not.toBeInTheDocument()
    // Group row from `rows` is present.
    expect(
      container.querySelectorAll("[data-slot='data-table-group-row']")
    ).toHaveLength(1)
    warnSpy.mockRestore()
  })

  it("does not warn when only `rows` is supplied", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        rows={[{ kind: "data", id: "1", row: data[0]! }]}
      />
    )
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it("passes accessibility checks with grouped rows + tones + clickable rows", async () => {
    const { container } = render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        rows={[
          { kind: "group", id: "admins", label: "Admins" },
          { kind: "data", id: "1", row: data[0]! },
          { kind: "data", id: "2", row: data[1]! },
        ]}
        rowTone={(row) => (row.role === "Admin" ? "live" : undefined)}
        onRowClick={vi.fn()}
      />
    )
    await checkA11y(container)
  })

  // ─── data prop optional (VI-392) ────────────────────────────────────

  it("renders without crashing when `data` is omitted", () => {
    const { container } = render(
      <AdminListPage<RowData> title="Users" columns={columns} />
    )
    expect(container.firstChild).toBeInTheDocument()
    // Empty state surfaces from DataTable.
    expect(
      container.querySelector("[data-slot='data-table-empty-row']")
    ).toBeInTheDocument()
  })

  it("renders without crashing when `data` is omitted but customFilterBar is supplied", () => {
    render(
      <AdminListPage<RowData>
        title="Users"
        columns={columns}
        customFilterBar={
          <div role="toolbar" aria-label="Filters">
            <button type="button">Chip A</button>
          </div>
        }
      />
    )
    expect(screen.getByRole("button", { name: "Chip A" })).toBeInTheDocument()
  })
})
