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
})
