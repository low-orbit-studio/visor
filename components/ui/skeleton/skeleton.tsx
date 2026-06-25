import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./skeleton.module.css"

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="skeleton"
      className={cn(styles.skeleton, className)}
      {...props}
    />
  )
})
Skeleton.displayName = "Skeleton"

// ---------------------------------------------------------------------------
// SkeletonList — list-row loading placeholder
//
// Renders `count` rows, each with an avatar circle, two text lines, and an
// optional badge pill. Mirrors the list-row anatomy from the VI-584 spec.
// All shapes are `.skeleton` instances so they share the shimmer animation.
// ---------------------------------------------------------------------------
export interface SkeletonListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of placeholder rows to render. Defaults to 3. */
  count?: number
}

const SkeletonList = React.forwardRef<HTMLDivElement, SkeletonListProps>(
  ({ count = 3, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading list"
        data-slot="skeleton-list"
        className={cn(styles.skeletonList, className)}
        {...props}
      >
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className={styles.skeletonListRow}>
            {/* Avatar circle */}
            <div
              className={cn(styles.skeleton, styles.skeletonAvatar)}
              aria-hidden="true"
            />
            {/* Text column */}
            <div className={styles.skeletonListText}>
              <div
                className={cn(styles.skeleton, styles.skeletonLineHeading, styles.skeletonW40)}
                aria-hidden="true"
              />
              <div
                className={cn(styles.skeleton, styles.skeletonLineBody, styles.skeletonW70)}
                aria-hidden="true"
              />
            </div>
            {/* Badge pill */}
            <div
              className={cn(styles.skeleton, styles.skeletonBadge)}
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    )
  }
)
SkeletonList.displayName = "SkeletonList"

// ---------------------------------------------------------------------------
// SkeletonTable — table-row loading placeholder
//
// Renders `rows` rows with `columns` cells each. Useful for data tables where
// the row height and column count mirror the real table structure.
// ---------------------------------------------------------------------------
export interface SkeletonTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of table rows to render. Defaults to 4. */
  rows?: number
  /** Number of columns per row. Defaults to 4. */
  columns?: number
}

const SkeletonTable = React.forwardRef<HTMLDivElement, SkeletonTableProps>(
  ({ rows = 4, columns = 4, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading table"
        data-slot="skeleton-table"
        className={cn(styles.skeletonTable, className)}
        {...props}
      >
        {Array.from({ length: rows }, (_, ri) => (
          <div key={ri} className={styles.skeletonTableRow}>
            {Array.from({ length: columns }, (_, ci) => {
              // Vary widths across cells so rows look organic, not uniform
              const widthClass =
                ci === 0
                  ? styles.skeletonW60
                  : ci === columns - 1
                  ? styles.skeletonW40
                  : styles.skeletonW80
              return (
                <div key={ci} className={styles.skeletonTableCell}>
                  <div
                    className={cn(styles.skeleton, styles.skeletonLineBody, widthClass)}
                    aria-hidden="true"
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }
)
SkeletonTable.displayName = "SkeletonTable"

// ---------------------------------------------------------------------------
// SkeletonDetail — detail / profile-view loading placeholder
//
// Renders a large avatar block, a heading-height line, and a block of body
// text lines. Useful for detail panels, profile pages, and sidebars.
// ---------------------------------------------------------------------------
export interface SkeletonDetailProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of body text lines below the heading. Defaults to 3. */
  lines?: number
}

const SkeletonDetail = React.forwardRef<HTMLDivElement, SkeletonDetailProps>(
  ({ lines = 3, className, ...props }, ref) => {
    // Alternate widths for body lines: 80%, 70%, 60%, repeat
    const lineWidths = [styles.skeletonW80, styles.skeletonW70, styles.skeletonW60]

    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading detail"
        data-slot="skeleton-detail"
        className={cn(styles.skeletonDetail, className)}
        {...props}
      >
        {/* Large avatar / thumbnail */}
        <div
          className={cn(styles.skeleton, styles.skeletonAvatarLg)}
          aria-hidden="true"
        />
        {/* Content block */}
        <div className={styles.skeletonDetailContent}>
          {/* Heading line */}
          <div
            className={cn(styles.skeleton, styles.skeletonLineH1, styles.skeletonW60)}
            aria-hidden="true"
          />
          {/* Body lines */}
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={cn(
                styles.skeleton,
                styles.skeletonLineBody,
                lineWidths[i % lineWidths.length]
              )}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    )
  }
)
SkeletonDetail.displayName = "SkeletonDetail"

export { Skeleton, SkeletonList, SkeletonTable, SkeletonDetail }
