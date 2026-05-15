import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  DataTable,
  type ColumnDef,
  type DataTableRow,
} from "../data-table"

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

  describe("group rows (rows prop)", () => {
    const groupedRows: DataTableRow<Row>[] = [
      {
        kind: "group",
        id: "tonight",
        label: "Tonight · Sat Apr 27",
        count: 2,
      },
      { kind: "data", id: "1", row: { id: "1", name: "Alice", email: "a@e.com" } },
      { kind: "data", id: "2", row: { id: "2", name: "Bob", email: "b@e.com" } },
      {
        kind: "group",
        id: "this-week",
        label: "This Week · Apr 28 — May 4",
      },
      {
        kind: "data",
        id: "3",
        row: { id: "3", name: "Charlie", email: "c@e.com" },
      },
    ]

    it("renders group-head rows interspersed with data rows", () => {
      const { container } = render(
        <DataTable columns={columns} rows={groupedRows} />
      )
      // Group labels visible
      expect(screen.getByText(/Tonight · Sat Apr 27/)).toBeInTheDocument()
      expect(
        screen.getByText(/This Week · Apr 28 — May 4/)
      ).toBeInTheDocument()
      // Group count rendered
      expect(screen.getByText("2")).toBeInTheDocument()
      // Data rows rendered
      expect(screen.getByText("Alice")).toBeInTheDocument()
      expect(screen.getByText("Bob")).toBeInTheDocument()
      expect(screen.getByText("Charlie")).toBeInTheDocument()
      // Group rows tagged with data-slot
      const groupRows = container.querySelectorAll(
        '[data-slot="data-table-group-row"]'
      )
      expect(groupRows).toHaveLength(2)
    })

    it("excludes group rows from row selection", () => {
      const { container } = render(
        <DataTable
          columns={columns}
          rows={groupedRows}
          enableRowSelection
        />
      )
      // Group rows have no per-row checkbox
      const groupRows = container.querySelectorAll(
        '[data-slot="data-table-group-row"]'
      )
      groupRows.forEach((row) => {
        expect(
          row.querySelector('[role="checkbox"]')
        ).not.toBeInTheDocument()
      })
      // Per-row checkboxes match data-row count (3), not group-row count
      const rowBoxes = screen.getAllByRole("checkbox", { name: /select row/i })
      expect(rowBoxes).toHaveLength(3)
    })

    it("select-all only counts data rows", async () => {
      const user = userEvent.setup()
      render(
        <DataTable
          columns={columns}
          rows={groupedRows}
          enableRowSelection
        />
      )
      const selectAll = screen.getByRole("checkbox", {
        name: /select all rows/i,
      })
      await user.click(selectAll)
      const rowBoxes = screen.getAllByRole("checkbox", { name: /select row/i })
      for (const box of rowBoxes) {
        expect(box).toHaveAttribute("data-state", "checked")
      }
    })

    it("suppresses sort UI when rows is provided", () => {
      render(<DataTable columns={columns} rows={groupedRows} />)
      // No sort buttons should render
      expect(
        screen.queryByRole("button", { name: /name.*sort/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /email.*sort/i })
      ).not.toBeInTheDocument()
    })

    it("suppresses pagination footer when rows is provided", () => {
      const { container } = render(
        <DataTable columns={columns} rows={groupedRows} />
      )
      expect(
        container.querySelector('[data-slot="data-table-footer"]')
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole("button", { name: /next page/i })
      ).not.toBeInTheDocument()
    })

    it("uses groupRowRenderer for custom group-head content", () => {
      const groupRowRenderer = vi.fn((g) => (
        <span data-testid={`custom-${g.id}`}>CUSTOM: {g.label}</span>
      ))
      render(
        <DataTable
          columns={columns}
          rows={groupedRows}
          groupRowRenderer={groupRowRenderer}
        />
      )
      expect(screen.getByTestId("custom-tonight")).toHaveTextContent(
        "CUSTOM: Tonight · Sat Apr 27"
      )
      expect(screen.getByTestId("custom-this-week")).toBeInTheDocument()
      expect(groupRowRenderer).toHaveBeenCalledTimes(2)
    })

    it("preserves backwards compatibility — sort/pagination still work without rows", async () => {
      const user = userEvent.setup()
      const data = makeRows(15)
      render(<DataTable columns={columns} data={data} pageSize={5} />)

      // Footer renders
      const nextBtn = screen.getByRole("button", { name: /next page/i })
      expect(nextBtn).toBeInTheDocument()
      // Sort button renders
      expect(
        screen.getByRole("button", { name: /name.*sort/i })
      ).toBeInTheDocument()

      await user.click(nextBtn)
      expect(screen.getByText(data[5].email)).toBeInTheDocument()
    })
  })

  describe("rowTone", () => {
    const data: Row[] = [
      { id: "1", name: "Alice", email: "a@e.com" },
      { id: "2", name: "Bob", email: "b@e.com" },
      { id: "3", name: "Charlie", email: "c@e.com" },
      { id: "4", name: "Dana", email: "d@e.com" },
    ]

    it("stamps data-tone on each data row from the rowTone callback", () => {
      const rowTone = (row: Row) =>
        row.name === "Alice"
          ? ("live" as const)
          : row.name === "Bob"
            ? ("warn" as const)
            : row.name === "Charlie"
              ? ("sold" as const)
              : undefined
      render(<DataTable columns={columns} data={data} rowTone={rowTone} />)

      const tableRows = screen.getAllByRole("row")
      // tableRows[0] is the header
      expect(tableRows[1]).toHaveAttribute("data-tone", "live")
      expect(tableRows[2]).toHaveAttribute("data-tone", "warn")
      expect(tableRows[3]).toHaveAttribute("data-tone", "sold")
      expect(tableRows[4]).not.toHaveAttribute("data-tone")
    })

    it("omits data-tone entirely when rowTone is not supplied (backwards compat)", () => {
      render(<DataTable columns={columns} data={data} />)
      const tableRows = screen.getAllByRole("row")
      for (const row of tableRows.slice(1)) {
        expect(row).not.toHaveAttribute("data-tone")
      }
    })

    it("supports all five tone keys plus danger and info", () => {
      const tones = [
        "live",
        "warn",
        "scheduled",
        "sold",
        "draft",
        "danger",
        "info",
      ] as const
      const toneData: Row[] = tones.map((t, i) => ({
        id: String(i),
        name: t,
        email: `${t}@e.com`,
      }))
      render(
        <DataTable
          columns={columns}
          data={toneData}
          pageSize={20}
          rowTone={(r) =>
            tones.includes(r.name as (typeof tones)[number])
              ? (r.name as (typeof tones)[number])
              : undefined
          }
        />
      )
      const tableRows = screen.getAllByRole("row").slice(1)
      tones.forEach((tone, idx) => {
        expect(tableRows[idx]).toHaveAttribute("data-tone", tone)
      })
    })

    it("applies rowTone to rows in the grouped `rows` path", () => {
      const grouped: DataTableRow<Row>[] = [
        { kind: "group", id: "g1", label: "Group A" },
        { kind: "data", id: "1", row: data[0] },
        { kind: "data", id: "2", row: data[1] },
      ]
      const { container } = render(
        <DataTable
          columns={columns}
          rows={grouped}
          rowTone={(r) => (r.name === "Alice" ? "live" : undefined)}
        />
      )
      // Group row should NOT carry data-tone
      const groupRow = container.querySelector(
        '[data-slot="data-table-group-row"]'
      )
      expect(groupRow).not.toHaveAttribute("data-tone")
      // Data rows reflect the tone callback
      const tableRows = screen.getAllByRole("row")
      const aliceRow = tableRows.find((r) =>
        within(r).queryByText("Alice")
      )
      const bobRow = tableRows.find((r) => within(r).queryByText("Bob"))
      expect(aliceRow).toHaveAttribute("data-tone", "live")
      expect(bobRow).not.toHaveAttribute("data-tone")
    })
  })

  describe("data-state=\"selected\" row styling", () => {
    it("data-state=\"selected\" appears on selected rows after toggling the checkbox", async () => {
      const user = userEvent.setup()
      const data: Row[] = [
        { id: "1", name: "Alice", email: "a@e.com" },
        { id: "2", name: "Bob", email: "b@e.com" },
      ]
      render(<DataTable columns={columns} data={data} enableRowSelection />)
      const rowBoxes = screen.getAllByRole("checkbox", { name: /select row/i })
      await user.click(rowBoxes[0])

      const tableRows = screen.getAllByRole("row")
      // tableRows[0] is the header; data row order matches data[]
      expect(tableRows[1]).toHaveAttribute("data-state", "selected")
      expect(tableRows[2]).not.toHaveAttribute("data-state", "selected")
    })
  })

  describe("onRowClick", () => {
    const data: Row[] = [
      { id: "1", name: "Alice", email: "a@e.com" },
      { id: "2", name: "Bob", email: "b@e.com" },
    ]

    it("renders rows with role=\"button\", tabIndex=0, data-clickable when onRowClick is set without selection", () => {
      const { container } = render(
        <DataTable columns={columns} data={data} onRowClick={() => {}} />
      )
      // role="button" on <tr> overrides the implicit row role, so query by
      // the data attribute we control.
      const clickable = container.querySelectorAll<HTMLTableRowElement>(
        'tr[data-clickable="true"]'
      )
      expect(clickable).toHaveLength(2)
      for (const row of clickable) {
        expect(row).toHaveAttribute("role", "button")
        expect(row).toHaveAttribute("tabindex", "0")
      }
    })

    it("drops role=\"button\" when selection is also enabled to avoid nested-interactive (a11y)", () => {
      const { container } = render(
        <DataTable
          columns={columns}
          data={data}
          enableRowSelection
          onRowClick={() => {}}
        />
      )
      const clickable = container.querySelectorAll<HTMLTableRowElement>(
        'tr[data-clickable="true"]'
      )
      expect(clickable).toHaveLength(2)
      for (const row of clickable) {
        // tabIndex + click + keyboard handlers still apply; role stays as
        // the implicit "row" so axe nested-interactive stays clean.
        expect(row).not.toHaveAttribute("role", "button")
        expect(row).toHaveAttribute("tabindex", "0")
      }
    })

    it("does NOT render row affordance when onRowClick is omitted (backwards compat)", () => {
      const { container } = render(
        <DataTable columns={columns} data={data} />
      )
      const clickable = container.querySelectorAll(
        'tr[data-clickable="true"]'
      )
      expect(clickable).toHaveLength(0)
      const buttonRows = container.querySelectorAll('tr[role="button"]')
      expect(buttonRows).toHaveLength(0)
    })

    it("fires onRowClick when the row is clicked", async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      const { container } = render(
        <DataTable columns={columns} data={data} onRowClick={onRowClick} />
      )
      const aliceRow = container.querySelector<HTMLTableRowElement>(
        'tr[data-clickable="true"]'
      )!
      await user.click(within(aliceRow).getByText("Alice"))
      expect(onRowClick).toHaveBeenCalledTimes(1)
      expect(onRowClick).toHaveBeenCalledWith(data[0])
    })

    it("fires onRowClick on Enter and Space keypress", async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      const { container } = render(
        <DataTable columns={columns} data={data} onRowClick={onRowClick} />
      )
      const aliceRow = container.querySelector<HTMLTableRowElement>(
        'tr[data-clickable="true"]'
      )!
      aliceRow.focus()
      await user.keyboard("{Enter}")
      expect(onRowClick).toHaveBeenCalledTimes(1)
      expect(onRowClick).toHaveBeenLastCalledWith(data[0])

      await user.keyboard(" ")
      expect(onRowClick).toHaveBeenCalledTimes(2)
      expect(onRowClick).toHaveBeenLastCalledWith(data[0])
    })

    it("checkbox click does NOT propagate to onRowClick", async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      render(
        <DataTable
          columns={columns}
          data={data}
          enableRowSelection
          onRowClick={onRowClick}
        />
      )
      const rowBoxes = screen.getAllByRole("checkbox", {
        name: /select row/i,
      })
      await user.click(rowBoxes[0])
      expect(onRowClick).not.toHaveBeenCalled()
    })

    it("works on rows in the grouped `rows` path", async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      const grouped: DataTableRow<Row>[] = [
        { kind: "group", id: "g1", label: "Group A" },
        { kind: "data", id: "1", row: data[0] },
        { kind: "data", id: "2", row: data[1] },
      ]
      const { container } = render(
        <DataTable
          columns={columns}
          rows={grouped}
          onRowClick={onRowClick}
        />
      )
      const aliceRow = container.querySelector<HTMLTableRowElement>(
        'tr[data-clickable="true"]'
      )!
      await user.click(within(aliceRow).getByText("Alice"))
      expect(onRowClick).toHaveBeenCalledTimes(1)
      expect(onRowClick).toHaveBeenCalledWith(data[0])
    })

    it("group rows do NOT receive role=button or data-clickable", () => {
      const grouped: DataTableRow<Row>[] = [
        { kind: "group", id: "g1", label: "Group A" },
        { kind: "data", id: "1", row: data[0] },
      ]
      const { container } = render(
        <DataTable
          columns={columns}
          rows={grouped}
          onRowClick={() => {}}
        />
      )
      const groupRow = container.querySelector(
        '[data-slot="data-table-group-row"]'
      )
      expect(groupRow).not.toHaveAttribute("role", "button")
      expect(groupRow).not.toHaveAttribute("data-clickable")
    })
  })
})
