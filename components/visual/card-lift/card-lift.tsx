import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./card-lift.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CardLiftProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * CSS color value for the halo on hover. Accepts any CSS color, including
   * CSS custom properties (e.g. `"var(--color-acid)"` or `"#6366f1"`).
   * Written to `--lift-color` at paint time — the halo tracks live rewrites
   * without re-render.
   *
   * Defaults to `var(--accent, #6366f1)`.
   */
  liftColor?: string
}

// ─── CardLift ───────────────────────────────────────────────────────────────

/**
 * CardLift — hover lift + live-keyed halo interaction.
 *
 * A thin wrapper div that applies a CSS-only hover effect:
 * - `translateY(-4px)` lift on hover
 * - Deep ambient shadow + a colored halo keyed to `--lift-color`
 * - `prefers-reduced-motion: reduce` collapses transition and transform
 *
 * Port of `.bl-card-lift` from blacklight-website (BL-326).
 *
 * @example
 * // Basic usage — halo defaults to --accent
 * <CardLift>
 *   <Card>...</Card>
 * </CardLift>
 *
 * @example
 * // Live-keyed halo: pass any CSS color or custom property reference
 * <CardLift liftColor="var(--color-acid)">
 *   <Card>...</Card>
 * </CardLift>
 */
const CardLift = React.forwardRef<HTMLDivElement, CardLiftProps>(
  ({ className, liftColor, style, children, ...props }, ref) => {
    const mergedStyle: React.CSSProperties = liftColor
      ? { "--lift-color": liftColor, ...style } as React.CSSProperties
      : style ?? {}

    return (
      <div
        ref={ref}
        data-slot="card-lift"
        className={cn(styles.cardLift, className)}
        style={mergedStyle}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CardLift.displayName = "CardLift"

export { CardLift }
