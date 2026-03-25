"use client"

import { useDeck } from "../deck-context/deck-context"
import { staggerDelay } from "../../../lib/deck-stagger"
import { cn } from "../../../lib/utils"
import styles from "./deck-footer.module.css"

export interface DeckFooterLink {
  label: string
  /** Slide id for internal navigation */
  slide?: string
  /** External URL */
  href?: string
  /** Highlight as accent link */
  accent?: boolean
}

export interface DeckFooterColumn {
  title: string
  links: DeckFooterLink[]
}

export interface DeckFooterProps {
  /** Brand description */
  description: string
  /** Optional link columns */
  columns?: DeckFooterColumn[]
  /** Brand name (default: "Low Orbit Studio") */
  brandName?: string
  className?: string
}

export function DeckFooter({
  description,
  columns,
  brandName = "Low Orbit Studio",
  className,
}: DeckFooterProps) {
  const { navigateTo } = useDeck()

  const brand = (
    <div
      className={styles.brand}
      data-deck-animate
      style={columns ? staggerDelay(1, "footer") : undefined}
    >
      <div className={styles.logo}>
        {brandName}
        <span className={styles.logoDot}>.</span>
      </div>
      <p className={styles.description}>{description}</p>
    </div>
  )

  return (
    <footer
      data-slot="deck-footer"
      className={cn(styles.footer, className)}
      id="s-footer"
    >
      <div className={styles.inner}>
        {columns ? (
          <div className={styles.grid}>
            {brand}
            {columns.map((col, i) => (
              <div
                key={col.title}
                data-deck-animate
                style={staggerDelay(i + 2, "footer")}
              >
                <div className={styles.colTitle}>{col.title}</div>
                {col.links.map((link) =>
                  link.slide ? (
                    <button
                      key={link.label}
                      type="button"
                      className={cn(
                        styles.link,
                        link.accent && styles.linkAccent
                      )}
                      onClick={() => navigateTo(link.slide!)}
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a
                      key={link.label}
                      className={cn(
                        styles.link,
                        link.accent && styles.linkAccent
                      )}
                      href={link.href ?? "#"}
                    >
                      {link.label}
                    </a>
                  )
                )}
              </div>
            ))}
          </div>
        ) : (
          brand
        )}
        <div
          className={styles.bottom}
          data-deck-animate
          style={columns ? staggerDelay(columns.length + 2, "footer") : undefined}
        >
          <span className={styles.tagline}>
            Built by{" "}
            <a href="https://loworbit.studio" className={styles.taglineLink}>
              {brandName}
            </a>
          </span>
          <span className={styles.copy}>
            &copy; {new Date().getFullYear()} {brandName}
          </span>
        </div>
      </div>
    </footer>
  )
}
