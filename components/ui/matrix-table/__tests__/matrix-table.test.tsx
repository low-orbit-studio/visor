import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { MatrixTable, type MatrixColumn, type MatrixRow } from "../matrix-table"

// ─── Fixtures ────────────────────────────────────────────────────────────────

const columns: MatrixColumn[] = [
  { id: "admin", label: "Admin", count: 3 },
  { id: "editor", label: "Editor", count: 5 },
  { id: "viewer", label: "Viewer" },
]

interface Identity {
  name: string
  email: string
}

const rows: MatrixRow<Identity>[] = [
  {
    id: "1",
    identity: { name: "Ada Lovelace", email: "ada@example.com" },
    activeColumns: new Set(["admin", "editor"]),
  },
  {
    id: "2",
    identity: { name: "Grace Hopper", email: "grace@example.com" },
    activeColumns: ["viewer"],
  },
  {
    id: "3",
    identity: { name: "Linus Torvalds", email: "linus@example.com" },
    activeColumns: [],
  },
]

const renderIdentity = (identity: Identity) => (
  <span data-testid="identity-cell">{identity.name}</span>
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
    // Counts appear as sub-labels under the column label
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
  })

  it("renders each row's identity via renderIdentity slot", () => {
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

  it("marks active cells as 'assigned' in aria-label", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // Ada is active for admin and editor
    const adaRow = screen.getByText("Ada Lovelace").closest("tr")
    expect(adaRow).not.toBeNull()
    const adminCell = within(adaRow!).getByRole("cell", {
      name: /Admin: assigned/i,
    })
    expect(adminCell).toBeInTheDocument()
    const editorCell = within(adaRow!).getByRole("cell", {
      name: /Editor: assigned/i,
    })
    expect(editorCell).toBeInTheDocument()
  })

  it("marks inactive cells as 'not assigned' in aria-label", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // Ada is NOT active for viewer
    const adaRow = screen.getByText("Ada Lovelace").closest("tr")
    expect(adaRow).not.toBeNull()
    const viewerCell = within(adaRow!).getByRole("cell", {
      name: /Viewer: not assigned/i,
    })
    expect(viewerCell).toBeInTheDocument()
  })

  it("accepts activeColumns as a plain array (not just Set)", () => {
    const arrayRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Test User", email: "test@example.com" },
        activeColumns: ["admin"],
      },
    ]
    render(
      <MatrixTable
        columns={columns}
        rows={arrayRows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    const row = screen.getByText("Test User").closest("tr")
    expect(row).not.toBeNull()
    const adminCell = within(row!).getByRole("cell", { name: /Admin: assigned/i })
    expect(adminCell).toBeInTheDocument()
    const editorCell = within(row!).getByRole("cell", {
      name: /Editor: not assigned/i,
    })
    expect(editorCell).toBeInTheDocument()
  })

  it("renders the table element with provided aria-label", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Member role assignments"
      />
    )
    const table = screen.getByRole("table", { name: "Member role assignments" })
    expect(table).toBeInTheDocument()
  })

  it("renders empty state gracefully with no rows", () => {
    render(
      <MatrixTable
        columns={columns}
        rows={[]}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // Table still renders with column headers
    expect(screen.getByText("Admin")).toBeInTheDocument()
    expect(screen.queryAllByTestId("identity-cell")).toHaveLength(0)
  })

  it("renders with data-slot attribute on the root", () => {
    const { container } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
      />
    )
    const root = container.querySelector("[data-slot='matrix-table']")
    expect(root).toBeInTheDocument()
  })

  it("row entries have data-slot attribute", () => {
    const { container } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
      />
    )
    const rowSlots = container.querySelectorAll("[data-slot='matrix-table-row']")
    expect(rowSlots).toHaveLength(3)
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
    const root = container.querySelector("[data-slot='matrix-table']")
    expect(root).toHaveClass("my-custom-class")
  })

  // ─── String cell values (VI-531) ─────────────────────────────────────────

  it("renders a string cell value as plain text", () => {
    const stringRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Storage", email: "" },
        activeColumns: [],
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
        activeColumns: [],
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
    const cell = screen.getByRole("cell", { name: /Admin: 50GB/i })
    expect(cell).toBeInTheDocument()
  })

  it("renders boolean cells from `cells` with the existing assigned/not-assigned aria-label", () => {
    const mixedRows: MatrixRow<Identity>[] = [
      {
        id: "1",
        identity: { name: "Mixed", email: "" },
        activeColumns: [],
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
    expect(
      within(row).getByRole("cell", { name: /Admin: assigned/i })
    ).toBeInTheDocument()
    expect(
      within(row).getByRole("cell", { name: /Editor: not assigned/i })
    ).toBeInTheDocument()
    expect(
      within(row).getByRole("cell", { name: /Viewer: Unlimited/i })
    ).toBeInTheDocument()
    expect(within(row).getByText("Unlimited")).toBeInTheDocument()
  })

  it("`cells` entry takes precedence over `activeColumns` for the same column", () => {
    // admin is in activeColumns (would be 'assigned') but cells overrides to a string.
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
    // admin overridden to string
    expect(
      within(row).getByRole("cell", { name: /Admin: Custom/i })
    ).toBeInTheDocument()
    // editor not in cells → falls back to activeColumns (assigned)
    expect(
      within(row).getByRole("cell", { name: /Editor: assigned/i })
    ).toBeInTheDocument()
    // viewer absent from both → not assigned
    expect(
      within(row).getByRole("cell", { name: /Viewer: not assigned/i })
    ).toBeInTheDocument()
  })

  it("leaves boolean-only callers (no `cells`) rendering the indicator unchanged", () => {
    const { container } = render(
      <MatrixTable
        columns={columns}
        rows={rows}
        renderIdentity={renderIdentity}
        aria-label="Role assignments"
      />
    )
    // No text cells present — every body cell is either identity or boolean indicator.
    expect(screen.queryByText("50GB")).not.toBeInTheDocument()
    // Ada's admin cell still uses the boolean aria-label pattern.
    const adaRow = screen.getByText("Ada Lovelace").closest("tr")!
    expect(
      within(adaRow).getByRole("cell", { name: /Admin: assigned/i })
    ).toBeInTheDocument()
    expect(container).toBeTruthy()
  })
})
