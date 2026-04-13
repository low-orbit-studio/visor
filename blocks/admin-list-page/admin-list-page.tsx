"use client"

import * as React from "react"
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"

import { cn } from "../../lib/utils"
import {
  PageHeader,
  type PageHeaderProps,
} from "../../components/ui/page-header/page-header"
import { FilterBar } from "../../components/ui/filter-bar/filter-bar"
import { DataTable } from "../../components/ui/data-table/data-table"
import { BulkActionBar } from "../../components/ui/bulk-action-bar/bulk-action-bar"
import styles from "./admin-list-page.module.css"

export interface AdminListPageProps<TData>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  // ── Header ───────────────────────────────────────────────────────────────
  /** Page title rendered inside the PageHeader. */
  title: React.ReactNode
  /** Optional small uppercase label rendered above the title. */
  eyebrow?: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode
  /** Optional actions slot rendered on the right side of the header. */
  actions?: React.ReactNode
  /** Optional breadcrumb rendered above the title row. */
  breadcrumb?: React.ReactNode
  /** Heading level used for the PageHeader title. Defaults to `h1`. */
  titleAs?: PageHeaderProps["titleAs"]

  // ── Filter bar ───────────────────────────────────────────────────────────
  /**
   * Controlled search value. Pass with `onSearchChange` to enable the search
   * input. You own the state and filtering logic:
   * @example
   * const [search, setSearch] = React.useState('');
   * const filtered = data.filter(row => row.name.includes(search));
   * <AdminListPage searchValue={search} onSearchChange={setSearch} data={filtered} />
   */
  searchValue?: string
  /** Handler invoked when the search input changes. Pair with `searchValue`. */
  onSearchChange?: (value: string) => void
  /** Placeholder for the search input. Defaults to "Search...". */
  searchPlaceholder?: string
  /** Filter controls rendered inside the FilterBar. */
  filters?: React.ReactNode
  /** Active filter chips rendered below the FilterBar. */
  activeFilters?: Array<{
    id: string
    label: React.ReactNode
    onRemove: () => void
  }>
  /** Handler invoked when the clear-all filters button is clicked. */
  onClearFilters?: () => void
  /** Meta text rendered on the far right of the FilterBar, e.g. "42 results". */
  resultsCount?: React.ReactNode
  /** Hide the FilterBar entirely. Defaults to `false`. */
  hideFilterBar?: boolean

  // ── Data table ───────────────────────────────────────────────────────────
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  getRowId?: (row: TData, index: number) => string

  sorting?: SortingState
  onSortingChange?: OnChangeFn<SortingState>

  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageSize?: number
  pageSizeOptions?: number[]

  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  /** Enable row selection checkboxes. Defaults to `false`. */
  enableRowSelection?: boolean

  loading?: boolean
  /** Custom empty state forwarded to the DataTable. */
  emptyState?: React.ReactNode

  // ── Bulk actions ─────────────────────────────────────────────────────────
  /** Action buttons cluster — rendered only when selection count > 0. */
  bulkActions?: React.ReactNode
  /** Render the BulkActionBar inline (non-sticky). Defaults to `false`. */
  bulkActionBarInline?: boolean
  /** Selection label renderer. Defaults to `(n) => `${n} selected``. */
  bulkActionLabel?: (count: number) => React.ReactNode
}

function countSelectedRows(state: RowSelectionState): number {
  let count = 0
  for (const key in state) {
    if (state[key]) count += 1
  }
  return count
}

function AdminListPageInner<TData>(
  props: AdminListPageProps<TData>,
  ref: React.Ref<HTMLDivElement>
) {
  const {
    // Header
    title,
    eyebrow,
    description,
    actions,
    breadcrumb,
    titleAs = "h1",
    // Filter bar
    searchValue,
    onSearchChange,
    searchPlaceholder,
    filters,
    activeFilters,
    onClearFilters,
    resultsCount,
    hideFilterBar = false,
    // Data table
    columns,
    data,
    getRowId,
    sorting,
    onSortingChange,
    pagination,
    onPaginationChange,
    pageSize,
    pageSizeOptions,
    rowSelection: controlledRowSelection,
    onRowSelectionChange,
    enableRowSelection = false,
    loading,
    emptyState,
    // Bulk actions
    bulkActions,
    bulkActionBarInline = false,
    bulkActionLabel,
    // Root
    className,
    ...rest
  } = props

  // Uncontrolled row selection state, mirroring DataTable's pattern so the
  // block can drive the BulkActionBar without requiring consumers to lift state.
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

  const handleClearSelection = React.useCallback(() => {
    if (!selectionIsControlled) {
      setInternalRowSelection({})
    }
    onRowSelectionChange?.({})
  }, [selectionIsControlled, onRowSelectionChange])

  const selectedCount = countSelectedRows(rowSelection)
  const showBulkActionBar = Boolean(bulkActions) && selectedCount > 0

  return (
    <div
      ref={ref}
      data-slot="admin-list-page"
      className={cn(styles.root, className)}
      {...rest}
    >
      <header className={styles.header} data-slot="admin-list-page-header">
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          breadcrumb={breadcrumb}
          titleAs={titleAs}
        />

        {hideFilterBar ? null : (
          <FilterBar
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={searchPlaceholder}
            activeFilters={activeFilters}
            onClearAll={onClearFilters}
            resultsCount={resultsCount}
          >
            {filters}
          </FilterBar>
        )}
      </header>

      <section
        className={styles.tableSection}
        data-slot="admin-list-page-table"
        aria-label={typeof title === "string" ? title : undefined}
      >
        <DataTable<TData>
          columns={columns}
          data={data}
          getRowId={getRowId}
          sorting={sorting}
          onSortingChange={onSortingChange}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          enableRowSelection={enableRowSelection}
          rowSelection={rowSelection}
          onRowSelectionChange={handleRowSelectionChange}
          loading={loading}
          emptyState={emptyState}
        />

        {showBulkActionBar ? (
          <BulkActionBar
            count={selectedCount}
            inline={bulkActionBarInline}
            label={bulkActionLabel}
            onClear={handleClearSelection}
          >
            {bulkActions}
          </BulkActionBar>
        ) : null}
      </section>
    </div>
  )
}

// Generic forwardRef — cast preserves TData through the forwardRef boundary.
const AdminListPage = React.forwardRef(AdminListPageInner) as <TData>(
  props: AdminListPageProps<TData> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement

;(AdminListPage as unknown as { displayName: string }).displayName =
  "AdminListPage"

export { AdminListPage }
