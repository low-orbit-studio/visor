import type { ReactNode } from "react"
import { Slide } from "../slide/slide"
import { cn } from "../../../lib/utils"
import styles from "./concept-slide.module.css"

export interface ConceptSlideProps {
  /** Unique slide identifier */
  id: string
  /** Theme variant */
  theme?: "light" | "dark"
  /** Video source URL (mp4) */
  video: string
  /** Video poster image URL */
  poster: string
  /** Content overlaid on the video */
  children: ReactNode
  className?: string
}

export function ConceptSlide({
  id,
  theme = "light",
  video,
  poster,
  children,
  className,
}: ConceptSlideProps) {
  return (
    <Slide id={id} theme={theme} flush className={className}>
      <div data-slot="concept-slide" className={styles.wrapper}>
        <div className={styles.videoWrap}>
          {/* decorative background video, muted — no caption needed */}
          <video
            className={styles.video}
            autoPlay
            muted
            loop
            playsInline
            poster={poster}
            data-deck-animate
            aria-hidden="true"
          >
            <source src={video} type="video/mp4" />
          </video>
          <div className={styles.overlay} />
        </div>
        <div className={styles.text}>{children}</div>
      </div>
    </Slide>
  )
}
