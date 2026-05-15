import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./status-dot.module.css"

export type StatusDotTone = "mint" | "warn" | "muted" | "danger" | "info"

export interface StatusDotProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Tone. Defaults to `"muted"`. */
  tone?: StatusDotTone
  /**
   * When supplied, the dot is announced as a labeled image instead of being
   * marked decorative. Use only when the dot stands alone — when it's
   * paired with adjacent status text, leave `aria-label` unset and let the
   * surrounding label carry the meaning.
   */
  "aria-label"?: string
}

/**
 * StatusDot — a 6×6px tone-tinted indicator dot.
 *
 * Composes inside `Badge`, `ActivityFeed` leading slots, table status cells,
 * and inline status text. Decorative by default (`aria-hidden="true"`);
 * supplying `aria-label` flips it into a labeled `role="img"` so screen
 * readers announce the standalone state.
 */
const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  ({ className, tone = "muted", ...props }, ref) => {
    const hasLabel = props["aria-label"] !== undefined
    return (
      <span
        ref={ref}
        data-slot="status-dot"
        data-tone={tone}
        role={hasLabel ? "img" : undefined}
        aria-hidden={hasLabel ? undefined : true}
        className={cn(styles.dot, className)}
        {...props}
      />
    )
  }
)
StatusDot.displayName = "StatusDot"

export { StatusDot }
