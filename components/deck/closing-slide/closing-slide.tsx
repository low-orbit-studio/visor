import type { ReactNode } from "react"
import { Slide } from "../slide/slide"
import { staggerDelay } from "../../../lib/deck-stagger"
import { cn } from "../../../lib/utils"
import styles from "./closing-slide.module.css"

export interface ClosingSlideProps {
  /** Custom slide id (default: "s-close") */
  id?: string
  /** Main tagline text */
  tagline?: string
  /** Subtitle below the tagline */
  subtitle?: string
  /** Body text below the divider */
  body?: string
  /** Custom content rendered below body text */
  extra?: ReactNode
  className?: string
}

export function ClosingSlide({
  id = "s-close",
  tagline = "Thank you.",
  subtitle,
  body,
  extra,
  className,
}: ClosingSlideProps) {
  return (
    <Slide id={id} theme="dark" center className={className}>
      <div data-slot="closing-slide" className={styles.content}>
        <h2
          className={styles.tagline}
          data-deck-animate
          style={staggerDelay(1, "hero")}
        >
          {tagline}
        </h2>
        {subtitle && (
          <p
            className={styles.subtitle}
            data-deck-animate
            style={staggerDelay(2, "hero")}
          >
            {subtitle}
          </p>
        )}
        <hr
          className={styles.divider}
          data-deck-animate
          style={staggerDelay(3, "hero")}
        />
        {body && (
          <p
            className={styles.body}
            data-deck-animate
            style={staggerDelay(4, "hero")}
          >
            {body}
          </p>
        )}
        {extra}
      </div>
    </Slide>
  )
}
