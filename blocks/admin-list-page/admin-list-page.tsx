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
import {
  DataTable,
  type DataTableGroupRow,
  type DataTableRow,
  type DataTableRowTone,
} from "../../components/ui/data-table/data-table"
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
  /**
   * Replaces the default `<FilterBar>` entirely. When provided, all FilterBar-
   * specific props (`searchValue`, `onSearchChange`, `searchPlaceholder`,
   * `filters`, `activeFilters`, `onClearFilters`, `resultsCount`) are ignored.
   * Renders inside the header region with a
   * `data-slot="admin-list-page-custom-filter-bar"` wrapper. `hideFilterBar`
   * still wins over both default and custom bars.
   *
   * Dev-mode `console.warn` fires if `customFilterBar` is supplied alongside
   * any FilterBar-specific prop.
   */
  customFilterBar?: React.ReactNode

  // ── Data table ───────────────────────────────────────────────────────────
  columns: ColumnDef<TData, unknown>[]
  /**
   * Flat row data forwarded to DataTable. Optional — omit when supplying
   * `rows` (the discriminated-union grouped API) or when rendering a fully
   * custom table via `customFilterBar` + a non-table body. Defaults to `[]`
   * when omitted, which yields DataTable's empty state.
   */
  data?: TData[]
  /**
   * Mixed-order discriminated-union row list forwarded to DataTable. Use
   * this to interleave group headers and data rows (e.g., "Tonight",
   * "This week" sections). When `rows` is supplied, `data` is ignored —
   * dev-mode `console.warn` fires if both are passed.
   *
   * @example
   * <AdminListPage
   *   rows={[
   *     { kind: "group", id: "tonight", label: "Tonight" },
   *     { kind: "data",  id: "evt-1",   row: event1 },
   *     { kind: "group", id: "week",    label: "This week", count: 3 },
   *     { kind: "data",  id: "evt-2",   row: event2 },
   *   ]}
   * />
   */
  rows?: DataTableRow<TData>[]
  /**
   * Optional renderer for group rows. Receives the group descriptor and
   * returns the cell contents. Forwarded as-is to DataTable.
   */
  groupRowRenderer?: (group: DataTableGroupRow) => React.ReactNode
  /**
   * Map each data row to a semantic tone for a subtle background tint.
   * Forwarded as-is to DataTable — tones resolve to Visor surface tokens at
   * the CSS layer (see `data-table.module.css`).
   */
  rowTone?: (row: TData) => DataTableRowTone | undefined
  /**
   * When supplied, every data row becomes a keyboard-activatable target
   * (click + Enter/Space dispatch the handler). Forwarded as-is to
   * DataTable. Typical use: open a detail drawer for the clicked row.
   */
  onRowClick?: (row: TData) => void
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

  // ── Footer status ────────────────────────────────────────────────────────
  /**
   * Always-on info row rendered below the table, as a sibling of the table
   * section (direct child of the block root). Independent of `BulkActionBar`
   * — the two can coexist. Typical content is a selection count, total, and
   * Kbd hint cluster.
   *
   * Wrapped in a `data-slot="admin-list-page-footer-status"` element for CSS
   * hooks. Consumer composes the row layout (flat slot, not structured).
   *
   * BREAKING (VI-404): previously rendered inside the table section; now
   * rendered as a sibling. Consumers using descendant selectors of the form
   * `[data-slot="admin-list-page-table"] [data-slot="admin-list-page-footer-status"]`
   * will silently stop matching — drop the `admin-list-page-table` ancestor.
   */
  footerStatus?: React.ReactNode
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
    customFilterBar,
    // Data table
    columns,
    data,
    rows,
    groupRowRenderer,
    rowTone,
    onRowClick,
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
    // Footer status
    footerStatus,
    // Root
    className,
    ...rest
  } = props

  // Dev-mode warning when both `rows` and `data` are supplied. `rows` wins
  // silently inside DataTable; the warning surfaces the mistake without
  // breaking render output.
  if (
    process.env.NODE_ENV !== "production" &&
    rows !== undefined &&
    data !== undefined
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "AdminListPage: both `rows` and `data` were supplied. The `rows` prop replaces `data` and wins; the `data` prop is ignored. Pass only one."
    )
  }

  // Dev-mode warning when customFilterBar is mixed with FilterBar-specific props.
  // The custom bar wins silently; the warning surfaces the mistake without
  // breaking render output.
  if (process.env.NODE_ENV !== "production" && customFilterBar !== undefined) {
    const conflicting: string[] = []
    if (searchValue !== undefined) conflicting.push("searchValue")
    if (onSearchChange !== undefined) conflicting.push("onSearchChange")
    if (searchPlaceholder !== undefined) conflicting.push("searchPlaceholder")
    if (filters !== undefined) conflicting.push("filters")
    if (activeFilters !== undefined) conflicting.push("activeFilters")
    if (onClearFilters !== undefined) conflicting.push("onClearFilters")
    if (resultsCount !== undefined) conflicting.push("resultsCount")
    if (conflicting.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `AdminListPage: \`customFilterBar\` was supplied alongside FilterBar-specific prop(s): ${conflicting.join(", ")}. The custom filter bar replaces the default FilterBar entirely; the FilterBar-specific props are ignored.`
      )
    }
  }

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

        {hideFilterBar ? null : customFilterBar !== undefined ? (
          <div data-slot="admin-list-page-custom-filter-bar">
            {customFilterBar}
          </div>
        ) : (
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
          data={data ?? []}
          rows={rows}
          groupRowRenderer={groupRowRenderer}
          rowTone={rowTone}
          onRowClick={onRowClick}
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

      {footerStatus !== undefined ? (
        <div
          data-slot="admin-list-page-footer-status"
          className={styles.footerStatus}
        >
          {footerStatus}
        </div>
      ) : null}
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
