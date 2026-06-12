import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./error-placard.module.css"

export interface ErrorPlacardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Leading visual — typically a Phosphor icon. Rendered in a destructive-tinted circular chip. */
  icon: React.ReactNode
  /** Short direct statement of the failure. Required. */
  title: React.ReactNode
  /** 1-2 sentence explanation or recovery guidance. Required. */
  body: React.ReactNode
  /** Optional right-aligned action cluster — typically one or more Buttons. */
  actions?: React.ReactNode
}

/**
 * ErrorPlacard — an inline failed-load placard.
 *
 * A destructive-tinted horizontal card: a circular destructive icon chip on the
 * left, title + body in the middle, and an optional right-aligned action cluster.
 * The surface is a destructive color-mix on the card with an inset destructive
 * ring. Theme-agnostic — reads entirely from design-language tokens.
 */
const ErrorPlacard = React.forwardRef<HTMLDivElement, ErrorPlacardProps>(
  ({ className, icon, title, body, actions, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        data-slot="error-placard"
        className={cn(styles.base, className)}
        {...props}
      >
        <div
          data-slot="error-placard-icon"
          className={styles.icon}
          aria-hidden="true"
        >
          {icon}
        </div>

        <div data-slot="error-placard-body" className={styles.content}>
          <p data-slot="error-placard-title" className={styles.title}>
            {title}
          </p>
          <p data-slot="error-placard-message" className={styles.message}>
            {body}
          </p>
        </div>

        {actions ? (
          <div
            data-slot="error-placard-actions"
            className={styles.actions}
          >
            {actions}
          </div>
        ) : null}
      </div>
    )
  }
)
ErrorPlacard.displayName = "ErrorPlacard"

export { ErrorPlacard }
