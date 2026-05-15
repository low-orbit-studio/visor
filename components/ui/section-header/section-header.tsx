import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./section-header.module.css"

type SectionHeaderElement = "header" | "div" | "section"

export interface SectionHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Uppercase tracking label rendered on the left. */
  title: React.ReactNode
  /** Optional right-aligned meta — count, timestamp, status. */
  meta?: React.ReactNode
  /** Root element tag. Defaults to `header`. */
  as?: SectionHeaderElement
}

const SectionHeader = React.forwardRef<HTMLElement, SectionHeaderProps>(
  ({ className, title, meta, as = "header", ...props }, ref) => {
    const Root = as as React.ElementType

    return (
      <Root
        ref={ref}
        data-slot="section-header"
        className={cn(styles.root, className)}
        {...props}
      >
        <span data-slot="section-header-title" className={styles.title}>
          {title}
        </span>
        {meta ? (
          <span data-slot="section-header-meta" className={styles.meta}>
            {meta}
          </span>
        ) : null}
      </Root>
    )
  }
)
SectionHeader.displayName = "SectionHeader"

export { SectionHeader }
