import * as React from "react"
import { cn } from "../../../lib/utils"
import styles from "./hero-glow.module.css"

export interface HeroGlowProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The glow color. Accepts any CSS color value.
   *
   * This sets the `--glow-color` CSS custom property on the element.
   * The consumer may also set `--glow-color` externally (e.g., via a parent
   * CSS variable or an inline style that changes every rAF frame).
   *
   * When omitted, `--glow-color` must be set by an ancestor for the glow
   * to appear — the fallback is transparent.
   */
  glowColor?: string
}

/**
 * HeroGlow — breathing radial glow band for hero media.
 *
 * A decorative `position: absolute` element that casts a radial gradient glow
 * outside its parent box. Color is driven by the `--glow-color` CSS custom
 * property so the caller can rewrite it every rAF frame (e.g. Blacklight's
 * live artist-keyed `--color-acid`) without triggering a React re-render.
 *
 * The breathing animation (opacity 0.75 ↔ 1, scale 1 ↔ 1.03, 7s cycle) is
 * disabled when `prefers-reduced-motion: reduce` is active.
 *
 * Usage:
 *   The parent element must be `position: relative`. HeroGlow extends beyond
 *   the parent's box via negative inset (-6% top, -8% sides, -10% bottom).
 *
 * ```tsx
 * <div style={{ position: 'relative' }}>
 *   <HeroGlow glowColor="oklch(70% 0.3 145)" />
 *   <img src="hero.jpg" alt="Hero" />
 * </div>
 * ```
 */
const HeroGlow = React.forwardRef<HTMLDivElement, HeroGlowProps>(
  ({ className, glowColor, style, ...props }, ref) => {
    const resolvedStyle: React.CSSProperties = {
      ...style,
      ...(glowColor ? { "--glow-color": glowColor } as React.CSSProperties : {}),
    }

    return (
      <div
        ref={ref}
        data-slot="hero-glow"
        aria-hidden="true"
        className={cn(styles.root, className)}
        style={resolvedStyle}
        {...props}
      />
    )
  }
)
HeroGlow.displayName = "HeroGlow"

export { HeroGlow }
