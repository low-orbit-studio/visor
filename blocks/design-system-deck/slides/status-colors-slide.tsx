import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { ColorSwatchGrid } from "../../../components/ui/color-swatch/color-swatch"
import { STATUS_COLOR_SCALES } from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function StatusColorsSlide() {
  return (
    <Slide id="s-status-colors">
      <SlideHeader
        subtitle="Foundation"
        title="Status Colors"
        description="Success, warning, error, and info — semantic color scales for system feedback."
      />

      <div className={styles.statusGrid}>
        {STATUS_COLOR_SCALES.map((scale) => (
          <ColorSwatchGrid
            key={scale.name}
            label={scale.role}
            size="sm"
            swatches={scale.swatches.map((s) => ({
              token: s.token,
              hex: s.hex,
              name: s.name,
              lightText: s.lightText,
            }))}
          />
        ))}
      </div>
    </Slide>
  )
}
