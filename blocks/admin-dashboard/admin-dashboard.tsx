"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import {
  PageHeader,
  type PageHeaderProps,
} from "../../components/ui/page-header/page-header"
import {
  StatCard,
  type StatCardDelta,
  type StatCardProps,
} from "../../components/ui/stat-card/stat-card"
import {
  ActivityFeed,
  ActivityFeedItem,
} from "../../components/ui/activity-feed/activity-feed"
import { EmptyState } from "../../components/ui/empty-state/empty-state"
import styles from "./admin-dashboard.module.css"

export interface AdminDashboardStat {
  id: string
  label: React.ReactNode
  value: React.ReactNode
  delta?: StatCardDelta
  trend?: React.ReactNode
  variant?: "default" | "highlight"
  size?: "sm" | "md"
  valueAs?: StatCardProps["valueAs"]
}

export interface AdminDashboardActivity {
  id: string
  leading?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  actor?: React.ReactNode
  timestamp: React.ReactNode
  trailing?: React.ReactNode
}

export interface AdminDashboardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Page title rendered inside the PageHeader. */
  title: React.ReactNode
  /** Optional small uppercase label above the title. */
  eyebrow?: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode
  /** Optional actions slot rendered on the right side of the header. */
  actions?: React.ReactNode

  /** Stat cards rendered in the responsive grid. */
  stats: AdminDashboardStat[]

  /**
   * Body layout mode.
   * - `"single"` (default) renders the existing flow: stat grid → optional
   *   `secondaryRegion` → activity section. Backwards-compatible — every
   *   existing consumer renders unchanged when `layout` is omitted.
   * - `"split"` renders a 2-column body grid (`mainCol` left, `sideCol` right)
   *   below the stat strip. In split mode you compose the body yourself —
   *   the default activity feed and `secondaryRegion` are not rendered.
   */
  layout?: "single" | "split"

  /** Left column content. Only rendered when `layout="split"`. */
  mainCol?: React.ReactNode
  /** Right column content. Only rendered when `layout="split"`. */
  sideCol?: React.ReactNode

  /** Heading rendered above the activity feed. Defaults to "Recent activity". */
  activityTitle?: React.ReactNode
  /** Activity events rendered in the feed. Ignored when `layout="split"`. */
  activities: AdminDashboardActivity[]
  /** If provided, renders a "View all" link in the activity section header. */
  activityViewAllHref?: string
  /** Replaces the default EmptyState when `activities` is empty. */
  activityEmptyState?: React.ReactNode
  /** Variant forwarded to the underlying ActivityFeed. */
  activityVariant?: "default" | "compact" | "timeline"

  /**
   * Optional region rendered below the stat grid and above the activity feed.
   * Ignored when `layout="split"` — compose body content via `mainCol`/`sideCol`.
   */
  secondaryRegion?: React.ReactNode

  /** Heading level used for the PageHeader title. Defaults to `h1`. */
  titleAs?: PageHeaderProps["titleAs"]
}

export function AdminDashboard({
  title,
  eyebrow,
  description,
  actions,
  stats,
  layout = "single",
  mainCol,
  sideCol,
  activityTitle = "Recent activity",
  activities,
  activityViewAllHref,
  activityEmptyState,
  activityVariant = "default",
  secondaryRegion,
  titleAs = "h1",
  className,
  ...props
}: AdminDashboardProps) {
  const activityHeadingId = React.useId()
  const hasActivities = activities.length > 0
  const isSplit = layout === "split"

  // Dev-mode warning: in split mode the caller composes the body via mainCol /
  // sideCol, so any `activities` / `secondaryRegion` props are silently dropped.
  // Flag the mismatch loudly during development so consumers notice before
  // shipping. Suppressed in production to avoid noisy logs.
  if (
    isSplit &&
    process.env.NODE_ENV !== "production" &&
    (activities.length > 0 || secondaryRegion !== undefined)
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "[AdminDashboard] layout=\"split\" ignores `activities` and `secondaryRegion`. " +
        "Compose body content inside `mainCol` / `sideCol` instead."
    )
  }

  return (
    <div
      className={cn(styles.root, className)}
      data-slot="admin-dashboard"
      data-layout={layout}
      {...props}
    >
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={actions}
        titleAs={titleAs}
      />

      {stats.length > 0 ? (
        <div
          className={styles.statGrid}
          data-slot="admin-dashboard-stats"
          data-count={stats.length}
        >
          {stats.map((stat) => (
            <StatCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              delta={stat.delta}
              trend={stat.trend}
              variant={stat.variant}
              size={stat.size}
              valueAs={stat.valueAs}
            />
          ))}
        </div>
      ) : null}

      {isSplit ? (
        <div
          className={styles.body}
          data-slot="admin-dashboard-body"
          data-layout="split"
        >
          <div
            className={styles.mainCol}
            data-slot="admin-dashboard-main-col"
          >
            {mainCol}
          </div>
          <aside
            className={styles.sideCol}
            data-slot="admin-dashboard-side-col"
          >
            {sideCol}
          </aside>
        </div>
      ) : (
        <>
          {secondaryRegion ? (
            <div
              className={styles.secondaryRegion}
              data-slot="admin-dashboard-secondary"
            >
              {secondaryRegion}
            </div>
          ) : null}

          <section
            className={styles.activitySection}
            data-slot="admin-dashboard-activity"
            aria-labelledby={activityHeadingId}
          >
            <header className={styles.activityHeader}>
              <h2 id={activityHeadingId} className={styles.activityTitle}>
                {activityTitle}
              </h2>
              {activityViewAllHref ? (
                <a
                  href={activityViewAllHref}
                  className={styles.activityViewAll}
                  data-slot="admin-dashboard-activity-view-all"
                >
                  View all
                </a>
              ) : null}
            </header>

            {hasActivities ? (
              <ActivityFeed variant={activityVariant}>
                {activities.map((activity) => (
                  <ActivityFeedItem
                    key={activity.id}
                    leading={activity.leading}
                    title={activity.title}
                    description={activity.description}
                    actor={activity.actor}
                    timestamp={activity.timestamp}
                    trailing={activity.trailing}
                  />
                ))}
              </ActivityFeed>
            ) : activityEmptyState !== undefined ? (
              activityEmptyState
            ) : (
              <EmptyState
                heading="No recent activity"
                description="New events will show up here as they happen."
                tone="subtle"
              />
            )}
          </section>
        </>
      )}
    </div>
  )
}
