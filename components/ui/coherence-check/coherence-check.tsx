import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Warning, X } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./coherence-check.module.css"

// ─── CheckGroup ─────────────────────────────────────────────────────────────

export interface CheckGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Group header label (rendered uppercase). */
  heading: string
}

const CheckGroup = React.forwardRef<HTMLDivElement, CheckGroupProps>(
  ({ className, heading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="check-group"
        className={cn(styles.group, className)}
        {...props}
      >
        <p className={styles.groupHeading}>{heading}</p>
        {children}
      </div>
    )
  }
)
CheckGroup.displayName = "CheckGroup"

// ─── CheckRow variants ───────────────────────────────────────────────────────

const checkRowVariants = cva(styles.row, {
  variants: {
    state: {
      pass: styles.statePass,
      warn: styles.stateWarn,
      fail: styles.stateFail,
    },
  },
  defaultVariants: {
    state: "pass",
  },
})

// ─── Icon lookup ─────────────────────────────────────────────────────────────

const STATE_ICON = {
  pass: Check,
  warn: Warning,
  fail: X,
} as const

// ─── CheckRow ────────────────────────────────────────────────────────────────

export interface CheckRowProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof checkRowVariants> {
  /** Check title / finding label. */
  title: string
  /**
   * Supporting description. Supports inline `<code>` elements for token names.
   * Pass a React node to use `<code>` inline; pass a string for plain text.
   */
  description?: React.ReactNode
  /**
   * Label for the ghost Fix action button. When provided, the button renders
   * right-aligned. When omitted, no button is shown (e.g. pass rows).
   */
  fixLabel?: string
  /** Callback invoked when the Fix action button is clicked. */
  onFix?: () => void
}

const CheckRow = React.forwardRef<HTMLDivElement, CheckRowProps>(
  (
    {
      className,
      state,
      title,
      description,
      fixLabel,
      onFix,
      ...props
    },
    ref
  ) => {
    const resolvedState = state ?? "pass"
    const Icon = STATE_ICON[resolvedState]

    return (
      <div
        ref={ref}
        data-slot="check-row"
        data-state={resolvedState}
        className={cn(checkRowVariants({ state }), className)}
        {...props}
      >
        <span
          data-slot="check-row-icon"
          className={styles.icon}
          aria-hidden="true"
        >
          <Icon weight="bold" />
        </span>
        <div data-slot="check-row-body" className={styles.body}>
          <strong className={styles.rowTitle}>{title}</strong>
          {description != null && (
            <p className={styles.rowDescription}>{description}</p>
          )}
        </div>
        {fixLabel != null && (
          <button
            type="button"
            data-slot="check-row-fix"
            className={styles.fixButton}
            onClick={onFix}
          >
            {fixLabel}
          </button>
        )}
      </div>
    )
  }
)
CheckRow.displayName = "CheckRow"

export { CheckGroup, CheckRow, checkRowVariants }
