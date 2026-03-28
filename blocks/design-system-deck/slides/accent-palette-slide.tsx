import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { ColorSwatchGrid } from "../../../components/ui/color-swatch/color-swatch"
import { Text } from "../../../components/ui/text/text"
import { SLIDE_ACCENT_SCALES } from "./slide-data"
import styles from "./slides.module.css"

export function AccentPaletteSlide() {
  return (
    <Slide id="s-accent-palette">
      <SlideHeader
        subtitle="Foundation"
        title="Accent Palette"
        description="Five accent scales, each with a clear semantic role. Three representative stops per scale — light, mid, dark."
      />

      <div className={styles.accentScalesGrid}>
        {SLIDE_ACCENT_SCALES.map((scale) => (
          <div key={scale.name} className={styles.accentScaleGroup}>
            <div className={styles.accentScaleHeader}>
              <Text weight="medium" size="sm" as="span">{scale.name}</Text>
              <Text size="xs" color="tertiary" as="span">{scale.description}</Text>
            </div>
            <ColorSwatchGrid
              label={scale.name}
              swatches={scale.swatches.map((s) => ({
                token: s.token,
                hex: s.hex,
                name: s.name,
                lightText: s.lightText,
              }))}
            />
          </div>
        ))}
      </div>
    </Slide>
  )
}
