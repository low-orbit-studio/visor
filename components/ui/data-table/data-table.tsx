"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Table as TanstackTable,
} from "@tanstack/react-table"
import {
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretUpIcon,
  CaretUpDownIcon,
} from "@phosphor-icons/react"

import { cn } from "../../../lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table/table"
import { Button } from "../button/button"
import { Checkbox } from "../checkbox/checkbox"
import { Skeleton } from "../skeleton/skeleton"
import { EmptyState } from "../empty-state/empty-state"
import styles from "./data-table.module.css"

export type {
  ColumnDef,
  SortingState,
  RowSelectionState,
  PaginationState,
  OnChangeFn,
}

export interface DataTableProps<TData, TValue = unknown>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]

  // Sorting
  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>
  defaultSorting?: SortingState

  // Pagination
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageSize?: number
  pageSizeOptions?: number[]

  // Selection
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  getRowId?: (row: TData, index: number) => string

  // Global filter
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void

  // States
  loading?: boolean
  emptyState?: React.ReactNode

  // Layout
  stickyHeader?: boolean
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

function DataTableInner<TData, TValue = unknown>(
  props: DataTableProps<TData, TValue>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {
    columns: userColumns,
    data,
    sorting: controlledSorting,
    onSortingChange,
    defaultSorting,
    pagination: controlledPagination,
    onPaginationChange,
    pageSize = 10,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    enableRowSelection = false,
    rowSelection: controlledRowSelection,
    onRowSelectionChange,
    getRowId,
    globalFilter: controlledGlobalFilter,
    onGlobalFilterChange,
    loading = false,
    emptyState,
    stickyHeader = false,
    className,
    ...rest
  } = props

  // Uncontrolled sorting state
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    defaultSorting ?? []
  )
  const sortingIsControlled = controlledSorting !== undefined
  const sorting = sortingIsControlled ? controlledSorting : internalSorting
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (!sortingIsControlled) {
      setInternalSorting((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      )
    }
    onSortingChange?.(updater)
  }

  // Uncontrolled pagination state
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({ pageIndex: 0, pageSize })
  const paginationIsControlled = controlledPagination !== undefined
  const pagination = paginationIsControlled
    ? controlledPagination
    : internalPagination
  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    if (!paginationIsControlled) {
      setInternalPagination((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      )
    }
    onPaginationChange?.(updater)
  }

  // Uncontrolled selection state
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({})
  const selectionIsControlled = controlledRowSelection !== undefined
  const rowSelection = selectionIsControlled
    ? controlledRowSelection
    : internalRowSelection
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    if (!selectionIsControlled) {
      setInternalRowSelection((prev) =>
        typeof updater === "function" ? updater(prev) : updater
      )
    }
    onRowSelectionChange?.(updater)
  }

  // Global filter
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("")
  const globalFilterIsControlled = controlledGlobalFilter !== undefined
  const globalFilter = globalFilterIsControlled
    ? controlledGlobalFilter
    : internalGlobalFilter
  const handleGlobalFilterChange = (value: unknown) => {
    const next = typeof value === "function" ? (value as (p: string) => string)(globalFilter) : (value as string)
    if (!globalFilterIsControlled) {
      setInternalGlobalFilter(next ?? "")
    }
    onGlobalFilterChange?.(next ?? "")
  }

  // Inject a selection column when enabled
  const columns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return userColumns
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "__select",
      enableSorting: false,
      size: 40,
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows"
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(value === true)
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label="Select row"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
        />
      ),
    }
    return [selectionColumn, ...userColumns]
  }, [enableRowSelection, userColumns])

  const table: TanstackTable<TData> = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      pagination,
      rowSelection,
      globalFilter,
    },
    enableRowSelection,
    getRowId,
    onSortingChange: handleSortingChange,
    onPaginationChange: handlePaginationChange,
    onRowSelectionChange: handleRowSelectionChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const totalRows = table.getFilteredRowModel().rows.length
  const pageRows = table.getRowModel().rows
  const colCount = columns.length
  const pageIndex = table.getState().pagination.pageIndex
  const currentPageSize = table.getState().pagination.pageSize
  const pageCount = table.getPageCount()
  const firstRow = totalRows === 0 ? 0 : pageIndex * currentPageSize + 1
  const lastRow = Math.min((pageIndex + 1) * currentPageSize, totalRows)

  const isEmpty = !loading && data.length === 0
  const defaultEmpty = <EmptyState heading="No results" tone="subtle" />

  return (
    <div
      ref={ref}
      data-slot="data-table"
      className={cn(styles.root, className)}
      {...rest}
    >
      <Table>
        <TableHeader
          className={cn(stickyHeader && styles.stickyHeader)}
          data-sticky={stickyHeader || undefined}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                const ariaSort: React.AriaAttributes["aria-sort"] =
                  sortDir === "asc"
                    ? "ascending"
                    : sortDir === "desc"
                      ? "descending"
                      : canSort
                        ? "none"
                        : undefined
                const headerContent = header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                const columnLabel =
                  typeof header.column.columnDef.header === "string"
                    ? (header.column.columnDef.header as string)
                    : header.column.id
                const nextSortStateLabel =
                  sortDir === "asc"
                    ? "descending"
                    : sortDir === "desc"
                      ? "unsorted"
                      : "ascending"
                return (
                  <TableHead
                    key={header.id}
                    aria-sort={ariaSort}
                    style={{
                      width:
                        header.column.id === "__select" ? "40px" : undefined,
                    }}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        className={styles.sortButton}
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={`${columnLabel}, sort ${nextSortStateLabel}`}
                      >
                        <span className={styles.sortLabel}>
                          {headerContent}
                        </span>
                        <span className={styles.sortIcon} aria-hidden="true">
                          {sortDir === "asc" ? (
                            <CaretUpIcon weight="bold" />
                          ) : sortDir === "desc" ? (
                            <CaretDownIcon weight="bold" />
                          ) : (
                            <CaretUpDownIcon weight="bold" />
                          )}
                        </span>
                      </button>
                    ) : (
                      headerContent
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: currentPageSize }).map((_, rowIdx) => (
              <TableRow key={`skeleton-${rowIdx}`} data-slot="data-table-skeleton-row">
                {columns.map((_col, colIdx) => (
                  <TableCell key={`skeleton-${rowIdx}-${colIdx}`}>
                    <Skeleton className={styles.skeletonCell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : isEmpty ? (
            <TableRow data-slot="data-table-empty-row">
              <TableCell colSpan={colCount} className={styles.emptyCell}>
                {emptyState ?? defaultEmpty}
              </TableCell>
            </TableRow>
          ) : pageRows.length === 0 ? (
            <TableRow data-slot="data-table-empty-row">
              <TableCell colSpan={colCount} className={styles.emptyCell}>
                {emptyState ?? defaultEmpty}
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className={styles.footer} data-slot="data-table-footer">
        <div className={styles.footerInfo} aria-live="polite">
          {totalRows === 0
            ? "No results"
            : `Showing ${firstRow} to ${lastRow} of ${totalRows}`}
        </div>
        <div className={styles.footerControls}>
          <label className={styles.pageSizeLabel}>
            <span className={styles.pageSizeLabelText}>Rows per page</span>
            <select
              className={styles.pageSizeSelect}
              value={currentPageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              aria-label="Rows per page"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.pageNav}>
            <span className={styles.pageCounter}>
              Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <CaretLeftIcon weight="bold" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <CaretRightIcon weight="bold" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// forwardRef with generics — preserve TData through the cast
const DataTable = React.forwardRef(DataTableInner) as <
  TData,
  TValue = unknown,
>(
  props: DataTableProps<TData, TValue> & {
    ref?: React.ForwardedRef<HTMLDivElement>
  }
) => ReturnType<typeof DataTableInner>

;(DataTable as unknown as { displayName: string }).displayName = "DataTable"

export { DataTable }
