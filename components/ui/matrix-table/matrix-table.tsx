"use client"

import * as React from "react"
import { CheckIcon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./matrix-table.module.css"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MatrixColumn {
  /** Stable unique key used to look up cell values and keying. */
  id: string
  /** Display label for the column header. */
  label: string
  /** Optional sub-label rendered below the column label (e.g. member count). */
  count?: number
}

/**
 * A single matrix cell value.
 *
 * - `true` → renders the active checkmark indicator
 * - `false` → renders the empty/inactive indicator
 * - `string` → renders the text in the standard cell typography
 */
export type MatrixCellValue = string | boolean

export interface MatrixRow<TIdentity = React.ReactNode> {
  /** Stable unique key for the row. */
  id: string
  /** The identity data passed to `renderIdentity`. Typically a name/avatar record. */
  identity: TIdentity
  /**
   * Set of column ids where the boolean cell is "active" (checked).
   * Columns not present in this set render as empty/inactive.
   *
   * For string cell values, or to set per-column values explicitly, use `cells`.
   * When both are present, an entry in `cells` takes precedence over `activeColumns`
   * for that column.
   */
  activeColumns: Set<string> | string[]
  /**
   * Optional per-column cell values keyed by column id. Each value is a
   * {@link MatrixCellValue}: `true`/`false` render the boolean indicator,
   * a `string` renders as plain text in the standard cell style.
   *
   * A column present here overrides its `activeColumns` membership; columns
   * absent here fall back to the `activeColumns` boolean model.
   */
  cells?: Record<string, MatrixCellValue>
}

export interface MatrixTableProps<TIdentity = React.ReactNode>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Column definitions — drives the boolean cell columns. */
  columns: MatrixColumn[]
  /** Row data — each row has an identity + a set of active column ids. */
  rows: MatrixRow<TIdentity>[]
  /**
   * Render slot for the sticky-left identity cell content.
   * Receives the row's `identity` value.
   */
  renderIdentity: (identity: TIdentity) => React.ReactNode
  /** Accessible label for the table element. */
  "aria-label"?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

function MatrixTableInner<TIdentity = React.ReactNode>(
  props: MatrixTableProps<TIdentity>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    columns,
    rows,
    renderIdentity,
    className,
    "aria-label": ariaLabel,
    ...rest
  } = props

  return (
    <div
      ref={ref}
      data-slot="matrix-table"
      className={cn(styles.root, className)}
      {...rest}
    >
      <div className={styles.scrollContainer}>
        <table
          className={styles.table}
          aria-label={ariaLabel}
        >
          <thead className={styles.thead}>
            <tr className={styles.headerRow}>
              {/* Sticky identity header — empty, no label */}
              <th
                scope="col"
                className={cn(styles.th, styles.identityTh)}
                aria-label="Member"
              />
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn(styles.th, styles.booleanTh)}
                >
                  <div className={styles.colHeader}>
                    <span className={styles.colLabel}>{col.label}</span>
                    {col.count != null && (
                      <span className={styles.colCount}>{col.count}</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {rows.map((row) => {
              const activeSet =
                row.activeColumns instanceof Set
                  ? row.activeColumns
                  : new Set(row.activeColumns)
              return (
                <tr
                  key={row.id}
                  data-slot="matrix-table-row"
                  className={styles.bodyRow}
                >
                  {/* Sticky identity cell */}
                  <td className={cn(styles.td, styles.identityTd)}>
                    <div className={styles.identityCell}>
                      {renderIdentity(row.identity)}
                    </div>
                  </td>
                  {/* Cells — string cells render text; boolean cells render the indicator */}
                  {columns.map((col) => {
                    // A `cells` entry takes precedence over `activeColumns` for this column.
                    const cellValue: MatrixCellValue =
                      row.cells != null && col.id in row.cells
                        ? row.cells[col.id]
                        : activeSet.has(col.id)

                    // String cell: render plain text with the standard cell typography.
                    if (typeof cellValue !== "boolean") {
                      return (
                        <td
                          key={col.id}
                          className={cn(styles.td, styles.textTd)}
                          aria-label={`${col.label}: ${cellValue}`}
                        >
                          <span className={styles.textCell}>{cellValue}</span>
                        </td>
                      )
                    }

                    // Boolean cell: render the existing active/inactive indicator.
                    const active = cellValue
                    return (
                      <td
                        key={col.id}
                        className={cn(styles.td, styles.booleanTd)}
                        aria-label={`${col.label}: ${active ? "assigned" : "not assigned"}`}
                      >
                        <div className={styles.booleanCell}>
                          <span
                            className={cn(
                              styles.booleanIndicator,
                              active
                                ? styles.booleanIndicatorActive
                                : styles.booleanIndicatorInactive
                            )}
                            aria-hidden="true"
                          >
                            {active && (
                              <CheckIcon
                                weight="bold"
                                className={styles.checkIcon}
                              />
                            )}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// forwardRef with generics — preserve TIdentity through the cast
const MatrixTable = React.forwardRef(MatrixTableInner) as <
  TIdentity = React.ReactNode,
>(
  props: MatrixTableProps<TIdentity> & {
    ref?: React.ForwardedRef<HTMLDivElement>
  }
) => ReturnType<typeof MatrixTableInner>

;(MatrixTable as unknown as { displayName: string }).displayName =
  "MatrixTable"

export { MatrixTable }
