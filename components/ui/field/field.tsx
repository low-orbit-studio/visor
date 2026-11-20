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

export interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {
  /**
   * Marks the field as optional: renders " optional" after the label text,
   * inside the label, so the accessible name includes it.
   */
  optional?: boolean
}

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  FieldLabelProps
>(({ className, optional, children, ...props }, ref) => {
  return (
    <Label
      data-slot="field-label"
      className={cn(styles.fieldLabel, className)}
      ref={ref}
      {...props}
    >
      {optional ? (
        <span className={styles.fieldLabelText}>
          {children}{" "}
          <span className={styles.fieldLabelOptional} data-slot="field-label-optional">
            optional
          </span>
        </span>
      ) : (
        children
      )}
    </Label>
  )
})
FieldLabel.displayName = "FieldLabel"

/* ─── FieldControl ──────────────────────────────────────────────────── */

export interface FieldControlProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Let the box grow with its content, for a Textarea. */
  tall?: boolean
}

/**
 * The box a form control sits in. Input, Textarea or a Select trigger placed
 * inside fills it and goes bare; the box draws the fill, edge, focus ring and
 * invalid look (from the control's `aria-invalid`). Glass only inside
 * `data-glass="on"`.
 */
const FieldControl = React.forwardRef<HTMLDivElement, FieldControlProps>(
  ({ className, tall, ...props }, ref) => {
    return (
      <div
        data-slot="field-control"
        className={cn(styles.control, tall && styles.controlTall, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
FieldControl.displayName = "FieldControl"

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
  errors?: Array<string | { message?: string } | undefined>
  /**
   * Optional leading icon rendered before the error message (e.g. a 14px
   * Phosphor `WarningCircle`). When present, the error lays out as a centered
   * icon + message row; without it the error renders exactly as before (plain
   * inline text). The icon is `aria-hidden` — `role="alert"` already conveys
   * the error to assistive tech.
   */
  icon?: React.ReactNode
}

const FieldError = React.forwardRef<HTMLDivElement, FieldErrorProps>(
  ({ className, children, errors, icon, ...props }, ref) => {
    let content: React.ReactNode = children

    if (!content && errors?.length) {
      const messages = errors
        .map((e) => (typeof e === "string" ? e : e?.message))
        .filter(Boolean) as string[]
      const uniqueMessages = [...new Set(messages)]
      if (uniqueMessages.length === 1) {
        content = uniqueMessages[0]
      } else if (uniqueMessages.length > 1) {
        content = (
          <ul className={styles.fieldErrorList}>
            {uniqueMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        )
      }
    }

    if (!content) return null

    return (
      <div
        role="alert"
        data-slot="field-error"
        className={cn(styles.fieldError, icon && styles.fieldErrorWithIcon, className)}
        ref={ref}
        {...props}
      >
        {icon && (
          <span className={styles.fieldErrorIcon} data-slot="field-error-icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {content}
      </div>
    )
  }
)
FieldError.displayName = "FieldError"

export { Field, FieldLabel, FieldControl, FieldDescription, FieldError, fieldVariants }
