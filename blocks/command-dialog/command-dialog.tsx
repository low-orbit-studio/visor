"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command/command"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../../components/ui/dialog/dialog"
import { Kbd } from "../../components/ui/kbd/kbd"
import styles from "./command-dialog.module.css"

// ── Types ─────────────────────────────────────────────────────────────────

export interface CommandDialogItem {
  /** Stable identifier — used as React key. */
  id: string
  /** Plain-text value that cmdk uses for its built-in filter. */
  value: string
  /**
   * Label content. Pass a ReactNode with `<span data-hit>` spans inside to
   * render hit-highlighting. The block does not auto-highlight — that's the
   * consumer's job (server-side, local fuzzy match, etc.).
   */
  label: React.ReactNode
  /** Optional leading icon node. */
  icon?: React.ReactNode
  /** Optional meta line shown after the label (e.g. "Tonight · 22:00 · House of Yes"). */
  meta?: React.ReactNode
  /** Optional trailing keyboard shortcut. Renders as `<Kbd size="sm">`. */
  shortcut?: string
  /** Optional select handler — fired when the item is activated (Enter or click). */
  onSelect?: (value: string) => void
}

export interface CommandDialogGroup {
  /** Stable identifier — used as React key. */
  id: string
  /** Group heading content. */
  heading: React.ReactNode
  /** Optional count rendered next to the heading. */
  count?: number
  items: CommandDialogItem[]
}

export interface CommandDialogFooterHint {
  /** Single key string or array of keys (multi-key chords). */
  keys: string | string[]
  /** Hint label, e.g. "navigate". */
  label: React.ReactNode
}

export interface CommandDialogProps {
  /** Controlled open state. */
  open: boolean
  /** Open-state change handler. */
  onOpenChange: (open: boolean) => void

  /** Input placeholder. Defaults to "Type a command, search…". */
  placeholder?: string

  /**
   * Optional scope chip rendered top-right of the input. Pass a string ("Events")
   * for a default "in Events" rendering, or a ReactNode for full control.
   */
  scope?: React.ReactNode

  /** Grouped results. Each group renders a heading and a list of items. */
  groups: CommandDialogGroup[]

  /**
   * Empty-state content rendered when no items match the active filter.
   * Defaults to "No results."
   */
  emptyMessage?: React.ReactNode

  /** Footer hint rows (e.g. ↑↓ navigate, ↵ open). When omitted, no hints render. */
  footerHints?: CommandDialogFooterHint[]

  /**
   * Total result count rendered in the bottom-right of the footer. When omitted,
   * the count is derived from `groups`. Pass an explicit number to override
   * (e.g. server-paginated results where the visible groups are a window).
   */
  resultCount?: number

  /** Hide the derived/explicit result count in the footer. Defaults to `false`. */
  hideResultCount?: boolean

  /** Bind ⌘K / Ctrl+K to toggle `open`. Defaults to `true`. */
  enableShortcut?: boolean

  /** Additional className merged onto DialogContent. */
  className?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────

function normalizeKeys(keys: string | string[]): string[] {
  return Array.isArray(keys) ? keys : [keys]
}

function deriveResultCount(groups: CommandDialogGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0)
}

function renderScope(scope: React.ReactNode): React.ReactNode {
  if (typeof scope === "string") {
    return (
      <>
        <span
          data-slot="command-dialog-scope-label"
          className={styles.scopeLabel}
        >
          in
        </span>{" "}
        {scope}
      </>
    )
  }
  return scope
}

// ── Component ────────────────────────────────────────────────────────────

