import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./key-value-list.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KeyValueItem {
  /** The term — rendered as `<dt>`. */
  label: React.ReactNode
  /** The value — rendered as `<dd>`. Accepts any node: Badge, AvatarStack,
   *  StatHero, ScoreIndicator, or plain text. */
  value: React.ReactNode
  /** Optional secondary text trailing the value (e.g. "/ 100", "142 total"). */
  hint?: React.ReactNode
}

export interface KeyValueListProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** The label/value pairs to render. */
  items: KeyValueItem[]
  /** Grid column count. Collapses responsively on narrow viewports. */
  columns?: 1 | 2 | 3 | 4
  /** `stacked` = label above value (facts panel); `horizontal` = label beside
   *  value (inspector). */
  orientation?: "horizontal" | "stacked"
  /** Row density. `editorial` is the admin-ui default. */
  density?: "compact" | "default" | "editorial"
  /** Root element. `dl` (default) renders semantic `<dl>`/`<dt>`/`<dd>`; `div`
   *  opts out of definition-list semantics. */
  as?: "dl" | "div"
}

// ─── KeyValueList ─────────────────────────────────────────────────────────────

const KeyValueList = React.forwardRef<HTMLElement, KeyValueListProps>(
  (
    {
      items,
      columns = 1,
      orientation = "stacked",
      density = "editorial",
      as = "dl",
      className,
      ...props
    },
    ref
  ) => {
    const isDl = as === "dl"
    const Root = (isDl ? "dl" : "div") as React.ElementType
    const Term = (isDl ? "dt" : "div") as React.ElementType
    const Desc = (isDl ? "dd" : "div") as React.ElementType

    return (
      <Root
        ref={ref}
        data-slot="key-value-list"
        data-columns={columns}
        data-orientation={orientation}
        data-density={density}
        className={cn(styles.root, className)}
        {...props}
      >
        {items.map((item, i) => (
          <div key={i} data-slot="key-value-item" className={styles.item}>
            <Term data-slot="key-value-label" className={styles.label}>
              {item.label}
            </Term>
            <Desc data-slot="key-value-value" className={styles.value}>
              {item.value}
              {item.hint != null ? (
                <span data-slot="key-value-hint" className={styles.hint}>
                  {item.hint}
                </span>
              ) : null}
            </Desc>
          </div>
        ))}
      </Root>
    )
  }
)
KeyValueList.displayName = "KeyValueList"

export { KeyValueList }
