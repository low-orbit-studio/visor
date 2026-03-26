import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { RadiusScale } from "../../../components/ui/radius-scale/radius-scale"
import { RADIUS_STEPS } from "../../design-system-specimen/specimen-data"

export function RadiusSlide() {
  return (
    <Slide id="s-radius">
      <SlideHeader
        subtitle="Visual Language"
        title="Border Radius"
        description="Radius scale from sharp corners to fully rounded."
      />

      <RadiusScale steps={RADIUS_STEPS} />
    </Slide>
  )
}
