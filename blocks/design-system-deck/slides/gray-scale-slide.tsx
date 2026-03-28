import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { ColorSwatchGrid } from "../../../components/ui/color-swatch/color-swatch"
import { SLIDE_GRAY_SCALE } from "./slide-data"

export function GrayScaleSlide() {
  return (
    <Slide id="s-gray-scale">
      <SlideHeader
        subtitle="Foundation"
        title="Gray Scale"
        description="The neutral backbone. Every surface, text color, and border derives from this 11-step scale."
      />

      <ColorSwatchGrid
        label="Gray"
        swatches={SLIDE_GRAY_SCALE.map((s) => ({
          token: s.token,
          hex: s.hex,
          name: s.name,
          lightText: s.lightText,
        }))}
      />
    </Slide>
  )
}
