"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./activity-feed.module.css"

type ActivityFeedVariant = "default" | "compact" | "timeline"

interface ActivityFeedContextValue {
  variant: ActivityFeedVariant
}

const ActivityFeedContext = React.createContext<ActivityFeedContextValue>({
  variant: "default",
})

export interface ActivityFeedProps
  extends React.HTMLAttributes<HTMLOListElement> {
  /** Display mode for the feed. */
  variant?: ActivityFeedVariant
  /** ActivityFeedItem children. */
  children?: React.ReactNode
}

const variantClass: Record<ActivityFeedVariant, string> = {
  default: styles.variantDefault,
  compact: styles.variantCompact,
  timeline: styles.variantTimeline,
}

const ActivityFeedRoot = React.forwardRef<HTMLOListElement, ActivityFeedProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const contextValue = React.useMemo(() => ({ variant }), [variant])
    return (
      <ActivityFeedContext.Provider value={contextValue}>
        <ol
          ref={ref}
          data-slot="activity-feed"
          data-variant={variant}
          className={cn(styles.base, variantClass[variant], className)}
          {...props}
        >
          {children}
        </ol>
      </ActivityFeedContext.Provider>
    )
  }
)
ActivityFeedRoot.displayName = "ActivityFeed"

export interface ActivityFeedItemProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  /** Leading visual — icon, avatar, or colored dot. */
  leading?: React.ReactNode
  /** Primary event description. Required. */
  title: React.ReactNode
  /** Optional secondary detail. */
  description?: React.ReactNode
  /** Who performed the event (e.g. name or avatar + name cluster). */
  actor?: React.ReactNode
  /**
   * Pre-formatted timestamp. Pass a string, or pass your own `<time>` element
   * for full control over the `dateTime` attribute and semantics.
   */
  timestamp: React.ReactNode
  /** Right-aligned meta slot — status badge, link, etc. */
  trailing?: React.ReactNode
}

const ActivityFeedItem = React.forwardRef<HTMLLIElement, ActivityFeedItemProps>(
  (
    {
      className,
      leading,
      title,
      description,
      actor,
      timestamp,
      trailing,
      ...props
    },
    ref
  ) => {
    const { variant } = React.useContext(ActivityFeedContext)

    return (
      <li
        ref={ref}
        data-slot="activity-feed-item"
        data-variant={variant}
        className={cn(styles.item, variantClass[variant], className)}
        {...props}
      >
        <span data-slot="activity-feed-leading" className={styles.leading}>
          {leading}
        </span>
        <div data-slot="activity-feed-body" className={styles.body}>
          <div data-slot="activity-feed-header" className={styles.header}>
            <div data-slot="activity-feed-heading" className={styles.heading}>
              <span data-slot="activity-feed-title" className={styles.title}>
                {title}
              </span>
              {actor ? (
                <span data-slot="activity-feed-actor" className={styles.actor}>
                  {actor}
                </span>
              ) : null}
            </div>
            {trailing ? (
              <span
                data-slot="activity-feed-trailing"
                className={styles.trailing}
              >
                {trailing}
              </span>
            ) : null}
          </div>
          {description ? (
            <p
              data-slot="activity-feed-description"
              className={styles.description}
            >
              {description}
            </p>
          ) : null}
          <span data-slot="activity-feed-timestamp" className={styles.timestamp}>
            {timestamp}
          </span>
        </div>
      </li>
    )
  }
)
ActivityFeedItem.displayName = "ActivityFeedItem"

type ActivityFeedComponent = typeof ActivityFeedRoot & {
  Item: typeof ActivityFeedItem
}

const ActivityFeed = ActivityFeedRoot as ActivityFeedComponent
ActivityFeed.Item = ActivityFeedItem

export { ActivityFeed, ActivityFeedItem }
