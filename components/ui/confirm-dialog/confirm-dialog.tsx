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
import { Button, type ButtonProps } from "../button/button"
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

/** Severity icon visual treatment.
 *
 * Leave unset for the canonical default — a ~2.5rem tinted circular plate
 * (`surface-*-subtle` tint) stacked ABOVE the title. This is the unchanged
 * default rendering of every existing ConfirmDialog consumer.
 *
 * Set explicitly to opt into the blessed editorial treatments:
 * - `"plated"` — a 40px circular plate with a `color-mix` severity wash,
 *   leading the title column (golden organization-management Feedback screen).
 * - `"inline"` — a small leading icon next to the title (no plate). */
export type ConfirmDialogIconTreatment = "inline" | "plated"

/** Rendering mode. `dialog` (default) wraps content in Radix
 * Dialog/Portal/Overlay with an auto X-close. `inline` renders just the
 * content surface in normal flow — no portal, no overlay, no auto X-close —
 * so consumers can stack multiple dialogs inside one shared scrim. Opt-in. */
export type ConfirmDialogMode = "dialog" | "inline"

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

  /** Custom severity icon — overrides the severity default. Opt-in; omit to
   * use the built-in icon for the active severity. Sizing/color is handled by
   * the icon container, so pass a bare Phosphor icon (no explicit size). */
  icon?: React.ReactNode

  /** Severity-icon treatment. Leave unset for the canonical default (a tinted
   * circular plate stacked above the title). Set "plated" for the blessed
   * color-mix plate, or "inline" for a small leading icon next to the title.
   * Default rendering (unset) is unchanged. */
  iconTreatment?: ConfirmDialogIconTreatment

  /** Rendering mode. "dialog" (default) uses Radix Dialog + Portal + Overlay +
   * auto X-close. "inline" renders only the content surface (no portal, no
   * overlay, no X-close) so multiple dialogs can stack in one shared scrim.
   * Opt-in — default rendering is unchanged. */
  mode?: ConfirmDialogMode

  /** Confirm button label. Defaults: "Delete" for danger, "Confirm" otherwise. */
  confirmLabel?: React.ReactNode
  /** Cancel button label. Default "Cancel". */
  cancelLabel?: React.ReactNode
  /** Cancel button variant. Default "outline". Golden screens use "ghost". */
  cancelVariant?: ButtonProps["variant"]

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

/** Canonical default plate tint (surface-*-subtle stacked plate). */
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

/** Inline severity icon color (small leading icon, no plate). */
function getSeverityIconClass(severity: NormalizedSeverity): string {
  switch (severity) {
    case "info":
      return styles.iconInfo
    case "destructive":
      return styles.iconDanger
    case "warning":
    default:
      return styles.iconWarning
  }
}

/** Blessed plated tint (color-mix wash). */
function getPlatedIconClass(severity: NormalizedSeverity): string {
  switch (severity) {
    case "info":
      return styles.iconPlatedInfo
    case "destructive":
      return styles.iconPlatedDanger
    case "warning":
    default:
      return styles.iconPlatedWarning
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
      icon,
      iconTreatment,
      mode = "dialog",
      confirmLabel,
      cancelLabel = "Cancel",
      cancelVariant = "outline",
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

    const severityIcon = icon ?? getSeverityIcon(normalizedSeverity)
    const confirmVariant = getConfirmButtonVariant(normalizedSeverity)
    const isInline = mode === "inline"

    // Treatment resolution:
    // - unset           → canonical default: tinted plate stacked above title
    //                     (data-slot="confirm-dialog-icon-plate"). Unchanged.
    // - "plated"        → blessed plated: 40px color-mix plate leading the
    //                     title column (data-slot="confirm-dialog-icon").
    // - "inline"        → blessed inline: small leading icon (no plate).
    const isCanonicalPlate = iconTreatment === undefined
    const isBlessedPlated = iconTreatment === "plated"

    // Generate stable id for confirm gate input
    const generatedId = React.useId()
    const confirmGateInputId = `${generatedId}-confirm-input`

    const hasDescriptionForAria =
      description != null && description !== false && !children

    // Canonical default plate — a span carrying the tinted circle, stacked
    // above the title inside .headerStack. Preserved verbatim for backward
    // compatibility (existing consumers + tests query this slot/classes).
    const canonicalPlate = (
      <span
        data-slot="confirm-dialog-icon-plate"
        aria-hidden="true"
        className={cn(styles.iconPlate, getSeverityPlateClass(normalizedSeverity))}
      >
        {severityIcon}
      </span>
    )

    // Blessed icon span — used for explicit "plated"/"inline" treatments.
    const blessedIconClass = isBlessedPlated
      ? cn(styles.iconPlated, getPlatedIconClass(normalizedSeverity))
      : cn(styles.icon, getSeverityIconClass(normalizedSeverity))
    const blessedIconSpan = (
      <span
        data-slot="confirm-dialog-icon"
        aria-hidden="true"
        className={blessedIconClass}
      >
        {severityIcon}
      </span>
    )

    // Header layout class per treatment.
    // - canonical default → .headerStack (column: plate above title/description)
    // - blessed plated     → .titleRowPlated (column: plate above title)
    // - blessed inline     → .titleRow (row: icon next to title)
    const headerLayoutClass = isCanonicalPlate
      ? styles.headerStack
      : isBlessedPlated
        ? styles.titleRowPlated
        : styles.titleRow

    const iconElement = isCanonicalPlate ? canonicalPlate : blessedIconSpan

    // Dialog-mode header — uses Radix Title/Description (a11y + aria-labelledby).
    // Canonical plate stacks plate + title + description inside one .headerStack;
    // blessed treatments keep description outside the title row.
    const dialogHeader = isCanonicalPlate ? (
      <DialogHeader>
        <div className={headerLayoutClass}>
          {iconElement}
          <DialogTitle>{title}</DialogTitle>
          {hasDescriptionForAria ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </div>
      </DialogHeader>
    ) : (
      <DialogHeader>
        <div className={headerLayoutClass}>
          {iconElement}
          <DialogTitle>{title}</DialogTitle>
        </div>
        {hasDescriptionForAria ? (
          <DialogDescription>{description}</DialogDescription>
        ) : null}
      </DialogHeader>
    )

    // Inline-mode header — no Dialog context, so render a plain heading/paragraph.
    const inlineHeaderEl = (
      <div className={styles.inlineHeader}>
        <div className={headerLayoutClass}>
          {iconElement}
          <h2 className={styles.inlineTitle}>{title}</h2>
        </div>
        {hasDescriptionForAria ? (
          <p className={styles.inlineDescription}>{description}</p>
        ) : null}
      </div>
    )

    const header = isInline ? inlineHeaderEl : dialogHeader

    const innerContent = (
      <>
        {header}

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
              variant={cancelVariant}
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
      </>
    )

    // Inline (non-portal) mode — render only the content surface. No Radix
    // Dialog/Portal/Overlay/X-close, so consumers can stack multiple dialogs
    // inside one shared scrim. Open/close is consumer-driven; respect `open`.
    if (isInline) {
      if (!actualOpen) {
        return null
      }
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          role="alertdialog"
          aria-modal={false}
          data-slot="confirm-dialog"
          data-mode="inline"
          data-severity={normalizedSeverity}
          className={cn(styles.root, styles.inlineSurface, className)}
        >
          {innerContent}
        </div>
      )
    }

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
          {innerContent}
        </DialogContent>
      </Dialog>
    )
  }
)
ConfirmDialog.displayName = "ConfirmDialog"

export { ConfirmDialog }
