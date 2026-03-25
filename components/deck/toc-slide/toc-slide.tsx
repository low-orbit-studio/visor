"use client"

import { Slide } from "../slide/slide"
import { useDeck } from "../deck-context/deck-context"
import { staggerDelay } from "../../../lib/deck-stagger"
import { cn } from "../../../lib/utils"
import styles from "./toc-slide.module.css"

export interface TOCItem {
  id: string
  title: string
}

export interface TOCSection {
  section: string
  items: TOCItem[]
}

export interface TOCSlideProps {
  /** Sections with navigable items */
  sections: TOCSection[]
  /** Optional background image */
  backgroundImage?: string
  /** Custom slide id (default: "s-toc") */
  id?: string
  className?: string
}

export function TOCSlide({
  sections,
  backgroundImage,
  id = "s-toc",
  className,
}: TOCSlideProps) {
  const { navigateTo } = useDeck()
  const theme = backgroundImage ? "dark" : "light"

  return (
    <Slide id={id} theme={theme} className={className}>
      {backgroundImage && (
        <div className={styles.bgContainer}>
          <img
            src={backgroundImage}
            alt=""
            className={styles.bgImage}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <div className={styles.content}>
        <div
          className={styles.subtitle}
          data-deck-animate
          style={staggerDelay(0, "text")}
        >
          Contents
        </div>
        <h2
          className={styles.title}
          data-deck-animate
          style={staggerDelay(1, "text")}
        >
          Table of Contents
        </h2>
        <div className={styles.grid}>
          {sections.map((group, gi) => (
            <div
              key={group.section}
              className={styles.section}
              data-deck-animate
              style={staggerDelay(gi + 2, "text")}
            >
              <div className={styles.sectionTitle}>{group.section}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.link}
                  onClick={() => navigateTo(item.id)}
                >
                  {item.title}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Slide>
  )
}
