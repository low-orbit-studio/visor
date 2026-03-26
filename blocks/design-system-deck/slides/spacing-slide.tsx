import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { SpacingScale } from "../../../components/ui/spacing-scale/spacing-scale"
import { SPACING_STEPS } from "../../design-system-specimen/specimen-data"

export function SpacingSlide() {
  return (
    <Slide id="s-spacing">
      <SlideHeader
        subtitle="Foundation"
        title="Spacing"
        description="4px-based spacing scale for consistent rhythm across all components."
      />

      <SpacingScale steps={SPACING_STEPS} />
    </Slide>
  )
}
