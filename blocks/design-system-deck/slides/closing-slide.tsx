import { Slide } from "../../../components/deck/slide/slide"
import { Text } from "../../../components/ui/text/text"
import styles from "./slides.module.css"

export function ClosingSlide() {
  return (
    <Slide id="s-closing" center>
      <div className={styles.titleSlideContent}>
        <Text size="sm" color="secondary" weight="medium" as="div" className={styles.titleSlideLabel}>
          Visor Design System
        </Text>
        <h2 className={styles.closingHeading}>Start Building</h2>
        <Text size="lg" color="secondary" as="p" className={styles.titleSlideDescription}>
          Install components with the registry CLI. Tokens ship via npm.
          Themes are just CSS.
        </Text>
        <div className={styles.closingLinks}>
          <code className={styles.closingCode}>npx visor add button</code>
          <code className={styles.closingCode}>npm i @loworbitstudio/visor-core</code>
        </div>
      </div>
    </Slide>
  )
}
