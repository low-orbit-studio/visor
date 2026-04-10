"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import { SearchInput } from "../search-input/search-input"
import { Badge } from "../badge/badge"
import { Button } from "../button/button"
import styles from "./filter-bar.module.css"

export interface FilterBarChip {
  id: string
  label: React.ReactNode
  onRemove: () => void
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Controlled search value. Used only when `onSearchChange` is also provided. */
  searchValue?: string
  /**
   * Handler for search input changes. When omitted, the search input is not
   * rendered at all (the bar becomes filters + chips only).
   */
  onSearchChange?: (value: string) => void
  /** Placeholder for the search input. Defaults to "Search...". */
  searchPlaceholder?: string

  /** Filter controls provided by the consumer — typically `<Select>` or `<Combobox>`. */
  children?: React.ReactNode

  /** Active filter chips rendered as removable badges on the secondary row. */
  activeFilters?: FilterBarChip[]
  /**
   * Handler invoked when the clear-all button is clicked. The button only
   * renders when this is provided AND at least one filter is active or a
   * search value is present.
   */
  onClearAll?: () => void
  /** Label for the clear-all button. Defaults to "Clear all". */
  clearLabel?: React.ReactNode

  /** Meta text rendered on the far right, e.g. "42 results". */
  resultsCount?: React.ReactNode

  /** Tighter padding for dense admin layouts. */
  dense?: boolean
}

const FilterBar = React.forwardRef<HTMLDivElement, FilterBarProps>(
  (
    {
      className,
      searchValue,
      onSearchChange,
      searchPlaceholder = "Search...",
      children,
      activeFilters,
      onClearAll,
      clearLabel = "Clear all",
      resultsCount,
      dense = false,
      ...props
    },
    ref
  ) => {
    const chips = activeFilters ?? []
    const hasChips = chips.length > 0
    const hasSearchValue = Boolean(searchValue && String(searchValue).length > 0)
    const showClearAll = Boolean(onClearAll) && (hasChips || hasSearchValue)
    const showSearch = typeof onSearchChange === "function"

    const handleSearchChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange?.(event.target.value)
      },
      [onSearchChange]
    )

    const handleSearchClear = React.useCallback(() => {
      onSearchChange?.("")
    }, [onSearchChange])

    return (
      <div
        ref={ref}
        role="search"
        data-slot="filter-bar"
        data-dense={dense ? "true" : undefined}
        className={cn(styles.base, dense && styles.dense, className)}
        {...props}
      >
        <div data-slot="filter-bar-row" className={styles.row}>
          {showSearch ? (
            <div
              data-slot="filter-bar-search"
              className={styles.searchSlot}
            >
              <SearchInput
                value={searchValue ?? ""}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                placeholder={searchPlaceholder}
              />
            </div>
          ) : null}

          {children ? (
            <div
              data-slot="filter-bar-filters"
              className={styles.filters}
            >
              {children}
            </div>
          ) : null}

          <div
            data-slot="filter-bar-meta"
            className={styles.meta}
          >
            {resultsCount !== undefined && resultsCount !== null ? (
              <span
                data-slot="filter-bar-results"
                className={styles.results}
                aria-live="polite"
              >
                {resultsCount}
              </span>
            ) : null}
            {showClearAll ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                data-slot="filter-bar-clear"
                className={styles.clearButton}
              >
                {clearLabel}
              </Button>
            ) : null}
          </div>
        </div>

        {hasChips ? (
          <div
            data-slot="filter-bar-chips"
            className={styles.chips}
            role="list"
          >
            {chips.map((chip) => {
              const ariaLabel =
                typeof chip.label === "string"
                  ? `Remove filter: ${chip.label}`
                  : "Remove filter"
              return (
                <Badge
                  key={chip.id}
                  variant="secondary"
                  data-slot="filter-bar-chip"
                  className={styles.chip}
                  role="listitem"
                >
                  <span className={styles.chipLabel}>{chip.label}</span>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={chip.onRemove}
                    aria-label={ariaLabel}
                  >
                    <X aria-hidden="true" />
                  </button>
                </Badge>
              )
            })}
          </div>
        ) : null}
      </div>
    )
  }
)
FilterBar.displayName = "FilterBar"

export { FilterBar }
