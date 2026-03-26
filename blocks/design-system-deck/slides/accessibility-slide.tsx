import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { AccessibilitySpecimen } from "../../../components/ui/accessibility-specimen/accessibility-specimen"
import { CONTRAST_PAIRS } from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function AccessibilitySlide() {
  return (
    <Slide id="s-accessibility">
      <SlideHeader
        subtitle="Utility"
        title="Accessibility"
        description="WCAG contrast ratios for key text and background pairs."
      />

      <div className={styles.contrastList}>
        {CONTRAST_PAIRS.map((pair, i) => (
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
