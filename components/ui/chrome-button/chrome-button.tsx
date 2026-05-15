import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import { Kbd } from "../kbd/kbd"
import styles from "./chrome-button.module.css"

const chromeButtonVariants = cva(styles.root, {
  variants: {
    variant: {
      default: styles.variantDefault,
      primary: styles.variantPrimary,
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface ChromeButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof chromeButtonVariants> {
  /** Leading icon node — typically a 14px Phosphor icon. */
  icon?: React.ReactNode
  /** Trailing keyboard shortcut hint, e.g. `["⌘", "K"]`. Rendered as `<Kbd keys={...} size="sm" />`. */
  keys?: string[]
  children: React.ReactNode
}

/**
 * ChromeButton — 28px button primitive for topbar and chrome contexts.
 *
 * Composes an optional leading icon, a label, and an optional trailing Kbd
 * shortcut hint. Two variants: `default` (muted interactive surface) and
 * `primary` (accent surface). Inherits all native `<button>` behavior — pass
 * `aria-label` via spread props for icon-only usage.
 *
 * Not a replacement for Button — Button is full-scale body chrome (32/40/48px);
 * ChromeButton is dense topbar chrome (28px) with the inline Kbd slot pattern
 * admin shells repeat.
 */
const ChromeButton = React.forwardRef<HTMLButtonElement, ChromeButtonProps>(
  (
    { className, variant, icon, keys, type = "button", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        data-slot="chrome-button"
        data-variant={variant ?? "default"}
        className={cn(chromeButtonVariants({ variant }), className)}
        {...props}
      >
        {icon ? (
          <span
            data-slot="chrome-button-icon"
            className={styles.icon}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
        <span data-slot="chrome-button-label" className={styles.label}>
          {children}
        </span>
        {keys && keys.length > 0 ? (
          <span data-slot="chrome-button-kbd" className={styles.keys}>
            <Kbd keys={keys} size="sm" />
          </span>
        ) : null}
      </button>
    )
  }
)
ChromeButton.displayName = "ChromeButton"

export { ChromeButton, chromeButtonVariants }
