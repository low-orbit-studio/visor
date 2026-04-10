import * as React from "react"
import { cn } from "../../../lib/utils"
import { Badge } from "../badge/badge"
import type { BadgeProps } from "../badge/badge"
import styles from "./status-badge.module.css"

export type StatusBadgeStatus =
  | "healthy"
  | "degraded"
  | "down"
  | "failed"
  | "running"
  | "pending"
  | "queued"
  | "idle"
  | "complete"

export type StatusBadgeTone = "subtle" | "filled"

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Semantic admin status. Drives both color and default label. */
  status: StatusBadgeStatus
  /** Visible text. Defaults to the capitalized status key. */
  label?: React.ReactNode
  /** Which Badge variant family to use. Defaults to "subtle". */
  tone?: StatusBadgeTone
  /** Render the leading indicator dot. Defaults to true. */
  indicator?: boolean
  /** Animate the indicator dot with a soft pulse. Defaults to false. */
  pulse?: boolean
}

/**
 * Default human-readable labels for each status. Exported so consumers can
 * localize or override without reimplementing the map.
 */
export const statusBadgeLabels: Record<StatusBadgeStatus, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
  failed: "Failed",
  running: "Running",
  pending: "Pending",
  queued: "Queued",
  idle: "Idle",
  complete: "Complete",
}

type BadgeVariant = NonNullable<BadgeProps["variant"]>

/**
 * Color group keyed on the semantic status. Used to pick the indicator dot
 * class and the underlying Badge variant.
 */
type StatusColorGroup =
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "neutral"

const STATUS_COLOR_GROUP: Record<StatusBadgeStatus, StatusColorGroup> = {
  healthy: "success",
  complete: "success",
  degraded: "warning",
  pending: "warning",
  down: "destructive",
  failed: "destructive",
  running: "info",
  queued: "neutral",
  idle: "neutral",
}

const SUBTLE_VARIANT: Record<StatusColorGroup, BadgeVariant> = {
  success: "success",
  warning: "warning",
  destructive: "destructive",
  info: "info",
  neutral: "secondary",
}

const FILLED_VARIANT: Record<StatusColorGroup, BadgeVariant> = {
  success: "filled-success",
  warning: "filled-warning",
  destructive: "filled-destructive",
  info: "filled-info",
  // No `filled-secondary` exists on Badge — fall back to secondary.
  neutral: "secondary",
}

const INDICATOR_CLASS: Record<StatusColorGroup, string> = {
  success: styles.indicatorSuccess,
  warning: styles.indicatorWarning,
  destructive: styles.indicatorDestructive,
  info: styles.indicatorInfo,
  neutral: styles.indicatorNeutral,
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      className,
      status,
      label,
      tone = "subtle",
      indicator = true,
      pulse = false,
      ...props
    },
    ref
  ) => {
    const group = STATUS_COLOR_GROUP[status]
    const variant: BadgeVariant =
      tone === "filled" ? FILLED_VARIANT[group] : SUBTLE_VARIANT[group]
    const visibleLabel = label ?? statusBadgeLabels[status]

    return (
      <Badge
        ref={ref}
        variant={variant}
        data-slot="status-badge"
        data-status={status}
        data-tone={tone}
        className={cn(className)}
        {...props}
      >
        {indicator ? (
          <span
            data-slot="status-badge-indicator"
            aria-hidden="true"
            className={cn(
              styles.indicator,
              INDICATOR_CLASS[group],
              pulse && styles.pulse
            )}
          />
        ) : null}
        <span className={styles.srOnly}>Status: </span>
        <span data-slot="status-badge-label">{visibleLabel}</span>
      </Badge>
    )
  }
)
StatusBadge.displayName = "StatusBadge"

export { StatusBadge }
