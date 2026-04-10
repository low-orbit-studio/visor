"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { PageHeader } from "../../components/ui/page-header/page-header"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs/tabs"
import { Button } from "../../components/ui/button/button"
import { ConfirmDialog } from "../../components/ui/confirm-dialog/confirm-dialog"
import styles from "./admin-tabbed-editor.module.css"

export interface AdminTabbedEditorTab {
  /** Stable identifier used as the Tabs value. */
  id: string
  /** Tab trigger label. */
  label: React.ReactNode
  /** Optional leading icon rendered before the label inside the trigger. */
  icon?: React.ReactNode
  /** Panel content rendered when this tab is active. */
  content: React.ReactNode
  /** Optional badge rendered after the label (e.g. unsaved indicator). */
  badge?: React.ReactNode
  /** Disable the tab trigger. */
  disabled?: boolean
}

export interface AdminTabbedEditorProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "title" | "content"
  > {
  // ── Header ──────────────────────────────────────────────────────────────
  /** Editor title rendered inside the PageHeader. */
  title: React.ReactNode
  /** Optional eyebrow rendered above the title. */
  eyebrow?: React.ReactNode
  /** Optional supporting copy rendered below the title. */
  description?: React.ReactNode
  /** Optional breadcrumb node rendered above the title row. */
  breadcrumb?: React.ReactNode
  /** Optional actions slot rendered on the right side of the header. */
  headerActions?: React.ReactNode

  // ── Tabs ────────────────────────────────────────────────────────────────
  /** Ordered list of tabs. */
  tabs: AdminTabbedEditorTab[]
  /** Controlled active tab id. */
  activeTab?: string
  /** Uncontrolled default active tab id. Defaults to the first tab. */
  defaultActiveTab?: string
  /** Handler called when the active tab changes. */
  onActiveTabChange?: (id: string) => void

  // ── Save / cancel actions ───────────────────────────────────────────────
  /** Save handler. Async-aware: a returned Promise puts the save button into a pending state. */
  onSave?: () => void | Promise<void>
  /** Cancel handler. Protected by the unsaved-changes guard when `dirty` is true. */
  onCancel?: () => void
  /** Save button label. Defaults to "Save changes". */
  saveLabel?: React.ReactNode
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: React.ReactNode

  // ── State ───────────────────────────────────────────────────────────────
  /** If true, tab switching and cancel are intercepted by the unsaved-changes guard. */
  dirty?: boolean
  /** Externally-controlled busy state — overrides internal async pending detection. */
  busy?: boolean
  /** Disable the save button. */
  disabled?: boolean
  /** Middle slot inside the sticky footer — e.g. "Last saved 2 minutes ago". */
  footerStatus?: React.ReactNode
  /** Hide the footer entirely. */
  hideFooter?: boolean

  // ── Unsaved guard customization ─────────────────────────────────────────
  /** Title of the unsaved-changes confirm dialog. */
  unsavedGuardTitle?: React.ReactNode
  /** Description of the unsaved-changes confirm dialog. */
  unsavedGuardDescription?: React.ReactNode
  /** Confirm (discard) label. Defaults to "Discard". */
  unsavedGuardConfirmLabel?: React.ReactNode
  /** Cancel (keep editing) label. Defaults to "Keep editing". */
  unsavedGuardCancelLabel?: React.ReactNode
}

const DEFAULT_UNSAVED_DESCRIPTION =
  "You have unsaved changes that will be lost if you leave this tab."

const AdminTabbedEditor = React.forwardRef<
  HTMLDivElement,
  AdminTabbedEditorProps
