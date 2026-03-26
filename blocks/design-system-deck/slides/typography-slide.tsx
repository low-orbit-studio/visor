import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { TypeSpecimen } from "../../../components/ui/type-specimen/type-specimen"
import { TYPE_SPECIMENS } from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function TypographySlide() {
  return (
    <Slide id="s-typography">
      <SlideHeader
        subtitle="Foundation"
        title="Typography"
        description="Full type scale from display headings to fine print."
      />

      <div className={styles.typeSpecimenList}>
        {TYPE_SPECIMENS.map((spec) => (
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
