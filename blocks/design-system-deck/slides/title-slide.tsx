import { Slide } from "../../../components/deck/slide/slide"
import { Text } from "../../../components/ui/text/text"
import styles from "./slides.module.css"

export function TitleSlide() {
  return (
    <Slide id="s-title" center>
      <div className={styles.titleSlideContent}>
        <Text size="sm" color="secondary" weight="medium" as="div" className={styles.titleSlideLabel}>
          Design System
        </Text>
        <h1 className={styles.titleSlideHeading}>Visor</h1>
        <Text size="lg" color="secondary" as="p" className={styles.titleSlideDescription}>
          A theme-agnostic component system built on CSS custom properties.
          Tokens adapt. Components follow.
        </Text>
      </div>
    </Slide>
  )
}
