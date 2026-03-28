import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { AccessibilitySpecimen } from "../../../components/ui/accessibility-specimen/accessibility-specimen"
import { SLIDE_CONTRAST_PAIRS } from "./slide-data"
import styles from "./slides.module.css"

export function AccessibilitySlide() {
  return (
    <Slide id="s-accessibility">
      <SlideHeader
        subtitle="Utility"
        title="Accessibility"
        description="WCAG contrast ratios for the most common text and background pairs."
      />

      <div className={styles.contrastList}>
        {SLIDE_CONTRAST_PAIRS.map((pair) => (
          <AccessibilitySpecimen
            key={`${pair.fgToken}-${pair.bgToken}`}
            fgToken={pair.fgToken}
            bgToken={pair.bgToken}
            fgLabel={pair.fgLabel}
            bgLabel={pair.bgLabel}
            ratio={pair.ratio}
            wcagAA={pair.wcagAA}
            wcagAAA={pair.wcagAAA}
          />
        ))}
      </div>
    </Slide>
  )
}
