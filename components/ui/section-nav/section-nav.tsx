"use client"

import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import type { Icon } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./section-nav.module.css"

// ─── SectionNav (root) ───────────────────────────────────────────────────────

const SectionNav = React.forwardRef<HTMLElement, React.ComponentProps<"nav">>(
  ({ className, "aria-label": ariaLabel, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label={ariaLabel ?? "section"}
      data-slot="section-nav"
      className={cn(styles.root, className)}
      {...props}
    />
  )
)
SectionNav.displayName = "SectionNav"

// ─── SectionNavItem ──────────────────────────────────────────────────────────

export interface SectionNavItemProps extends React.ComponentProps<"a"> {
  /**
   * When true, merge the item's chrome onto the immediate child element instead
   * of rendering an `<a>`. Use with `next/link` for client-side navigation:
   * `<SectionNavItem asChild isActive label="Members"><Link href="/members" /></SectionNavItem>`.
   */
  asChild?: boolean
  /** Marks the item as the current section — text-primary, 2px primary underline, primary-tinted count pill. */
  isActive?: boolean
  /** Leading Phosphor icon component (e.g. `UsersIcon`). */
  icon?: Icon
  /** Item label text. */
  label: React.ReactNode
  /** Optional trailing count pill value. `0` is rendered; `undefined`/`null` hides the pill. */
  count?: number
}

const SectionNavItem = React.forwardRef<HTMLAnchorElement, SectionNavItemProps>(
  (
    { className, asChild, isActive, icon: IconComp, label, count, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "a"
    const showCount = count != null

    const chrome = (
      <>
        {IconComp && (
          <IconComp className={styles.icon} weight="regular" aria-hidden="true" />
        )}
        <span className={styles.label}>{label}</span>
        {showCount && (
          <span
            className={cn(
              styles.count,
              isActive ? styles.countActive : styles.countNeutral
            )}
          >
            {count}
          </span>
        )}
      </>
    )

    return (
      <Comp
        ref={ref}
        data-slot="section-nav-item"
        data-active={isActive || undefined}
        aria-current={isActive ? "page" : undefined}
        className={cn(styles.item, isActive && styles.itemActive, className)}
        {...props}
      >
        {chrome}
        <Slottable>{children}</Slottable>
      </Comp>
    )
  }
)
SectionNavItem.displayName = "SectionNavItem"

export { SectionNav, SectionNavItem }
