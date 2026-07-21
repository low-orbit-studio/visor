"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog/dialog"
import styles from "./dialog-form.module.css"

/**
 * DialogForm — the Animal dialog substrate shell (VI-620).
 *
 * A mid-tier block that composes the `dialog` atom into the compact admin
 * modal shell the app's 10 hand-rolled modals converge onto: backdrop +
 * centered panel + header + footer. Everything is token-driven; the active
 * theme swaps the surface, hairline, radius, and title scale.
 *
 * The root pieces (open state, trigger, close) are re-exported straight from
 * the atom so a modal imports its whole substrate from one place.
 */
const DialogForm = Dialog
const DialogFormTrigger = DialogTrigger
const DialogFormClose = DialogClose
const DialogFormDescription = DialogDescription

/* ─── Content — the compact panel ───────────────────────────────────── */

export type DialogFormContentProps = React.ComponentProps<typeof DialogContent>

const DialogFormContent = React.forwardRef<
  React.ComponentRef<typeof DialogContent>,
  DialogFormContentProps
>(({ className, ...props }, ref) => (
  <DialogContent ref={ref} className={cn(styles.panel, className)} {...props} />
))
DialogFormContent.displayName = "DialogFormContent"

/* ─── Header ─────────────────────────────────────────────────────────── */

function DialogFormHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-header"
      className={cn(styles.header, className)}
      {...props}
    />
  )
}
DialogFormHeader.displayName = "DialogFormHeader"

/* ─── Title (size axis: sm 13px default, md 16px) ────────────────────── */

const titleVariants = cva(styles.title, {
  variants: {
    size: {
      sm: styles.titleSm,
      md: styles.titleMd,
    },
  },
  defaultVariants: {
    size: "sm",
  },
})

export interface DialogFormTitleProps
  extends React.ComponentProps<typeof DialogTitle>,
    VariantProps<typeof titleVariants> {}

const DialogFormTitle = React.forwardRef<
  React.ComponentRef<typeof DialogTitle>,
  DialogFormTitleProps
>(({ className, size, ...props }, ref) => (
  <DialogTitle
    ref={ref}
    className={cn(titleVariants({ size }), className)}
    {...props}
  />
))
DialogFormTitle.displayName = "DialogFormTitle"

/* ─── Body — vertical stack of DialogField blocks ────────────────────── */

function DialogFormBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-body"
      className={cn(styles.body, className)}
      {...props}
    />
  )
}
DialogFormBody.displayName = "DialogFormBody"

/* ─── Footer — the right-aligned dlg-btn action row ──────────────────── */

function DialogFormFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-form-footer"
      className={cn(styles.footer, className)}
      {...props}
    />
  )
}
DialogFormFooter.displayName = "DialogFormFooter"

export {
  DialogForm,
  DialogFormTrigger,
  DialogFormClose,
  DialogFormContent,
  DialogFormHeader,
  DialogFormTitle,
  DialogFormBody,
  DialogFormFooter,
  DialogFormDescription,
  titleVariants,
}
