import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./reach-rings.module.css"

export interface ReachRingsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** How many rings, the filled core included. */
  levels: number
  /**
   * How far the reach goes, from 0 (the core alone) to `levels - 1` (every ring).
   * `value + 1` rings are lit, from the centre out; -1 lights none.
   */
  value: number
  /** The glyph in the core, passed in by the consumer (e.g. a Phosphor icon). */
  icon?: React.ReactNode
  /** `default` is 148px across; `compact` is 112px. */
  size?: "default" | "compact"
}

/**
 * Concentric rings that light from the centre out to show how far something
 * reaches. Decorative: the control beside it carries the semantics.
 */
const ReachRings = React.forwardRef<HTMLDivElement, ReachRingsProps>(
  ({ className, levels, value, icon, size = "default", style, ...props }, ref) => {
    const count = Math.max(1, Math.floor(levels))
    const lit = Math.min(Math.max(Math.floor(value) + 1, 0), count)
    // Outermost first, so each ring paints over the halo of the one outside it.
    const rings = Array.from({ length: count }, (_, i) => count - 1 - i)

    return (
      <div
        ref={ref}
        aria-hidden="true"
        data-slot="reach-rings"
        data-size={size}
        data-lit={lit}
        className={cn(styles.root, className)}
        style={{ "--_levels": count, ...style } as React.CSSProperties}
        {...props}
      >
        {rings.map((k) => (
          <span
            key={k}
            data-slot={k === 0 ? "reach-rings-core" : "reach-rings-ring"}
            data-state={k < lit ? "on" : "off"}
            className={cn(styles.ring, k === 0 && styles.core)}
            style={{ "--_k": k } as React.CSSProperties}
          />
        ))}
        {icon ? (
          <span data-slot="reach-rings-icon" className={styles.icon}>
            {icon}
          </span>
        ) : null}
      </div>
    )
  }
)
ReachRings.displayName = "ReachRings"

export { ReachRings }
