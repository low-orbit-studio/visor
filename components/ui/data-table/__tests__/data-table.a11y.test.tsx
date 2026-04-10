import * as React from "react"
import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { axe } from "../../../../test-utils/axe"
import { DataTable, type ColumnDef } from "../data-table"

interface Row {
  id: string
  name: string
  email: string
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
]

const data: Row[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
]

describe("DataTable a11y (vitest-axe)", () => {
  it("has no WCAG 2.1 AA violations (default)", async () => {
    const { container } = render(
      <DataTable columns={columns} data={data} aria-label="Users" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no violations with row selection enabled", async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        enableRowSelection
        aria-label="Users"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no violations with active sorting", async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        defaultSorting={[{ id: "name", desc: false }]}
        aria-label="Users"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no violations in the empty state", async () => {
    const { container } = render(
      <DataTable columns={columns} data={[]} aria-label="Users" />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it("has no violations in the loading state", async () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        loading
        pageSize={3}
        aria-label="Users"
      />
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
