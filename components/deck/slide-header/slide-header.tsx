"use client"

import { cn } from "../../../lib/utils"
import { staggerDelay } from "../../../lib/deck-stagger"
import styles from "./slide-header.module.css"

export interface SlideHeaderProps {
  /** Section subtitle displayed above the title */
  subtitle: string
  /** Main heading text */
  title: string
  /** Optional description paragraph below the title */
  description?: string
  className?: string
}

export function SlideHeader({
  subtitle,
  title,
  description,
  className,
}: SlideHeaderProps) {
  return (
    <div data-slot="slide-header" className={cn(styles.header, className)}>
      <div
        className={styles.subtitle}
        data-deck-animate
        style={staggerDelay(0, "text")}
      >
        {subtitle}
      </div>
      <h2
        className={styles.title}
        data-deck-animate
        style={staggerDelay(1, "text")}
      >
        {title}
      </h2>
      {description && (
        <p
          className={styles.description}
          data-deck-animate
          style={staggerDelay(2, "text")}
        >
          {description}
        </p>
      )}
    </div>
  )
}
