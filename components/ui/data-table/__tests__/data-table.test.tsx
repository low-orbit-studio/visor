import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { DataTable, type ColumnDef } from "../data-table"

interface Row {
  id: string
  name: string
  email: string
}

const makeRows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    name: `User ${String.fromCharCode(65 + (i % 26))}${i}`,
    email: `user${i}@example.com`,
  }))

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
]

describe("DataTable", () => {
  it("renders rows from data", () => {
    const data: Row[] = [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
    ]
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("bob@example.com")).toBeInTheDocument()
  })

  it("sorts rows when clicking a sortable header", async () => {
    const user = userEvent.setup()
    const data: Row[] = [
      { id: "1", name: "Charlie", email: "c@example.com" },
      { id: "2", name: "Alice", email: "a@example.com" },
      { id: "3", name: "Bob", email: "b@example.com" },
    ]
    render(<DataTable columns={columns} data={data} />)

    // Click the Name sort header — ascending first
    const nameHeader = screen.getByRole("button", { name: /name.*sort/i })
    await user.click(nameHeader)

    const rows = screen.getAllByRole("row")
    // First row is the header; next three should be sorted asc: Alice, Bob, Charlie
    expect(within(rows[1]).getByText("Alice")).toBeInTheDocument()
    expect(within(rows[2]).getByText("Bob")).toBeInTheDocument()
    expect(within(rows[3]).getByText("Charlie")).toBeInTheDocument()

    // The <th> should reflect aria-sort="ascending"
    const th = screen.getAllByRole("columnheader")[0]
    expect(th).toHaveAttribute("aria-sort", "ascending")

    // Click again → descending
    await user.click(nameHeader)
    const rowsDesc = screen.getAllByRole("row")
    expect(within(rowsDesc[1]).getByText("Charlie")).toBeInTheDocument()
    expect(within(rowsDesc[2]).getByText("Bob")).toBeInTheDocument()
    expect(within(rowsDesc[3]).getByText("Alice")).toBeInTheDocument()
  })

  it("paginates — next/prev buttons change visible rows", async () => {
    const user = userEvent.setup()
    const data = makeRows(25)
    render(<DataTable columns={columns} data={data} pageSize={10} />)

    // Page 1: first row visible
    expect(screen.getByText(data[0].email)).toBeInTheDocument()
    expect(screen.queryByText(data[10].email)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /next page/i }))

    expect(screen.queryByText(data[0].email)).not.toBeInTheDocument()
    expect(screen.getByText(data[10].email)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /previous page/i }))
    expect(screen.getByText(data[0].email)).toBeInTheDocument()
  })

  it("renders selection checkboxes when enableRowSelection is set", async () => {
    const user = userEvent.setup()
    const data = makeRows(3)
    const onRowSelectionChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        enableRowSelection
        onRowSelectionChange={onRowSelectionChange}
      />
    )

    const rowBoxes = screen.getAllByRole("checkbox", { name: /select row/i })
    expect(rowBoxes).toHaveLength(3)

    await user.click(rowBoxes[0])
    expect(onRowSelectionChange).toHaveBeenCalled()
  })

  it("select-all checkbox selects every visible row", async () => {
    const user = userEvent.setup()
    const data = makeRows(3)
    render(<DataTable columns={columns} data={data} enableRowSelection />)

    const selectAll = screen.getByRole("checkbox", { name: /select all rows/i })
    await user.click(selectAll)

    const rowBoxes = screen.getAllByRole("checkbox", { name: /select row/i })
    for (const box of rowBoxes) {
      expect(box).toHaveAttribute("data-state", "checked")
    }
  })

  it("renders skeleton rows when loading", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        loading
        pageSize={5}
      />
    )
    const skeletonRows = container.querySelectorAll(
      '[data-slot="data-table-skeleton-row"]'
    )
    expect(skeletonRows).toHaveLength(5)
  })

  it("renders default empty state when data is empty", () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(
      screen.getByRole("heading", { name: /no results/i })
    ).toBeInTheDocument()
  })

  it("renders a custom emptyState override", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        emptyState={<div data-testid="custom-empty">Nothing here</div>}
      />
    )
    expect(screen.getByTestId("custom-empty")).toBeInTheDocument()
  })

  it("filters rows via globalFilter", () => {
    const data: Row[] = [
      { id: "1", name: "Alice", email: "alice@example.com" },
      { id: "2", name: "Bob", email: "bob@example.com" },
      { id: "3", name: "Charlie", email: "charlie@example.com" },
    ]
    const { rerender } = render(
      <DataTable columns={columns} data={data} globalFilter="" />
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()

    rerender(
      <DataTable columns={columns} data={data} globalFilter="alice" />
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.queryByText("Bob")).not.toBeInTheDocument()
  })

  it("passes HTML attributes to root", () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        id="table-root"
        aria-label="Users table"
        className="custom-class"
      />
    )
    const root = container.querySelector('[data-slot="data-table"]')
    expect(root).toHaveAttribute("id", "table-root")
    expect(root).toHaveAttribute("aria-label", "Users table")
    expect(root).toHaveClass("custom-class")
  })
})
