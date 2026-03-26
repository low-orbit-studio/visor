import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import styles from "./slides.module.css"

const OPACITY_LEVELS = [
  { token: "--text-primary", label: "text-primary", description: "Primary content, headings" },
  { token: "--text-secondary", label: "text-secondary", description: "Supporting text, labels" },
  { token: "--text-tertiary", label: "text-tertiary", description: "Captions, metadata" },
  { token: "--text-disabled", label: "text-disabled", description: "Disabled states" },
] as const

export function OpacitySlide() {
  return (
    <Slide id="s-opacity">
      <SlideHeader
        subtitle="Visual Language"
        title="Text Opacity"
        description="Semantic text color tokens create a natural reading hierarchy."
      />

      <div className={styles.opacityGrid}>
        {OPACITY_LEVELS.map((level) => (
          <div key={level.token} className={styles.opacityItem}>
            <div
              className={styles.opacitySample}
              style={{ color: `var(${level.token})` }}
            >
              The quick brown fox
            </div>
            <div className={styles.opacityMeta}>
              <Text size="xs" color="secondary" as="span">{level.label}</Text>
              {" — "}
              <Text size="xs" color="tertiary" as="span">{level.description}</Text>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}
