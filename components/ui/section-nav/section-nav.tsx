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
  /**
   * Leading icon, accepted in two forms:
   * - a Phosphor icon **component** (e.g. `icon={UsersIcon}`) — rendered as
   *   `<Icon className={styles.icon} weight="regular" />`, the canonical form;
   * - a rendered **element** (e.g. `icon={<Users size={16} weight="bold" />}`) —
   *   rendered as-is so its own `size`/`weight`/props are preserved, wrapped in
   *   the `styles.icon` slot span.
   */
  icon?: Icon | React.ReactNode
  /** Item label text. */
  label: React.ReactNode
  /** Optional trailing count pill value. `0` is rendered; `undefined`/`null` hides the pill. */
  count?: number
}

const SectionNavItem = React.forwardRef<HTMLAnchorElement, SectionNavItemProps>(
  (
    { className, asChild, isActive, icon, label, count, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "a"
    const showCount = count != null

    // `icon` accepts both a Phosphor component (`icon={Users}`) and a rendered
    // element (`icon={<Users size={16} weight="bold" />}`). Branch on
    // React.isValidElement: render an element as-is (preserving its own props),
    // wrapped in the icon slot span; render a component type via the canonical
    // `<Icon className={styles.icon} weight="regular" />` form.
    let iconNode: React.ReactNode = null
    if (React.isValidElement(icon)) {
      iconNode = (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )
    } else if (icon) {
      // A component *type* — a function or a forwardRef/memo object (Phosphor
      // icons are forwardRef objects, so `typeof` is "object", not "function").
      const IconComp = icon as Icon
      iconNode = (
        <IconComp className={styles.icon} weight="regular" aria-hidden="true" />
      )
    }

    const chrome = (
      <>
        {iconNode}
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
