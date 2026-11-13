"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import styles from "./admin-shell.module.css"

export interface AdminShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Branding slot at the top of the sidebar (logo, wordmark, product switcher). */
  logo?: React.ReactNode
  /** Navigation content rendered in the sidebar body. Consumer provides their own link list. */
  sidebarNav: React.ReactNode
  /** Bottom-of-sidebar slot (user menu, logout, theme toggle, etc.). */
  sidebarFooter?: React.ReactNode
  /** Sidebar width. Number is treated as pixels; strings pass through. Default 256. */
  sidebarWidth?: number | string

  /**
   * When true, the sidebar folds to an icon rail and back, from a button beside
   * the logo or the `collapseShortcut` key. The shell and its sidebar carry
   * `data-collapsed`, so a slot can hide its labels. Desk only: below 48rem the
   * sidebar stays open and the button is not drawn. Default false.
   */
  collapsible?: boolean
  /** Uncontrolled initial state, used when nothing is remembered. Default false. */
  defaultCollapsed?: boolean
  /** Controlled state. Pair with `onCollapsedChange`. */
  collapsed?: boolean
  /** Called with the next state when the button or the key folds or opens the sidebar. */
  onCollapsedChange?: (collapsed: boolean) => void
  /** Key pressed with ⌘ (Ctrl off a Mac) that folds and opens the sidebar. `false` turns it off. Default "\\". */
  collapseShortcut?: string | false
  /** localStorage key that remembers the state per browser. Omit to remember nothing. */
  storageKey?: string

  /** Breadcrumb component instance rendered at the start of the topbar. */
  breadcrumb?: React.ReactNode
  /** Left side of the topbar, after the breadcrumb. */
  topbarStart?: React.ReactNode
  /** Center slot (status indicators, search, realtime signals). */
  topbarCenter?: React.ReactNode
  /** Right side of the topbar (user menu, theme toggle, quick actions). */
  topbarEnd?: React.ReactNode
  /** When true, the topbar is not rendered. Default false. */
  hideTopbar?: boolean

  /** Main content. */
  children: React.ReactNode
  /** Optional max-width for the main content area. Number is treated as pixels. */
  mainMaxWidth?: number | string
  /** Padding scale applied to the main content area. Default "lg". */
  mainPadding?: "none" | "sm" | "md" | "lg"
}

// The rail is desk-only; this matches the shell's narrow container query.
const NARROW_QUERY = "(max-width: 48rem)"