>(function AdminTabbedEditor(
  {
    title,
    eyebrow,
    description,
    breadcrumb,
    headerActions,
    tabs,
    activeTab,
    defaultActiveTab,
    onActiveTabChange,
    onSave,
    onCancel,
    saveLabel = "Save changes",
    cancelLabel = "Cancel",
    dirty = false,
    busy,
    disabled = false,
    footerStatus,
    hideFooter = false,
    unsavedGuardTitle = "Discard unsaved changes?",
    unsavedGuardDescription = DEFAULT_UNSAVED_DESCRIPTION,
    unsavedGuardConfirmLabel = "Discard",
    unsavedGuardCancelLabel = "Keep editing",
    className,
    ...rest
  },
  ref
) {
  const firstTabId = tabs[0]?.id
  const [internalActive, setInternalActive] = React.useState<string | undefined>(
    defaultActiveTab ?? firstTabId
  )
  const [isPending, setIsPending] = React.useState(false)
  const [pendingTabId, setPendingTabId] = React.useState<string | null>(null)
  const [pendingCancel, setPendingCancel] = React.useState(false)

  const isControlled = activeTab !== undefined
  const currentTab = isControlled ? activeTab : internalActive
  const effectiveBusy = busy ?? isPending
  const showUnsavedGuard = pendingTabId !== null || pendingCancel

  const commitTabChange = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalActive(next)
      }
      onActiveTabChange?.(next)
    },
    [isControlled, onActiveTabChange]
  )

  const handleTabsValueChange = React.useCallback(
    (next: string) => {
      if (next === currentTab) return
      if (dirty) {
        setPendingTabId(next)
        return
      }
      commitTabChange(next)
    },
    [currentTab, dirty, commitTabChange]
  )

  const handleCancelClick = React.useCallback(() => {
    if (effectiveBusy) return
    if (dirty) {
      setPendingCancel(true)
      return
    }
    onCancel?.()
  }, [dirty, effectiveBusy, onCancel])

  const handleSaveClick = React.useCallback(async () => {
    if (!onSave) return
    const result = onSave()
    if (result && typeof (result as Promise<void>).then === "function") {
      setIsPending(true)
      try {
        await result
        setIsPending(false)
      } catch (err) {
        setIsPending(false)
        throw err
      }
    }
  }, [onSave])

  const handleGuardConfirm = React.useCallback(() => {
    if (pendingTabId !== null) {
      const next = pendingTabId
      setPendingTabId(null)
      commitTabChange(next)
      return
    }
    if (pendingCancel) {
      setPendingCancel(false)
      onCancel?.()
    }
  }, [pendingTabId, pendingCancel, commitTabChange, onCancel])

  const handleGuardCancel = React.useCallback(() => {
    setPendingTabId(null)
    setPendingCancel(false)
  }, [])

  const saveDisabled = disabled || effectiveBusy || !dirty

  return (
    <>
      <div
        ref={ref}
        className={cn(styles.root, className)}
        data-slot="admin-tabbed-editor"
        {...rest}
      >
        <PageHeader
          className={styles.header}
          eyebrow={eyebrow}
          title={title}
          description={description}
          breadcrumb={breadcrumb}
          actions={headerActions}
        />

        <Tabs
          className={styles.tabs}
          value={currentTab}
          onValueChange={handleTabsValueChange}
        >
          <TabsList className={styles.tabsList}>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                disabled={tab.disabled}
                className={styles.tabsTrigger}
                data-slot="admin-tabbed-editor-trigger"
              >
                {tab.icon ? (
                  <span
                    className={styles.triggerIcon}
                    data-slot="admin-tabbed-editor-trigger-icon"
                    aria-hidden="true"
                  >
                    {tab.icon}
                  </span>
                ) : null}
                <span className={styles.triggerLabel}>{tab.label}</span>
                {tab.badge ? (
                  <span
                    className={styles.triggerBadge}
                    data-slot="admin-tabbed-editor-trigger-badge"
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent
              key={tab.id}
              value={tab.id}
              className={styles.tabsContent}
              data-slot="admin-tabbed-editor-content"
            >
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>

        {hideFooter ? null : (
          <div
            className={styles.footer}
            data-slot="admin-tabbed-editor-footer"
            role="group"
            aria-label="Editor actions"
          >
            <div className={styles.footerCancel}>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={effectiveBusy}
                data-slot="admin-tabbed-editor-cancel"
              >
                {cancelLabel}
              </Button>
            </div>
            {footerStatus ? (
              <div
                className={styles.footerStatus}
                data-slot="admin-tabbed-editor-status"
              >
                {footerStatus}
              </div>
            ) : null}
            <div className={styles.footerSave}>
              <Button
                type="button"
                onClick={handleSaveClick}
                disabled={saveDisabled}
                aria-busy={effectiveBusy || undefined}
                data-slot="admin-tabbed-editor-save"
              >
                {saveLabel}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showUnsavedGuard}
        onOpenChange={(next) => {
          if (!next) handleGuardCancel()
        }}
        severity="warning"
        title={unsavedGuardTitle}
        description={unsavedGuardDescription}
        confirmLabel={unsavedGuardConfirmLabel}
        cancelLabel={unsavedGuardCancelLabel}
        onConfirm={handleGuardConfirm}
        onCancel={handleGuardCancel}
      />
    </>
  )
})

AdminTabbedEditor.displayName = "AdminTabbedEditor"

export { AdminTabbedEditor }
