import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./surface-row.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SurfaceRowProps {
  /** CSS custom property token for the surface background */
  token: string
  /** Display name (e.g. "Card", "Page") */
  name: string
  /** When true, text renders in inverse/light colors */
  lightText?: boolean
  className?: string
}

// ─── SurfaceRow ─────────────────────────────────────────────────────────────

function SurfaceRow({ token, name, lightText, className }: SurfaceRowProps) {
  return (
    <div
      data-slot="surface-row"
      className={cn(styles.card, className)}
      style={{ background: `var(${token})` }}
    >
      <span
        className={styles.label}
        style={{ color: lightText ? "var(--text-inverse, #ffffff)" : "var(--text-primary, #111827)" }}
      >
        {name}
      </span>
      <span
        className={styles.token}
        style={{ color: lightText ? "var(--text-inverse-secondary, #e5e7eb)" : "var(--text-secondary, #6b7280)" }}
      >
        {token}
      </span>
    </div>
  )
}

export { SurfaceRow }
