import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils"
import styles from "./ambient-glow.module.css"

const ambientGlowVariants = cva(styles.base, {
  variants: {
    variant: {
      /**
       * Keyed — color drawn from `--glow-color`. Set the var on a parent or
       * on the element via `style`. Blacklight-style live page crossfades write
       * the var on `<html>` every rAF; the glow repaint is handled by the CSS
       * engine — no React re-render required.
       */
      keyed: styles.variantKeyed,
      /**
       * Gold — static warm gold glow (#ffbe26 at 7% opacity). Used for
       * premium / Pro surfaces. `--glow-color` is not consumed in this variant.
       */
      gold: styles.variantGold,
    },
  },
  defaultVariants: {
    variant: "keyed",
  },
})

export interface AmbientGlowProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ambientGlowVariants> {
  /**
   * Override the glow color at render time.
   * Equivalent to setting `--glow-color` via `style` — prefer this prop when
   * the color is known statically. For live runtime rewrites (e.g. hero
   * crossfades), set `--glow-color` on an ancestor element directly via JS
   * to avoid re-renders.
   *
   * Only used by the `keyed` variant.
   */
  glowColor?: string
}

/**
 * `AmbientGlow` — absolutely-positioned drifting radial glow.
 *
 * Decorative only: `aria-hidden="true"`, `pointer-events: none`.
 * Parent element must have a non-static position (e.g. `position: relative`)
 * to contain the absolute positioning.
 *
 * Color is driven by the CSS custom property `--glow-color`, which defaults
 * to `var(--accent)`. For live runtime color rewrites (e.g. hero crossfades),
 * write `--glow-color` on an ancestor element — the CSS engine repaints
 * without triggering a React re-render.
 *
 * Size and position are controlled by `className` or `style` at the call site.
 *
 * @example Keyed to theme accent, filling the parent
 * ```tsx
 * <div style={{ position: 'relative', width: 400, height: 400 }}>
 *   <AmbientGlow style={{ inset: 0 }} />
 * </div>
 * ```
 *
 * @example Gold variant with custom placement
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <AmbientGlow variant="gold" style={{ inset: '-10% -15%' }} />
 * </div>
 * ```
 *
 * @example Live color override via glowColor prop
 * ```tsx
 * <AmbientGlow glowColor="var(--color-acid)" style={{ inset: 0 }} />
 * ```
 */
export function AmbientGlow({
  variant,
  glowColor,
  className,
  style,
  ...props
}: AmbientGlowProps) {
  const inlineStyle: React.CSSProperties = {
    ...(glowColor ? { ["--glow-color" as string]: glowColor } : {}),
    ...style,
  }

  return (
    <div
      aria-hidden="true"
      data-slot="ambient-glow"
      data-variant={variant ?? "keyed"}
      className={cn(ambientGlowVariants({ variant }), className)}
      style={inlineStyle}
      {...props}
    />
  )
}
