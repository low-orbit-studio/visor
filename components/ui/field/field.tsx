import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import { Label } from "../label/label"
import styles from "./field.module.css"

/* ─── Field ────────────────────────────────────────────────────────── */

const fieldVariants = cva(styles.field, {
  variants: {
    orientation: {
      vertical: styles.fieldVertical,
      horizontal: styles.fieldHorizontal,
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

export interface FieldProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof fieldVariants> {}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, orientation, ...props }, ref) => {
    return (
      <div
        role="group"
        data-slot="field"
        data-orientation={orientation ?? "vertical"}
        className={cn(fieldVariants({ orientation }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Field.displayName = "Field"

/* ─── FieldLabel ────────────────────────────────────────────────────── */

export type FieldLabelProps = React.ComponentPropsWithoutRef<typeof Label>

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FieldLabelProps
>(({ className, ...props }, ref) => {
  return (
    <Label
      data-slot="field-label"
      className={cn(styles.fieldLabel, className)}
      ref={ref}
      {...props}
    />
  )
})
FieldLabel.displayName = "FieldLabel"

/* ─── FieldDescription ──────────────────────────────────────────────── */

export type FieldDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  FieldDescriptionProps
>(({ className, ...props }, ref) => {
  return (
    <p
      data-slot="field-description"
      className={cn(styles.fieldDescription, className)}
      ref={ref}
      {...props}
    />
  )
})
FieldDescription.displayName = "FieldDescription"

/* ─── FieldError ────────────────────────────────────────────────────── */

export interface FieldErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  errors?: Array<{ message?: string } | undefined>
}

const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className, children, errors, ...props }, ref) => {
    let content: React.ReactNode = children

    if (!content && errors?.length) {
      const uniqueErrors = [
        ...new Map(errors.map((e) => [e?.message, e])).values(),
      ]
      if (uniqueErrors.length === 1) {
        content = uniqueErrors[0]?.message
      } else {
        content = (
          <ul className={styles.fieldErrorList}>
            {uniqueErrors.map(
              (error, index) =>
                error?.message && <li key={index}>{error.message}</li>
            )}
          </ul>
        )
      }
    }

    if (!content) return null

    return (
      <div
        role="alert"
        data-slot="field-error"
        className={cn(styles.fieldError, className)}
        ref={ref}
        {...props}
      >
        {content}
      </div>
    )
  }
)
FieldError.displayName = "FieldError"

export { Field, FieldLabel, FieldDescription, FieldError, fieldVariants }