const CommandDialog = React.forwardRef<HTMLDivElement, CommandDialogProps>(
  function CommandDialog(
    {
      open,
      onOpenChange,
      placeholder = "Type a command, search…",
      scope,
      groups,
      emptyMessage = "No results.",
      footerHints,
      resultCount,
      hideResultCount = false,
      enableShortcut = true,
      className,
    },
    ref
  ) {
    // ⌘K / Ctrl+K — toggle open. Cleans up on unmount.
    React.useEffect(() => {
      if (!enableShortcut) return
      const handler = (event: KeyboardEvent) => {
        if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault()
          onOpenChange(!open)
        }
      }
      document.addEventListener("keydown", handler)
      return () => document.removeEventListener("keydown", handler)
    }, [enableShortcut, onOpenChange, open])

    const totalResults = resultCount ?? deriveResultCount(groups)
    const showResultCount = !hideResultCount
    const hasFooterHints = Boolean(footerHints && footerHints.length > 0)
    const showFooter = hasFooterHints || showResultCount

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          ref={ref}
          className={cn(styles.dialog, className)}
          data-slot="command-dialog"
          aria-describedby={undefined}
        >
          <DialogTitle className={styles.srOnly}>Command Palette</DialogTitle>

          <Command className={styles.command}>
            <div
              className={styles.inputRow}
              data-slot="command-dialog-input-row"
            >
              <CommandInput
                placeholder={placeholder}
                className={styles.input}
              />
              {scope ? (
                <span
                  data-slot="command-dialog-scope-chip"
                  className={styles.scope}
                >
                  {renderScope(scope)}
                </span>
              ) : null}
              <Kbd size="sm" className={styles.escKbd}>
                Esc
              </Kbd>
            </div>

            <CommandList className={styles.list}>
              <CommandEmpty className={styles.empty}>
                {emptyMessage}
              </CommandEmpty>

              {groups.map((group) => (
                <CommandGroup
                  key={group.id}
                  className={styles.group}
                  heading={
                    <span
                      data-slot="command-dialog-group-heading"
                      className={styles.groupHead}
                    >
                      {group.heading}
                      {typeof group.count === "number" ? (
                        <span className={styles.groupCount}>{group.count}</span>
                      ) : null}
                    </span>
                  }
                >
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.value}
                      onSelect={item.onSelect}
                      className={styles.item}
                    >
                      {item.icon ? (
                        <span
                          className={styles.itemIcon}
                          data-slot="command-dialog-item-icon"
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                      ) : null}
                      <span
                        className={styles.itemLabel}
                        data-slot="command-dialog-item-label"
                      >
                        {item.label}
                      </span>
                      {item.meta ? (
                        <span
                          className={styles.itemMeta}
                          data-slot="command-dialog-item-meta"
                        >
                          {item.meta}
                        </span>
                      ) : null}
                      {item.shortcut ? (
                        <Kbd
                          size="sm"
                          data-slot="command-dialog-item-kbd"
                        >
                          {item.shortcut}
                        </Kbd>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>

            {showFooter ? (
              <footer
                className={styles.footer}
                data-slot="command-dialog-footer"
              >
                {hasFooterHints ? (
                  <span
                    className={styles.footerHints}
                    data-slot="command-dialog-footer-hints"
                  >
                    {footerHints!.map((hint, idx) => {
                      const keys = normalizeKeys(hint.keys)
                      return (
                        <span
                          key={idx}
                          className={styles.hint}
                          data-slot="command-dialog-footer-hint"
                        >
                          {keys.length > 1 ? (
                            <Kbd size="sm" keys={keys} />
                          ) : (
                            <Kbd size="sm">{keys[0]}</Kbd>
                          )}{" "}
                          {hint.label}
                        </span>
                      )
                    })}
                  </span>
                ) : null}
                <span className={styles.spacer} />
                {showResultCount ? (
                  <span
                    className={styles.resultCount}
                    data-slot="command-dialog-result-count"
                  >
                    {totalResults} {totalResults === 1 ? "result" : "results"}
                  </span>
                ) : null}
              </footer>
            ) : null}
          </Command>
        </DialogContent>
      </Dialog>
    )
  }
)

CommandDialog.displayName = "CommandDialog"

export { CommandDialog }