function subscribeNarrow(callback: () => void) {
  const mql = window.matchMedia(NARROW_QUERY)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

const getNarrow = () => window.matchMedia(NARROW_QUERY).matches
const getFalse = () => false

function subscribeStorage(callback: () => void) {
  window.addEventListener("storage", callback)
  return () => window.removeEventListener("storage", callback)
}

// A private window or blocked storage throws; the shell then just opens expanded.
function readStored(key: string | undefined): boolean | null {
  if (!key) return null
  try {
    const value = window.localStorage.getItem(key)
    return value === "rail" ? true : value === "open" ? false : null
  } catch {
    return null
  }
}

function writeStored(key: string | undefined, collapsed: boolean) {
  if (!key) return
  try {
    window.localStorage.setItem(key, collapsed ? "rail" : "open")
  } catch {
    // Not remembered in a private window.
  }
}

function resolveSize(value: number | string | undefined, fallback: string): string {
  if (value == null) return fallback
  return typeof value === "number" ? `${value}px` : value
}

export function AdminShell({
  logo,
  sidebarNav,
  sidebarFooter,
  sidebarWidth = 256,
  collapsible = false,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  collapseShortcut = "\\",
  storageKey,
  breadcrumb,
  topbarStart,
  topbarCenter,
  topbarEnd,
  hideTopbar = false,
  children,
  mainMaxWidth,
  mainPadding = "lg",
  className,
  style,
  ...props
}: AdminShellProps) {
  const narrow = React.useSyncExternalStore(subscribeNarrow, getNarrow, getFalse)
  const stored = React.useSyncExternalStore(
    subscribeStorage,
    () => readStored(storageKey),
    () => null
  )
  const [localCollapsed, setLocalCollapsed] = React.useState<boolean | null>(null)
  // Only a toggle animates; restoring the remembered state on load does not.
  const [animate, setAnimate] = React.useState(false)
  const sidebarId = React.useId()

  const isCollapsed = collapsedProp ?? localCollapsed ?? stored ?? defaultCollapsed
  const canFold = collapsible && !narrow
  const railed = canFold && isCollapsed

  const toggle = React.useCallback(() => {
    const next = !isCollapsed
    setAnimate(true)
    if (collapsedProp === undefined) setLocalCollapsed(next)
    writeStored(storageKey, next)
    onCollapsedChange?.(next)
  }, [isCollapsed, collapsedProp, storageKey, onCollapsedChange])

  React.useEffect(() => {
    if (!canFold || collapseShortcut === false) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === collapseShortcut && (event.metaKey || event.ctrlKey) && !event.altKey) {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [canFold, collapseShortcut, toggle])

  const collapsedAttr = collapsible ? String(railed) : undefined
  const toggleLabel = railed ? "Expand the sidebar" : "Collapse the sidebar"

  const resolvedSidebarWidth = resolveSize(sidebarWidth, "16rem")
  const resolvedMaxWidth = resolveSize(mainMaxWidth, "none")

  const shellStyle = {
    ...style,
    ["--admin-shell-sidebar-width" as string]: resolvedSidebarWidth,
    ["--admin-shell-main-max-width" as string]: resolvedMaxWidth,
  } as React.CSSProperties

  return (
    <div
      className={cn(styles.root, className)}
      style={shellStyle}
      data-slot="admin-shell"
      data-collapsed={collapsedAttr}
      data-animate={animate ? "" : undefined}
      {...props}
    >
      <a href="#admin-main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <aside
        id={sidebarId}
        className={styles.sidebar}
        data-slot="admin-shell-sidebar"
        data-collapsed={collapsedAttr}
        aria-label="Primary navigation"
      >
        {logo || canFold ? (
          <div className={styles.sidebarHeader} data-slot="admin-shell-sidebar-header">
            {logo}
            {canFold ? (
              <button
                type="button"
                className={styles.collapseButton}
                data-slot="admin-shell-collapse"
                aria-expanded={!railed}
                aria-controls={sidebarId}
                aria-label={toggleLabel}
                aria-keyshortcuts={
                  collapseShortcut === false
                    ? undefined
                    : `Meta+${collapseShortcut} Control+${collapseShortcut}`
                }
                title={toggleLabel}
                onClick={toggle}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2.5" width="12" height="11" rx="2.5" />
                  <path d="M6.5 2.5v11M11 6.5 9.5 8l1.5 1.5" />
                </svg>
              </button>
            ) : null}
          </div>
        ) : null}
        <nav
          className={styles.sidebarNav}
          data-slot="admin-shell-sidebar-nav"
          aria-label="Sidebar"
        >
          {sidebarNav}
        </nav>
        {sidebarFooter ? (
          <div className={styles.sidebarFooter} data-slot="admin-shell-sidebar-footer">
            {sidebarFooter}
          </div>
        ) : null}
      </aside>

      <div className={styles.body} data-slot="admin-shell-body">
        {!hideTopbar ? (
          <header
            role="banner"
            className={styles.topbar}
            data-slot="admin-shell-topbar"
          >
            <div className={styles.topbarStart}>
              {breadcrumb}
              {topbarStart}
            </div>
            <div className={styles.topbarCenter}>{topbarCenter}</div>
            <div className={styles.topbarEnd}>{topbarEnd}</div>
          </header>
        ) : null}

        <main
          id="admin-main-content"
          role="main"
          className={styles.main}
          data-slot="admin-shell-main"
          data-padding={mainPadding}
          tabIndex={-1}
        >
          <div className={styles.mainInner}>{children}</div>
        </main>
      </div>
    </div>
  )
}
