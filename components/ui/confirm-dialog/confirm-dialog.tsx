"use client"

import * as React from "react"
import {
  InfoIcon,
  WarningIcon,
  WarningOctagonIcon,
} from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../dialog/dialog"
import { Button } from "../button/button"
import styles from "./confirm-dialog.module.css"

export type ConfirmDialogSeverity =
  | "info"
  | "warning"
  | "destructive"
  /**
   * @deprecated Use `"destructive"` instead. `"danger"` will be removed in the next major version.
   */
  | "danger"

/** Internal normalized severity — `"danger"` is collapsed to `"destructive"`. */
type NormalizedSeverity = "info" | "warning" | "destructive"

function normalizeSeverity(s: ConfirmDialogSeverity): NormalizedSeverity {
  return s === "danger" ? "destructive" : s
}

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open?: boolean
  /** Uncontrolled initial open state. */
  defaultOpen?: boolean
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void

  /** Optional trigger — wrapped in DialogTrigger. Omit for fully-controlled usage. */
  trigger?: React.ReactNode

  /** Dialog title — rendered in DialogTitle next to the severity icon. */
  title: React.ReactNode
  /** Short body above the action row. Used as DialogDescription. */
  description?: React.ReactNode
  /** Richer body slot — overrides description when provided. */
  children?: React.ReactNode

  /** Severity — drives icon color, confirm button variant. Default "warning". */
  severity?: ConfirmDialogSeverity

  /** Confirm button label. Defaults: "Delete" for danger, "Confirm" otherwise. */
  confirmLabel?: React.ReactNode
  /** Cancel button label. Default "Cancel". */
  cancelLabel?: React.ReactNode

  /** If set, user must type this exact string to enable the confirm button. */
  confirmText?: string
  /** Label for the confirm-text input. Default: `Type ${confirmText} to confirm`. */
  confirmTextLabel?: React.ReactNode

  /** Confirm handler. Async-aware: returning a Promise puts the dialog into pending state. */
  onConfirm?: () => void | Promise<void>
  /** Cancel handler. */
  onCancel?: () => void

  /** Externally-controlled busy state — overrides internal async pending detection. */
  busy?: boolean

  /** Additional className on DialogContent. */
  className?: string
}

function getSeverityIcon(severity: NormalizedSeverity): React.ReactNode {
  switch (severity) {
    case "info":
      return <InfoIcon weight="fill" aria-hidden="true" />
    case "destructive":
      return <WarningOctagonIcon weight="fill" aria-hidden="true" />
    case "warning":
    default:
      return <WarningIcon weight="fill" aria-hidden="true" />
  }
}

function getSeverityPlateClass(severity: NormalizedSeverity): string {
  switch (severity) {
    case "info":
      return styles.plateInfo
    case "destructive":
      return styles.plateDestructive
    case "warning":
    default:
      return styles.plateWarning
  }
}

function getConfirmButtonVariant(
  severity: NormalizedSeverity
): "default" | "destructive" {
  return severity === "destructive" ? "destructive" : "default"
}

function getDefaultConfirmLabel(severity: NormalizedSeverity): string {
  return severity === "destructive" ? "Delete" : "Confirm"
}

const ConfirmDialog = React.forwardRef<
  React.ComponentRef<typeof DialogContent>,
  ConfirmDialogProps
