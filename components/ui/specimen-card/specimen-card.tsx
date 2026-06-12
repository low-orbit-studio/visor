import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./specimen-card.module.css"

// ─── SpecimenCard ────────────────────────────────────────────────────────────

export interface SpecimenCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Context token label (e.g. "error", "onboarding", "success"). Rendered uppercase. */
  context: string
  /** Italic feel descriptor (e.g. "warm, accountable"). Optional. */
  feel?: string
}

const SpecimenCard = React.forwardRef<HTMLDivElement, SpecimenCardProps>(
  ({ className, context, feel, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="specimen-card"
        className={cn(styles.card, className)}
        {...props}
      >
        <div data-slot="specimen-card-label" className={styles.labelRow}>
          <span className={styles.contextLabel}>{context}</span>
          {feel ? (
            <span className={styles.feelText}>{feel}</span>
          ) : null}
        </div>
        <div data-slot="specimen-card-body" className={styles.body}>
          {children}
        </div>
      </div>
    )
  }
)
SpecimenCard.displayName = "SpecimenCard"

// ─── SpecimenCardFooter ──────────────────────────────────────────────────────

export type SpecimenCardFooterProps = React.HTMLAttributes<HTMLDivElement>

const SpecimenCardFooter = React.forwardRef<
  HTMLDivElement,
  SpecimenCardFooterProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="specimen-card-footer"
      className={cn(styles.footer, className)}
      {...props}
    >
      {children}
    </div>
  )
})
SpecimenCardFooter.displayName = "SpecimenCardFooter"

export { SpecimenCard, SpecimenCardFooter }
