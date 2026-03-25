import type { ReactNode } from "react"
import { Slide } from "../slide/slide"
import { staggerDelay } from "../../../lib/deck-stagger"
import { cn } from "../../../lib/utils"
import styles from "./hero-slide.module.css"

export interface HeroSlideProps {
  /** Unique slide identifier */
  id: string
  /** Badge text displayed above the title */
  badge: string
  /** Title text (mutually exclusive with titleContent) */
  title?: string
  /** Custom title content as ReactNode */
  titleContent?: ReactNode
  /** Subtitle displayed below the title */
  subtitle: string
  /** Hero background image URL */
  heroImage?: string
  /** Logo image URL for split layout mode */
  logo?: string
  /** Description paragraph */
  description?: string
  className?: string
}

export function HeroSlide({
  id,
  badge,
  title,
  titleContent,
  subtitle,
  heroImage,
  logo,
  description,
  className,
}: HeroSlideProps) {
  const isSplit = Boolean(logo && !heroImage)

  return (
    <Slide
      id={id}
      theme="dark"
      hero={!isSplit}
      heroImage={heroImage}
      className={className}
    >
      <div
        data-slot="hero-slide"
        className={cn(
          isSplit ? styles.split : styles.content,
          styles.aboveOverlay
        )}
      >
        <div className={isSplit ? styles.splitText : undefined}>
          <span
            className={styles.badge}
            data-deck-animate
            style={staggerDelay(1, "hero")}
          >
            {badge}
          </span>
          {titleContent ? (
            <div data-deck-animate style={staggerDelay(2, "hero")}>
              {titleContent}
            </div>
          ) : (
            <h1
              className={styles.title}
              data-deck-animate
              style={staggerDelay(2, "hero")}
            >
              {title}
            </h1>
          )}
          <p
            className={styles.subtitle}
            data-deck-animate
            style={staggerDelay(3, "hero")}
          >
            {subtitle}
          </p>
          <hr
            className={styles.divider}
            data-deck-animate
            style={staggerDelay(4, "hero")}
          />
          {description && (
            <p
              className={styles.description}
              data-deck-animate
              style={staggerDelay(5, "hero")}
            >
              {description}
            </p>
          )}
        </div>
        {isSplit && logo && (
          <div
            className={styles.splitLogo}
            data-deck-animate
            style={staggerDelay(3, "card")}
          >
            <img
              src={logo}
              alt="Logo"
              loading="lazy"
              decoding="async"
              className={styles.logoImage}
            />
          </div>
        )}
      </div>
    </Slide>
  )
}
