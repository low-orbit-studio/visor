import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { TypeSpecimen } from "../../../components/ui/type-specimen/type-specimen"
import { SLIDE_TYPE_BODY } from "./slide-data"
import styles from "./slides.module.css"

export function TypeBodySlide() {
  return (
    <Slide id="s-type-body">
      <SlideHeader
        subtitle="Foundation"
        title="Body & Utility"
        description="Reading text and supporting sizes. Optimized for comfortable line lengths, generous line-heights, and clear hierarchy."
      />

      <div className={styles.typeSpecimenList}>
        {SLIDE_TYPE_BODY.map((spec) => (
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
