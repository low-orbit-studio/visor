import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { TypeSpecimen } from "../../../components/ui/type-specimen/type-specimen"
import { SLIDE_TYPE_DISPLAY } from "./slide-data"
import styles from "./slides.module.css"

export function TypeDisplaySlide() {
  return (
    <Slide id="s-type-display">
      <SlideHeader
        subtitle="Foundation"
        title="Display Scale"
        description="Large-format type for headings and hero text. Bold weights, tight line-heights, designed to command attention."
      />

      <div className={styles.typeSpecimenList}>
        {SLIDE_TYPE_DISPLAY.map((spec) => (
          <TypeSpecimen
            key={spec.token}
            token={spec.token}
            label={spec.label}
            sizePx={spec.sizePx}
            sampleText={spec.sampleText}
          />
        ))}
      </div>
    </Slide>
  )
}
