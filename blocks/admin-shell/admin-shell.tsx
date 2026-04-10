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

function resolveSize(value: number | string | undefined, fallback: string): string {
  if (value == null) return fallback
  return typeof value === "number" ? `${value}px` : value
}

export function AdminShell({
  logo,
  sidebarNav,
  sidebarFooter,
  sidebarWidth = 256,
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
      {...props}
    >
      <a href="#admin-main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      <aside
        className={styles.sidebar}
        data-slot="admin-shell-sidebar"
        aria-label="Primary navigation"
      >
        {logo ? (
          <div className={styles.sidebarHeader} data-slot="admin-shell-sidebar-header">
            {logo}
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
