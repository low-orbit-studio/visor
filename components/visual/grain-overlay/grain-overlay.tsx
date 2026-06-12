import * as React from "react"
import styles from "./grain-overlay.module.css"

export interface GrainOverlayProps {
  /** Grain opacity. Default 0.035 matches the Blacklight bl-grain reference. */
  opacity?: number
  /** z-index of the overlay layer. Default 30 sits above page sections but below modals (z-100). */
  zIndex?: number
}

/**
 * GrainOverlay — fixed, full-viewport film-grain noise layer.
 *
 * Ports Blacklight's `.bl-grain` depth-system primitive (BL-326). Kills the
 * "flat digital fill" read of large near-black areas. Fixed positioning means
 * it does not scroll with content — true film behavior. Static grain (no
 * animation) avoids full-viewport repaint every frame.
 *
 * Decorative only: aria-hidden, pointer-events-none. No color channel —
 * monochrome SVG fractalNoise texture tiled at 160×160px.
 */
export function GrainOverlay({ opacity = 0.035, zIndex = 30 }: GrainOverlayProps) {
  return (
    <div
      aria-hidden="true"
      className={styles.grain}
      style={{ opacity, zIndex }}
    />
  )
}

GrainOverlay.displayName = "GrainOverlay"
