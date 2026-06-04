import * as React from "react"
import { cn } from "../../../lib/utils"
import { SurfaceRow } from "../surface-row/surface-row"
import styles from "./surface-scale-stack.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SurfaceScaleItem {
  /** CSS custom property token for the surface background (e.g. "--surface-page") */
  token: string
  /** Display name (e.g. "Page", "Card") */
  name: string
  /** Optional use-note shown in the right-aligned column */
  note?: string
  /** When true, text renders in inverse/light colors for dark surfaces */
  lightText?: boolean
}

export interface SurfaceScaleStackProps {
  /** Ordered array of surface tiers to render */
  surfaces: SurfaceScaleItem[]
  className?: string
}

// ─── SurfaceScaleStack ───────────────────────────────────────────────────────

function SurfaceScaleStack({ surfaces, className }: SurfaceScaleStackProps) {
  const hasNotes = surfaces.some((s) => s.note !== undefined)

  return (
    <div
      data-slot="surface-scale-stack"
      className={cn(styles.stack, hasNotes && styles.withNotes, className)}
    >
      {surfaces.map((surface) => (
        <div key={surface.token} className={styles.rowWrapper}>
          <div className={styles.rowContent}>
            <SurfaceRow
              token={surface.token}
              name={surface.name}
              lightText={surface.lightText}
            />
          </div>
          {hasNotes && (
            <div className={styles.noteCell}>
              {surface.note && (
                <span className={styles.note}>{surface.note}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export { SurfaceScaleStack }
