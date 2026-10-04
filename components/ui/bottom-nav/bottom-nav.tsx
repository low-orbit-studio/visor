"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./bottom-nav.module.css"

/* ─── Types ─────────────────────────────────────────────────────────── */

/** An icon component that takes a Phosphor-style `weight`. A Phosphor icon fits as is. */
export type BottomNavIcon = React.ComponentType<{
  weight?: "regular" | "fill"
  size?: number | string
  className?: string
  "aria-hidden"?: boolean | "true" | "false"
}>

export interface BottomNavItem {
  /** Stable key. Falls back to `href`, then `label`. */
  key?: string
  /** The destination's name. Visually hidden unless the bar has `showLabels`. */
  label: string
  /** Icon component. The active destination renders it with `weight="fill"`. */
  icon: BottomNavIcon
  /** Renders an `<a>`. Without it the destination is a `<button>`. */
  href?: string
  /** Fires on click, for an `<a>` as well as a `<button>`. */
  onSelect?: (event: React.MouseEvent<HTMLElement>) => void
  /** The destination that is open. Sets `aria-current="page"` and fills the icon. */
  active?: boolean
  /**
   * A mark on the destination: `true` for a dot alone, a number for a count.
   * The mark is a solid dot and never draws the number; the count lives in the
   * accessible name ("Inbox, 3 unread"). `0` and `false` draw nothing.
   */
  mark?: boolean | number
  /** The word that follows the count in the accessible name. Default "unread". */
  markLabel?: string
  /** A hairline is drawn before the first destination of each new `group`. Not announced. */
  group?: string
}

export interface BottomNavProps
  extends Omit<React.ComponentPropsWithoutRef<"nav">, "children"> {
  items: BottomNavItem[]
  /** Show each label under its icon. Default false: the label is visually hidden. */
  showLabels?: boolean
  /**
   * Pin the bar to the foot of the viewport (default) and publish its height as
   * `--bottom-nav-height` on the document root. `false` lays it out in flow, for
   * a frame or a preview, and publishes nothing.
   */
  fixed?: boolean
}

/* ─── Helpers ───────────────────────────────────────────────────────── */

/** The destination's accessible name: the label, plus the mark's meaning. */
export function bottomNavItemName(item: BottomNavItem): string {
  const word = item.markLabel ?? "unread"
  if (typeof item.mark === "number" && item.mark > 0) {
    return `${item.label}, ${item.mark} ${word}`
  }
  if (item.mark === true) return `${item.label}, ${word}`
  return item.label
}

const HEIGHT_TOKEN = "--bottom-nav-height"

/**
 * Publishes the bar's rendered height (safe-area pad included) as
 * `--bottom-nav-height` on the document root, so a page can set
 * `scroll-padding-bottom: var(--bottom-nav-height)` and a focused field scrolls
 * clear of the bar (WCAG 2.4.11). Removed on unmount.
 */
function usePublishHeight(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  React.useLayoutEffect(() => {
    const node = ref.current
    if (!enabled || !node) return
    const root = document.documentElement
    const publish = () => {
      root.style.setProperty(HEIGHT_TOKEN, `${node.getBoundingClientRect().height}px`)
    }
    publish()
    if (typeof ResizeObserver === "undefined") return () => root.style.removeProperty(HEIGHT_TOKEN)
    const observer = new ResizeObserver(publish)
    observer.observe(node)
    return () => {
      observer.disconnect()
      root.style.removeProperty(HEIGHT_TOKEN)
    }
  }, [ref, enabled])
}

/* ─── BottomNav ─────────────────────────────────────────────────────── */

const BottomNav = React.forwardRef<HTMLElement, BottomNavProps>(
  ({ items, showLabels = false, fixed = true, className, ...props }, ref) => {
    const navRef = React.useRef<HTMLElement | null>(null)
    const mergedRef = React.useCallback(
      (node: HTMLElement | null) => {
        navRef.current = node
        if (typeof ref === "function") ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node
      },
      [ref],
    )
    usePublishHeight(navRef, fixed)

    const children: React.ReactNode[] = []
    items.forEach((item, index) => {
      const itemKey = item.key ?? item.href ?? item.label
      const previous = items[index - 1]
      if (previous && (previous.group ?? "") !== (item.group ?? "")) {
        children.push(
          <li
            key={`${itemKey}-group`}
            className={styles.group}
            role="presentation"
            aria-hidden="true"
            data-slot="bottom-nav-group"
          />,
        )
      }

      const Icon = item.icon
      const hasMark =
        item.mark === true || (typeof item.mark === "number" && item.mark > 0)
      const content = (
        <>
          <span className={styles.iconBox}>
            <Icon
              className={styles.icon}
              size={24}
              weight={item.active ? "fill" : "regular"}
              aria-hidden="true"
            />
            {hasMark && (
              <span className={styles.mark} aria-hidden="true" data-slot="bottom-nav-mark" />
            )}
          </span>
          <span className={showLabels ? styles.label : styles.hiddenLabel}>{item.label}</span>
        </>
      )
      const shared = {
        className: styles.item,
        "aria-label": bottomNavItemName(item),
        "aria-current": item.active ? ("page" as const) : undefined,
        "data-active": item.active ? "true" : undefined,
        "data-labelled": showLabels ? "true" : undefined,
        "data-slot": "bottom-nav-item",
        onClick: item.onSelect,
      }
      children.push(
        <li key={itemKey} className={styles.cell}>
          {item.href !== undefined ? (
            <a href={item.href} {...shared}>
              {content}
            </a>
          ) : (
            <button type="button" {...shared}>
              {content}
            </button>
          )}
        </li>,
      )
    })

    return (
      <nav
        {...props}
        ref={mergedRef}
        data-slot="bottom-nav"
        data-fixed={fixed ? "true" : undefined}
        className={cn(styles.root, className)}
      >
        <ul className={styles.list}>{children}</ul>
      </nav>
    )
  },
)
BottomNav.displayName = "BottomNav"

export { BottomNav }
