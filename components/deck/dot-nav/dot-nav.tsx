"use client"

import { useState } from "react"
import { cn } from "../../../lib/utils"
import styles from "./dot-nav.module.css"

export interface DotNavProps {
  /** Total number of slides */
  slideCount: number
  /** Currently active slide index */
  currentIndex: number
  /** Callback when a dot is clicked */
  onDotClick: (index: number) => void
  /** Color variant */
  variant?: "light" | "dark"
  /** Optional slide titles for tooltips */
  titles?: string[]
}

export function DotNav({
  slideCount,
  currentIndex,
  onDotClick,
  variant = "light",
  titles = [],
}: DotNavProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className={styles.navWrapper}>
      <nav
        data-slot="dot-nav"
        className={cn(styles.nav, variant === "dark" && styles.dark)}
        aria-label="Slide navigation"
      >
        {Array.from({ length: slideCount }, (_, i) => (
          <button
            key={i}
            type="button"
            className={cn(
              styles.dot,
              i === currentIndex && styles.active,
              hoveredIndex === i && styles.hovered
            )}
            onClick={() => onDotClick(i)}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            aria-label={titles[i] ?? `Go to slide ${i + 1}`}
            aria-current={i === currentIndex ? "true" : undefined}
          >
            {titles[i] && (
              <span className={styles.tooltip} aria-hidden="true">
                {titles[i]}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}
