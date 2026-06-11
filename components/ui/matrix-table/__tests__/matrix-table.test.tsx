import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { MatrixTable, type MatrixColumn, type MatrixRow } from "../matrix-table"

// ─── Fixtures ────────────────────────────────────────────────────────────────

interface Identity {
  name: string
  email: string
}

// Blessed-shape columns: `key` + optional `count` + optional `description`.
const columns: MatrixColumn[] = [
  { key: "admin", label: "Admin", count: 3, description: "Full access" },
  { key: "editor", label: "Editor", count: 5 },
  { key: "viewer", label: "Viewer" },
]

// Blessed-shape rows: per-column `cells` boolean map.
const rows: MatrixRow<Identity>[] = [
  {
    id: "1",
    identity: { name: "Ada Lovelace", email: "ada@example.com" },
    cells: { admin: true, editor: true },
  },
  {
    id: "2",
    identity: { name: "Grace Hopper", email: "grace@example.com" },
    cells: { viewer: true },
  },
  {
    id: "3",
    identity: { name: "Linus Torvalds", email: "linus@example.com" },
    cells: {},
  },
]

const renderIdentity = (row: MatrixRow<Identity>) => (
  <span data-testid="identity-cell">{row.identity?.name}</span>
)

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("MatrixTable", () => {
  it("renders column headers", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    expect(screen.getByText("Admin")).toBeInTheDocument()
    expect(screen.getByText("Editor")).toBeInTheDocument()
    expect(screen.getByText("Viewer")).toBeInTheDocument()
  })

  it("renders column header count sub-labels", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders each row's identity via the renderIdentity slot", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    const identityCells = screen.getAllByTestId("identity-cell")
    expect(identityCells).toHaveLength(3)
    expect(identityCells[0]).toHaveTextContent("Ada Lovelace")
    expect(identityCells[1]).toHaveTextContent("Grace Hopper")
    expect(identityCells[2]).toHaveTextContent("Linus Torvalds")
  })

  it("renders a Check glyph in active (true) cells", () => {
    const { container } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // Ada has admin + editor true → two active marks, each with an svg glyph.
    const adaRow = screen.getByText("Ada Lovelace").closest("tr")!
    const activeMarks = adaRow.querySelectorAll(
      '[data-slot="matrix-cell"][data-active="true"]'
    )
    expect(activeMarks).toHaveLength(2)
    activeMarks.forEach((mark) => {
      expect(mark.querySelector("svg")).toBeInTheDocument()
      expect(mark).toHaveAttribute("aria-label", "Assigned")
    })
    expect(container.querySelectorAll('[data-active="true"]').length).toBe(3)
  })

  it("renders the muted dash for inactive (false / missing) cells", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // Ada is NOT a viewer → that cell is the inactive dash mark.
    const adaRow = screen.getByText("Ada Lovelace").closest("tr")!
    const inactive = within(adaRow).getByLabelText("Not assigned")
    expect(inactive).toHaveTextContent("—")
    expect(inactive).toHaveAttribute("data-active", "false")
  })

  it("renders the identityLabel header (defaults to 'Member')", () => {
    const { rerender } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    expect(
      screen.getByRole("columnheader", { name: "Member" })
    ).toBeInTheDocument()

    rerender(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        identityLabel="Teammate"
        aria-label="Role assignments"
      />
    )
    expect(
      screen.getByRole("columnheader", { name: "Teammate" })
    ).toBeInTheDocument()
  })

  it("shows the column description as a tooltip on active cells", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // admin has a description; Ada's admin cell is active → tooltip rendered.
    const tooltip = screen.getByRole("tooltip", { name: "Full access" })
    expect(tooltip).toBeInTheDocument()
  })

  it("renders the table element with the provided aria-label", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Member role assignments"
      />
    )
    expect(
      screen.getByRole("table", { name: "Member role assignments" })
    ).toBeInTheDocument()
  })

  it("renders the empty state gracefully with no rows", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={[]}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    expect(screen.getByText("Admin")).toBeInTheDocument()
    expect(screen.queryAllByTestId("identity-cell")).toHaveLength(0)
  })

  it("emits the data-slot attributes (root + rows + cells)", () => {
    const { container } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
      />
    )
    expect(
      container.querySelector('[data-slot="matrix-table"]')
    ).toBeInTheDocument()
    expect(
      container.querySelectorAll('[data-slot="matrix-table-row"]')
    ).toHaveLength(3)
    // 3 rows × 3 columns = 9 body cells.
    expect(
      container.querySelectorAll('[data-slot="matrix-table-cell"]')
    ).toHaveLength(9)
  })

  it("forwards className to the root div", () => {
    const { container } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        className="my-custom-class"
      />
    )
    expect(
      container.querySelector('[data-slot="matrix-table"]')
    ).toHaveClass("my-custom-class")
  })

  // ─── String cell values ──────────────────────────────────────────────────

  it("renders a string cell value as plain text", () => {
    const stringRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Storage", email: "" },
        cells: { admin: "50GB", editor: true, viewer: false },
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={stringRows}
        renderIdentity={renderIdentity}
        aria-label="Plan comparison"
      />
    )
    expect(screen.getByText("50GB")).toBeInTheDocument()
  })

  it("gives a string cell an aria-label of 'column: value'", () => {
    const stringRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Storage", email: "" },
        cells: { admin: "50GB" },
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={stringRows}
        renderIdentity={renderIdentity}
        aria-label="Plan comparison"
      />
    )
    expect(
      screen.getByRole("cell", { name: /Admin: 50GB/i })
    ).toBeInTheDocument()
  })

  it("renders mixed string + boolean cells in the same row", () => {
    const mixedRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Mixed", email: "" },
        cells: { admin: true, editor: false, viewer: "Unlimited" },
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={mixedRows}
        renderIdentity={renderIdentity}
        aria-label="Plan comparison"
      />
    )
    const row = screen.getByText("Mixed").closest("tr")!
    // admin true → active mark with glyph
    expect(within(row).getByLabelText("Assigned").querySelector("svg")).toBeInTheDocument()
    // editor false → dash
    expect(within(row).getByLabelText("Not assigned")).toHaveTextContent("—")
    // viewer string → plain text
    expect(within(row).getByText("Unlimited")).toBeInTheDocument()
  })

  // ─── Compatible aliases (canonical's prior API) ──────────────────────────

  it("accepts the `id` column alias for `key`", () => {
    const aliasColumns: MatrixColumn[] = [
      { id: "admin", label: "Admin" },
      { id: "editor", label: "Editor" },
    ]
    const aliasRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Aliased", email: "" },
        cells: { admin: true },
      },
    ]
    render(
      <MatrixTable
        columns={aliasColumns}
        rows={aliasRows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    const row = screen.getByText("Aliased").closest("tr")!
    // admin true → active; editor missing → inactive dash.
    expect(within(row).getByLabelText("Assigned")).toBeInTheDocument()
    expect(within(row).getByLabelText("Not assigned")).toBeInTheDocument()
  })

  it("accepts the `activeColumns` alias (Set) for the boolean cells map", () => {
    const aliasRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "SetUser", email: "" },
        activeColumns: new Set(["admin", "editor"]),
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={aliasRows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    const row = screen.getByText("SetUser").closest("tr")!
    // admin + editor active; viewer inactive.
    expect(within(row).getAllByLabelText("Assigned")).toHaveLength(2)
    expect(within(row).getByLabelText("Not assigned")).toBeInTheDocument()
  })

  it("accepts the `activeColumns` alias (array) for the boolean cells map", () => {
    const aliasRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "ArrUser", email: "" },
        activeColumns: ["viewer"],
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={aliasRows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    const row = screen.getByText("ArrUser").closest("tr")!
    expect(within(row).getAllByLabelText("Assigned")).toHaveLength(1)
  })

  it("`cells` takes precedence over `activeColumns` for the same column", () => {
    const overrideRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Override", email: "" },
        activeColumns: ["admin", "editor"],
        cells: { admin: "Custom" },
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={overrideRows}
        renderIdentity={renderIdentity}
        aria-label="Plan comparison"
      />
    )
    const row = screen.getByText("Override").closest("tr")!
    // admin overridden to a string
    expect(
      within(row).getByRole("cell", { name: /Admin: Custom/i })
    ).toBeInTheDocument()
    // editor not in cells → falls back to activeColumns (active)
    expect(within(row).getByLabelText("Assigned")).toBeInTheDocument()
    // viewer absent from both → inactive
    expect(within(row).getByLabelText("Not assigned")).toBeInTheDocument()
  })
})
