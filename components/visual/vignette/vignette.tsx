import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./vignette.module.css"

// ---------------------------------------------------------------------------
// VignetteProps
// ---------------------------------------------------------------------------

export interface VignetteProps {
  /**
   * CSS `z-index` for the vignette layer.
   * Default matches the Blacklight bl-vignette value (20).
   */
  zIndex?: number
  /**
   * Additional class names applied to the root element.
   */
  className?: string
  /**
   * Additional inline styles. CSS custom properties can be passed here to
   * override gradient stops/strength:
   *
   * - `--vignette-transparent-stop` (default: `52%`) — inner clear stop
   * - `--vignette-color-stop` (default: `100%`) — outer dark stop
   * - `--vignette-color` (default: `rgba(0, 0, 6, 0.5)`) — outer dark color
   * - `--vignette-size-x` (default: `120%`) — horizontal gradient radius
   * - `--vignette-size-y` (default: `90%`) — vertical gradient radius
   * - `--vignette-position` (default: `50% 38%`) — gradient focal point
   */
  style?: React.CSSProperties
}

// ---------------------------------------------------------------------------
// Vignette
// ---------------------------------------------------------------------------

/**
 * Fixed, full-viewport radial vignette layer. Decorative atmosphere atom —
 * pointer-events-none, aria-hidden, static (no motion). Ported from the
 * Blacklight `.bl-vignette` depth system (BL-326).
 *
 * Drop anywhere in your layout tree; it escapes the containing block via
 * `position: fixed` and covers the full viewport.
 */
const Vignette = React.forwardRef<HTMLDivElement, VignetteProps>(
  ({ zIndex = 20, className, style }, ref) => {
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(styles.vignette, className)}
        style={{ zIndex, ...style }}
      />
    )
  },
)

Vignette.displayName = "Vignette"

export { Vignette }