>(
  (
    {
      open: openProp,
      defaultOpen,
      onOpenChange,
      trigger,
      title,
      description,
      children,
      severity = "warning",
      confirmLabel,
      cancelLabel = "Cancel",
      confirmText,
      confirmTextLabel,
      onConfirm,
      onCancel,
      busy,
      className,
    },
    ref
  ) => {
    const isControlled = openProp !== undefined
    const [internalOpen, setInternalOpen] = React.useState<boolean>(
      defaultOpen ?? false
    )
    const actualOpen = isControlled ? (openProp as boolean) : internalOpen

    const [isPending, setIsPending] = React.useState<boolean>(false)
    const [typed, setTyped] = React.useState<string>("")

    const cancelButtonRef = React.useRef<HTMLButtonElement | null>(null)

    const normalizedSeverity = normalizeSeverity(severity)

    const handleOpenChange = React.useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setInternalOpen(next)
        }
        onOpenChange?.(next)
        if (!next) {
          // Clear gate typing on close
          setTyped("")
        }
      },
      [isControlled, onOpenChange]
    )

    const resolvedConfirmLabel =
      confirmLabel ?? getDefaultConfirmLabel(normalizedSeverity)
    const effectiveBusy = busy ?? isPending
    const gateSatisfied =
      confirmText == null || confirmText.length === 0 || typed === confirmText
    const confirmDisabled = effectiveBusy || !gateSatisfied
    const cancelDisabled = effectiveBusy

    const handleConfirmClick = React.useCallback(async () => {
      if (!onConfirm) {
        handleOpenChange(false)
        return
      }
      // Any synchronous throw propagates naturally to React's error boundary.
      const result = onConfirm()
      if (result && typeof (result as Promise<void>).then === "function") {
        setIsPending(true)
        try {
          await result
          setIsPending(false)
          handleOpenChange(false)
        } catch (err) {
          // Async rejection — clear pending state, keep dialog open, re-throw
          // so the consumer's error handling (error boundary, onUnhandledRejection)
          // can react to it.
          setIsPending(false)
          throw err
        }
      } else {
        handleOpenChange(false)
      }
    }, [onConfirm, handleOpenChange])

    const handleCancelClick = React.useCallback(() => {
      onCancel?.()
      handleOpenChange(false)
    }, [onCancel, handleOpenChange])

    const handleOpenAutoFocus = React.useCallback(
      (event: Event) => {
        if (normalizedSeverity === "destructive" && cancelButtonRef.current) {
          event.preventDefault()
          cancelButtonRef.current.focus()
        }
      },
      [normalizedSeverity]
    )

    const severityIcon = getSeverityIcon(normalizedSeverity)
    const severityPlateClass = getSeverityPlateClass(normalizedSeverity)
    const confirmVariant = getConfirmButtonVariant(normalizedSeverity)

    // Generate stable id for confirm gate input
    const generatedId = React.useId()
    const confirmGateInputId = `${generatedId}-confirm-input`

    const hasDescriptionForAria =
      description != null && description !== false && !children

    return (
      <Dialog
        open={actualOpen}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
      >
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent
          ref={ref}
          data-slot="confirm-dialog"
          data-severity={normalizedSeverity}
          className={cn(styles.root, className)}
          onOpenAutoFocus={handleOpenAutoFocus}
        >
          <DialogHeader>
            <div className={styles.headerStack}>
              <span
                data-slot="confirm-dialog-icon-plate"
                aria-hidden="true"
                className={cn(styles.iconPlate, severityPlateClass)}
              >
                {severityIcon}
              </span>
              <DialogTitle>{title}</DialogTitle>
              {hasDescriptionForAria ? (
                <DialogDescription>{description}</DialogDescription>
              ) : null}
            </div>
          </DialogHeader>

          {children ? (
            <div data-slot="confirm-dialog-body" className={styles.body}>
              {children}
            </div>
          ) : null}

          {confirmText ? (
            <div className={styles.confirmGate}>
              <label
                htmlFor={confirmGateInputId}
                className={styles.confirmGateLabel}
              >
                {confirmTextLabel ?? `Type ${confirmText} to confirm`}
              </label>
              <input
                id={confirmGateInputId}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                disabled={effectiveBusy}
                className={styles.confirmGateInput}
                data-slot="confirm-dialog-gate-input"
              />
            </div>
          ) : null}

          <div
            data-slot="confirm-dialog-actions"
            className={styles.actions}
            role="group"
          >
            <div className={styles.action}>
              <Button
                ref={cancelButtonRef}
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={cancelDisabled}
                data-slot="confirm-dialog-cancel"
              >
                {cancelLabel}
              </Button>
            </div>
            <div className={styles.action}>
              <Button
                type="button"
                variant={confirmVariant}
                onClick={handleConfirmClick}
                disabled={confirmDisabled}
                aria-busy={effectiveBusy || undefined}
                data-slot="confirm-dialog-confirm"
              >
                {resolvedConfirmLabel}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
)
ConfirmDialog.displayName = "ConfirmDialog"

export { ConfirmDialog }
