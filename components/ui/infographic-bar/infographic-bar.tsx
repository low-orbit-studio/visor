import * as React from "react"
import { cn } from "../../../lib/utils"
import { StatCard, type StatCardProps } from "../stat-card/stat-card"
import styles from "./infographic-bar.module.css"

/**
 * One cell in the band. A focused subset of {@link StatCardProps} — the bar
 * owns layout-level concerns (`size`, chrome), so those props live on the bar,
 * not the cell. Picking from `StatCardProps` keeps the cell API in lockstep
 * with stat-card and avoids prop drift.
 */
export type InfographicBarStat = Pick<
  StatCardProps,
  | "label"
  | "value"
  | "delta"
  | "trend"
  | "trendPosition"
  | "footer"
  | "valueAs"
  | "variant"
> & {
  /** Stable React key for the cell. Falls back to the array index when omitted. */
  id?: string
}

export interface InfographicBarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Ordered stat cells, rendered left-to-right as a single continuous band. */
  stats: InfographicBarStat[]
  /** Dimensional density forwarded to every cell. Defaults to `"md"`. */
  size?: StatCardProps["size"]
}

/**
 * InfographicBar composes N {@link StatCard}s into one continuous band: outer
 * corners rounded, inner corners square, hairline dividers between cells, and
 * no full per-card borders. Theme-agnostic — the outer frame follows
 * `--border-default` (so borderless themes drop it) and dividers follow
 * `--hairline` (retunable via `--infographic-bar-divider`).
 */
const InfographicBar = React.forwardRef<HTMLDivElement, InfographicBarProps>(
  ({ className, stats, size = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="infographic-bar"
        className={cn(styles.bar, className)}
        {...props}
      >
        {stats.map(({ id, ...stat }, index) => (
          <StatCard
            key={id ?? index}
            size={size}
            className={styles.cell}
            {...stat}
          />
        ))}
      </div>
    )
  }
)
InfographicBar.displayName = "InfographicBar"

export { InfographicBar }
