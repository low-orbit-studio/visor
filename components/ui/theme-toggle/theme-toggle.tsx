"use client"

import * as React from "react"
import { Moon, Sun } from "@phosphor-icons/react"
import { cn } from "../../../lib/utils"
import styles from "./theme-toggle.module.css"

export type ThemeToggleValue = "light" | "dark"

export interface ThemeToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "onChange"> {
  /** The tone in force now. Controlled: the toggle never changes it on its own. */
  value: ThemeToggleValue
  /** Called with the other tone when the button is pressed. */
  onValueChange?: (value: ThemeToggleValue) => void
}

/**
 * A round light/dark button. Dark shows the sun, light shows the moon: the
 * icon going away turns and shrinks out as the other springs in. Keys off its
 * own `data-tone`, so it works on any page.
 */
const ThemeToggle = React.forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ value, onValueChange, onClick, className, "aria-label": ariaLabel = "Switch light or dark", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      data-slot="theme-toggle"
      data-tone={value}
      aria-label={ariaLabel}
      className={cn(styles.root, className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) onValueChange?.(value === "dark" ? "light" : "dark")
      }}
      {...props}
    >
      <Sun weight="bold" className={styles.sun} aria-hidden="true" />
      <Moon weight="bold" className={styles.moon} aria-hidden="true" />
    </button>
  )
)
ThemeToggle.displayName = "ThemeToggle"

export { ThemeToggle }
