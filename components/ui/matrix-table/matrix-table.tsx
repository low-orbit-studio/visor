"use client"

import * as React from "react"
import { Check } from "@phosphor-icons/react/dist/ssr"
import { cn } from "../../../lib/utils"
import styles from "./matrix-table.module.css"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatrixColumn {
  /**
   * Stable key indexing the per-row cell map (`MatrixRow["cells"]`) and used as
   * the React key. This is the blessed (look-spec) field.
   *
   * `id` is accepted as a compatible alias — when `key` is absent, `id` is used.
   * Provide one or the other.
   */
  key?: string
  /**
   * Compatible alias for {@link MatrixColumn.key}. Prefer `key`; `id` is kept so
   * callers written against canonical's prior API keep working.
   */
  id?: string
  /** Column header label (role name). Rendered 600/13px, primary, no tracking. */
  label: React.ReactNode
  /** Secondary count beneath the label (11px, tertiary). Optional. */
  count?: React.ReactNode
  /** Tooltip shown when hovering an active cell in this column. Optional. */
  description?: React.ReactNode
}

/**
 * A single matrix cell value.
 *
 * - `true` → renders the active filled-success disc with a check glyph
 * - `false` → renders the muted "not assigned" dash
 * - `string` → renders the text in the standard cell typography
 */
export type MatrixCellValue = string | boolean

export interface MatrixRow<TIdentity = unknown> {
  /** Stable row id (React key). */
  id: string
  /**
   * Optional identity payload. Convenience for callers whose `renderIdentity`
   * reads structured identity data (e.g. `(row) => row.identity.name`). The
   * component never inspects this — it is passed straight to `renderIdentity`
   * via the row.
   */
  identity?: TIdentity
  /**
   * Per-column cell values keyed by `MatrixColumn["key"]` (or `id`). Each value
   * is a {@link MatrixCellValue}: `true`/`false` render the boolean indicator,
   * a `string` renders as plain text in the standard cell style. Missing = false.
   *
   * When both `cells` and `activeColumns` are present, a `cells` entry takes
   * precedence over `activeColumns` for that column.
   */
  cells?: Record<string, MatrixCellValue>
  /**
   * Compatible alias for the boolean half of `cells`: a set/array of column keys
   * that should render the active check indicator. Columns absent here render as
   * "not assigned". Kept so callers written against canonical's prior API keep
   * working; new callers should prefer `cells`.
   */
  activeColumns?: Set<string> | string[]
}

export interface MatrixTableProps<TIdentity = unknown>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Column (role) definitions — each carries a label + optional count. */
  columns: MatrixColumn[]
  /** Row data — identity metadata lives in `renderIdentity`; truth in `cells`. */
  rows: MatrixRow<TIdentity>[]
  /**
   * Renders the sticky-left identity cell for a row. Receives the whole row
   * (blessed shape) — read `row.identity` for structured identity data.
   */
  renderIdentity: (row: MatrixRow<TIdentity>) => React.ReactNode
  /** Header label for the sticky identity column. Defaults to "Member". */
  identityLabel?: React.ReactNode
  /** Accessible label for the table element. */
  "aria-label"?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a column's stable key, preferring `key` then the `id` alias. */
function columnKey(column: MatrixColumn): string {
  return (column.key ?? column.id) as string
}

/**
 * Resolve a row's value for a column. A `cells` entry wins; otherwise fall back
 * to `activeColumns` membership (boolean). Missing everywhere → `false`.
 */
function cellValue(row: MatrixRow, key: string): MatrixCellValue {
  if (row.cells != null && key in row.cells) {
    return row.cells[key]
  }
  if (row.activeColumns != null) {
    const set =
      row.activeColumns instanceof Set
        ? row.activeColumns
        : new Set(row.activeColumns)
    return set.has(key)
  }
  return false
}

// ─── MatrixTable ─────────────────────────────────────────────────────────────

/**
 * MatrixTable — a members×roles assignment grid.
 *
 * A sticky-left identity column pins through horizontal scroll; the remaining
 * columns are centered boolean assignments. An "active" cell renders a filled
 * success disc with a check glyph; "not assigned" renders a muted dash. A
 * string cell renders plain text in the standard cell typography.
 *
 * This is NOT the sortable/paginated DataTable — there is no selection column,
 * no sort affordance, and no pagination footer. It is a flat presentational
 * grid driven entirely by `columns` + `rows`.
 */
function MatrixTableInner<TIdentity = unknown>(
  props: MatrixTableProps<TIdentity>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    columns,
    rows,
    renderIdentity,
    identityLabel = "Member",
    className,
    "aria-label": ariaLabel,
    ...rest
  } = props

  return (
    <div
      ref={ref}
      data-slot="matrix-table"
      className={cn(styles.container, className)}
      {...rest}
    >
      <table className={styles.table} aria-label={ariaLabel}>
        <thead>
          <tr>
            <th
              scope="col"
              data-slot="matrix-table-identity-head"
              className={styles.identityHead}
            >
              {identityLabel}
            </th>
            {columns.map((column) => (
              <th
                key={columnKey(column)}
                scope="col"
                data-slot="matrix-table-column-head"
                className={styles.columnHead}
              >
                <span className={styles.columnHeader}>
                  <span className={styles.columnLabel}>{column.label}</span>
                  {column.count != null ? (
                    <span className={styles.columnCount}>{column.count}</span>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-slot="matrix-table-row">
              <td
                data-slot="matrix-table-identity-cell"
                className={styles.identityCell}
              >
                {renderIdentity(row)}
              </td>
              {columns.map((column) => {
                const key = columnKey(column)
                const value = cellValue(row, key)

                // String cell — plain text in the standard cell typography.
                if (typeof value !== "boolean") {
                  return (
                    <td
                      key={key}
                      data-slot="matrix-table-cell"
                      className={styles.cell}
                      aria-label={`${String(column.label)}: ${value}`}
                    >
                      <span className={styles.textCell}>{value}</span>
                    </td>
                  )
                }

                // Boolean cell — filled-success disc (active) or muted dash.
                return (
                  <td
                    key={key}
                    data-slot="matrix-table-cell"
                    className={styles.cell}
                  >
                    <MatrixCell active={value} description={column.description} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// forwardRef with generics — preserve TIdentity through the cast
const MatrixTable = React.forwardRef(MatrixTableInner) as (<
  TIdentity = unknown,
>(
  props: MatrixTableProps<TIdentity> & {
    ref?: React.ForwardedRef<HTMLDivElement>
  }
) => ReturnType<typeof MatrixTableInner>) & { displayName?: string }

MatrixTable.displayName = "MatrixTable"

// ─── MatrixCell ──────────────────────────────────────────────────────────────

function MatrixCell({
  active,
  description,
}: {
  active: boolean
  description?: React.ReactNode
}) {
  if (!active) {
    return (
      <span
        data-slot="matrix-cell"
        data-active="false"
        className={styles.markInactive}
        aria-label="Not assigned"
      >
        —
      </span>
    )
  }
  return (
    <span
      data-slot="matrix-cell"
      data-active="true"
      className={styles.markActive}
      aria-label="Assigned"
    >
      <span className={styles.disc} aria-hidden="true">
        <Check weight="bold" />
      </span>
      {description != null ? (
        <span role="tooltip" className={styles.tooltip}>
          {description}
        </span>
      ) : null}
    </span>
  )
}

export { MatrixTable }
