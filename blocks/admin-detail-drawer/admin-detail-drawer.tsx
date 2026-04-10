"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet/sheet"
import { Button } from "../../components/ui/button/button"
import { ConfirmDialog } from "../../components/ui/confirm-dialog/confirm-dialog"
import styles from "./admin-detail-drawer.module.css"

export type AdminDetailDrawerWidth = "sm" | "md" | "lg" | "xl"

export interface AdminDetailDrawerProps {
  // ── Open state ──────────────────────────────────────────────────────────
  /** Controlled open state. */
  open: boolean
  /** Handler invoked when the drawer requests to open or close. */
  onOpenChange: (open: boolean) => void

  // ── Header ──────────────────────────────────────────────────────────────
  /** Drawer title — rendered inside SheetTitle. */
  title: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode

  // ── Body ────────────────────────────────────────────────────────────────
  /** Form or detail content rendered inside the scrollable body region. */
  children: React.ReactNode

  // ── Save / cancel actions ───────────────────────────────────────────────
  /** Save handler. Async-aware: returning a Promise puts the save button into pending state. */
  onSave?: () => void | Promise<void>
  /** Cancel handler. Called when the drawer closes cleanly via cancel/X/Escape/overlay. */
  onCancel?: () => void
  /** Save button label. Defaults to "Save changes". */
  saveLabel?: React.ReactNode
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: React.ReactNode
  /** Save button variant. Defaults to "default". */
  saveVariant?: "default" | "destructive"

  // ── State ───────────────────────────────────────────────────────────────
  /** If true, closing the drawer triggers the unsaved-changes guard. */
  dirty?: boolean
  /** Externally-controlled busy state — overrides internal async pending detection. */
  busy?: boolean
  /** Disable the save button. */
  disabled?: boolean

  // ── Footer customization ────────────────────────────────────────────────
  /** Middle slot inside the sticky footer — e.g. "Last saved 2 minutes ago". */
  footerStatus?: React.ReactNode
  /** Hide the footer entirely. Defaults to false. */
  hideFooter?: boolean

  // ── Width ───────────────────────────────────────────────────────────────
  /** Drawer width variant. Defaults to "md" (480px). */
  width?: AdminDetailDrawerWidth

  // ── Unsaved guard customization ─────────────────────────────────────────
  /** Title of the unsaved-changes confirm dialog. Defaults to "Discard unsaved changes?". */
  unsavedGuardTitle?: React.ReactNode
  /** Description of the unsaved-changes confirm dialog. */
  unsavedGuardDescription?: React.ReactNode
  /** Confirm (discard) label. Defaults to "Discard". */
  unsavedGuardConfirmLabel?: React.ReactNode
  /** Cancel (keep editing) label. Defaults to "Keep editing". */
  unsavedGuardCancelLabel?: React.ReactNode

  /** Additional className merged onto the SheetContent. */
  className?: string
}

const WIDTH_CLASS: Record<AdminDetailDrawerWidth, string> = {
  sm: styles.widthSm,
  md: styles.widthMd,
  lg: styles.widthLg,
  xl: styles.widthXl,
}

const DEFAULT_UNSAVED_DESCRIPTION =
  "You have unsaved changes that will be lost if you close this drawer."

const AdminDetailDrawer = React.forwardRef<
  HTMLDivElement,
  AdminDetailDrawerProps
>(function AdminDetailDrawer(
  {
    open,
    onOpenChange,
    title,
    description,
    children,
    onSave,
    onCancel,
    saveLabel = "Save changes",
    cancelLabel = "Cancel",
    saveVariant = "default",
    dirty = false,
    busy,
    disabled = false,
    footerStatus,
    hideFooter = false,
    width = "md",
    unsavedGuardTitle = "Discard unsaved changes?",
    unsavedGuardDescription = DEFAULT_UNSAVED_DESCRIPTION,
    unsavedGuardConfirmLabel = "Discard",
    unsavedGuardCancelLabel = "Keep editing",
    className,
  },
  ref
) {
  const [isPending, setIsPending] = React.useState(false)
  const [showUnsavedGuard, setShowUnsavedGuard] = React.useState(false)

  const effectiveBusy = busy ?? isPending

  const handleSheetOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        onOpenChange(true)
        return
      }
      // Close request
      if (effectiveBusy) {
        // Don't allow closing mid-save.
        return
      }
      if (dirty) {
        setShowUnsavedGuard(true)
        return
      }
      onCancel?.()
      onOpenChange(false)
    },
    [effectiveBusy, dirty, onCancel, onOpenChange]
  )

  const handleCancelClick = React.useCallback(() => {
    if (effectiveBusy) return
    if (dirty) {
      setShowUnsavedGuard(true)
      return
    }
    onCancel?.()
    onOpenChange(false)
  }, [effectiveBusy, dirty, onCancel, onOpenChange])

  const handleSaveClick = React.useCallback(async () => {
    if (!onSave) {
      onOpenChange(false)
      return
    }
    const result = onSave()
    if (result && typeof (result as Promise<void>).then === "function") {
      setIsPending(true)
      try {
        await result
        setIsPending(false)
        onOpenChange(false)
      } catch (err) {
        // Keep the drawer open, clear pending state, re-throw so consumer's
        // error handling can surface the failure.
        setIsPending(false)
        throw err
      }
    } else {
      onOpenChange(false)
    }
  }, [onSave, onOpenChange])

  const handleDiscard = React.useCallback(() => {
    setShowUnsavedGuard(false)
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange])

  const handleKeepEditing = React.useCallback(() => {
    setShowUnsavedGuard(false)
  }, [])

  const saveDisabled = disabled || effectiveBusy

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          ref={ref}
          side="right"
          className={cn(styles.content, WIDTH_CLASS[width], className)}
          data-slot="admin-detail-drawer"
        >
          <SheetHeader className={styles.header}>
            <SheetTitle>{title}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>

          <div
            className={styles.body}
            data-slot="admin-detail-drawer-body"
          >
            {children}
          </div>

          {hideFooter ? null : (
            <div
              className={styles.footer}
              data-slot="admin-detail-drawer-footer"
              role="group"
              aria-label="Drawer actions"
            >
              <div className={styles.footerCancel}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelClick}
                  disabled={effectiveBusy}
                  data-slot="admin-detail-drawer-cancel"
                >
                  {cancelLabel}
                </Button>
              </div>
              {footerStatus ? (
                <div
                  className={styles.footerStatus}
                  data-slot="admin-detail-drawer-status"
                >
                  {footerStatus}
                </div>
              ) : null}
              <div className={styles.footerSave}>
                <Button
                  type="button"
                  variant={saveVariant}
                  onClick={handleSaveClick}
                  disabled={saveDisabled}
                  aria-busy={effectiveBusy || undefined}
                  data-slot="admin-detail-drawer-save"
                >
                  {saveLabel}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={showUnsavedGuard}
        onOpenChange={(next) => {
          if (!next) setShowUnsavedGuard(false)
        }}
        severity="warning"
        title={unsavedGuardTitle}
        description={unsavedGuardDescription}
        confirmLabel={unsavedGuardConfirmLabel}
        cancelLabel={unsavedGuardCancelLabel}
        onConfirm={handleDiscard}
        onCancel={handleKeepEditing}
      />
    </>
  )
})

AdminDetailDrawer.displayName = "AdminDetailDrawer"

export { AdminDetailDrawer }
