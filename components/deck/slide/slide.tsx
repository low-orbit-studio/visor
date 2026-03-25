import type { ReactNode } from "react"
import { SlideThemeProvider } from "../slide-theme-context/slide-theme-context"
import { cn } from "../../../lib/utils"
import styles from "./slide.module.css"

export interface SlideProps {
  /** Unique slide identifier, used for navigation */
  id: string
  /** Theme variant for this slide */
  theme?: "light" | "dark"
  /** Override the dot-nav theme detection for this slide */
  dotNavTheme?: "light" | "dark"
  /** Center all content vertically and horizontally */
  center?: boolean
  /** Remove default padding */
  flush?: boolean
  /** Enable hero image mode with overlay */
  hero?: boolean
  /** URL for the hero background image */
  heroImage?: string
  /** URL for a full-bleed background image */
  bgImage?: string
  /** Full-bleed photo mode */
  photo?: boolean
  className?: string
  children: ReactNode
}

export function Slide({
  id,
  theme = "light",
  dotNavTheme,
  center,
  flush,
  hero,
  heroImage,
  bgImage,
  photo,
  className,
  children,
}: SlideProps) {
  return (
    <section
      id={id}
      data-slot="slide"
      data-theme={theme}
      data-dot-nav={dotNavTheme}
      className={cn(
        styles.slide,
        center && styles.center,
        flush && styles.flush,
        hero && styles.hero,
        photo && styles.photo,
        bgImage && styles.bgImage,
        theme === "dark" && styles.dark,
        className
      )}
    >
      <SlideThemeProvider theme={theme}>
        {hero && heroImage && (
          <>
            <div
              className={styles.heroBg}
              style={{ backgroundImage: `url('${heroImage}')` }}
            />
            <div className={styles.heroOverlay} />
          </>
        )}
        {bgImage && (
          <>
            <img src={bgImage} alt="" className={styles.bgImg} />
            <div className={styles.bgOverlay} />
          </>
        )}
        {hero && heroImage ? (
          <div className={styles.heroContent}>{children}</div>
        ) : (
          children
        )}
      </SlideThemeProvider>
    </section>
  )
}
