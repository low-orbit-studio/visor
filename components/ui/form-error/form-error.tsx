import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./form-error.module.css"

/* ─── FormError ────────────────────────────────────────────────────────
 *
 * Submission-level error banner — appears inside a form card when the
 * server or client-side submit validation fails. Informs the user that
 * one or more fields need attention before the form can be submitted.
 *
 * Anatomy:
 *   - Left-border accent (destructive) — the primary error signal
 *   - Optional leading icon slot (aria-hidden, decorative)
 *   - FormErrorTitle — direct statement of the failure
 *   - FormErrorDescription — optional count or guidance copy
 *
 * Token references:
 *   - Border:      --border-error   (2px left accent)
 *   - Surface:     color-mix(--destructive 8%, --surface-card)
 *   - Icon color:  --destructive
 *   - Title color: --text-primary (stays readable — color + border signal error)
 *   - Body color:  --text-secondary
 */
export interface FormErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional leading icon (e.g. a Phosphor `WarningCircle`). Rendered
   * at the destructive color — `aria-hidden`, so the `role="alert"` on
   * the container carries the semantic weight.
   */
  icon?: React.ReactNode
}

const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ className, icon, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        data-slot="form-error"
        className={cn(styles.base, className)}
        {...props}
      >
        {icon && (
          <span
            className={styles.icon}
            data-slot="form-error-icon"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className={styles.content} data-slot="form-error-content">
          {children}
        </div>
      </div>
    )
  }
)
FormError.displayName = "FormError"

/* ─── FormErrorTitle ─────────────────────────────────────────────────── */

export type FormErrorTitleProps = React.HTMLAttributes<HTMLParagraphElement>

const FormErrorTitle = React.forwardRef<HTMLParagraphElement, FormErrorTitleProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        data-slot="form-error-title"
        className={cn(styles.title, className)}
        {...props}
      />
    )
  }
)
FormErrorTitle.displayName = "FormErrorTitle"

/* ─── FormErrorDescription ───────────────────────────────────────────── */

export type FormErrorDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const FormErrorDescription = React.forwardRef<
  HTMLParagraphElement,
  FormErrorDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      data-slot="form-error-description"
      className={cn(styles.description, className)}
      {...props}
    />
  )
})
FormErrorDescription.displayName = "FormErrorDescription"

export { FormError, FormErrorTitle, FormErrorDescription }
