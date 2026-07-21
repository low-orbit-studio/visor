"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Label } from "../../components/ui/label/label"
import styles from "./dialog-field.module.css"

/**
 * DialogField — the Animal dialog substrate field block (dlg-field, VI-620).
 *
 * A flex-column field (label over control) with the compact dialog treatment:
 * 5px label→control gap, an 11px/600 primary-ink label, and the standard Visor
 * medium field (md size, themed form-control surface, borderless) that hosts a
 * leading icon slot, the control itself, and a trailing control/caret slot.
 * Composes the `label` atom for the label. Every value traces to a Visor token
 * so the active theme swaps the whole treatment.
 */

/* ─── Field root — flex column, 5px gap ──────────────────────────────── */

const DialogField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    data-slot="dialog-field"
    className={cn(styles.field, className)}
    ref={ref}
    {...props}
  />
))
DialogField.displayName = "DialogField"

/* ─── Label — 11px / 600 / primary ink (dlg-label) ───────────────────── */

export type DialogFieldLabelProps = React.ComponentPropsWithoutRef<typeof Label>

const DialogFieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  DialogFieldLabelProps
>(({ className, ...props }, ref) => (
  <Label
    data-slot="dialog-field-label"
    className={cn(styles.label, className)}
    ref={ref}
    {...props}
  />
))
DialogFieldLabel.displayName = "DialogFieldLabel"

/* ─── Control — the recessed well with icon + trailing slots ─────────── */

/* Size axis drives the well padding only (label typography unchanged), matching
 * Visor's input-only `size` semantics. Default `md` preserves the VI-620 medium
 * well; `sm` is the compact Animal modal-form well. */
const controlVariants = cva(styles.control, {
  variants: {
    size: {
      sm: styles.controlSm,
      md: styles.controlMd,
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export interface DialogFieldControlProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof controlVariants> {
  /** Leading icon rendered before the control (aria-hidden decoration). */
  icon?: React.ReactNode
  /** Trailing control / caret slot rendered after the control. */
  trailing?: React.ReactNode
}

const DialogFieldControl = React.forwardRef<
  HTMLDivElement,
  DialogFieldControlProps
>(({ className, size, icon, trailing, children, ...props }, ref) => (
  <div
    data-slot="dialog-field-control"
    className={cn(controlVariants({ size }), className)}
    ref={ref}
    {...props}
  >
    {icon ? (
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    ) : null}
    <span className={styles.controlInner}>{children}</span>
    {trailing ? <span className={styles.trailing}>{trailing}</span> : null}
  </div>
))
DialogFieldControl.displayName = "DialogFieldControl"

export { DialogField, DialogFieldLabel, DialogFieldControl, controlVariants }
