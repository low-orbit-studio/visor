import * as React from "react"

import { cn } from "../../lib/utils"
import styles from "./right-rail-list.module.css"

export type RightRailListTone =
  | "default"
  | "mint"
  | "muted"
  | "warn"

export interface RightRailRow {
  /** Stable key for the row. */
  id: string
  /**
   * Optional leading slot — short label (e.g. "Sun"), avatar, badge,
   * status dot, or any other compact stamp anchoring the row's left edge.
   */
  leading?: React.ReactNode
  /**
   * Primary content — typically a link or plain text. Truncates with
   * ellipsis when overflowing the row.
   */
  primary: React.ReactNode
  /**
   * Optional trailing slot — count, value, or status word rendered at the
   * row's right edge.
   */
  trailing?: React.ReactNode
  /**
   * Tone applied to the trailing element via `data-tone`. Defaults to
   * `"default"`. Tones bind to the shared semantic text tokens so they
   * resolve correctly under every theme.
   */
  trailingTone?: RightRailListTone
}

type RootElement = "ul" | "ol" | "div"

export interface RightRailListProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Row data — each entry renders as a single list row. */
  rows: RightRailRow[]
  /**
   * Tighter vertical padding for high-density rails. Defaults to `false`.
   */
  compact?: boolean
  /**
   * Root element. Defaults to `"ul"`. Use `"ol"` for ordered rankings
   * (e.g. top promoters) or `"div"` when the surrounding context already
   * provides list semantics.
   */
  as?: RootElement
}

const RightRailList = React.forwardRef<HTMLElement, RightRailListProps>(
  function RightRailList(
    { rows, compact = false, as = "ul", className, ...rest },
    ref
  ) {
    const Root = as as React.ElementType
    const RowTag: React.ElementType = as === "div" ? "div" : "li"

    return (
      <Root
        ref={ref as React.Ref<HTMLElement>}
        className={cn(styles.root, compact && styles.rootCompact, className)}
        data-slot="right-rail-list"
        data-compact={compact ? "true" : undefined}
        {...rest}
      >
        {rows.map((row) => (
          <RowTag
            key={row.id}
            className={styles.row}
            data-slot="right-rail-list-row"
          >
            {row.leading !== undefined && row.leading !== null ? (
              <span
                className={styles.leading}
                data-slot="right-rail-list-leading"
              >
                {row.leading}
              </span>
            ) : null}
            <span
              className={styles.primary}
              data-slot="right-rail-list-primary"
            >
              {row.primary}
            </span>
            {row.trailing !== undefined && row.trailing !== null ? (
              <span
                className={styles.trailing}
                data-slot="right-rail-list-trailing"
                data-tone={row.trailingTone ?? "default"}
              >
                {row.trailing}
              </span>
            ) : null}
          </RowTag>
        ))}
      </Root>
    )
  }
)

RightRailList.displayName = "RightRailList"

export { RightRailList }
