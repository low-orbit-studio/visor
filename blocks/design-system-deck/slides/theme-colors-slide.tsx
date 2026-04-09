"use client"

import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { ColorSwatchGrid } from "../../../components/ui/color-swatch/color-swatch"
import { ColorBar } from "../../../components/ui/color-bar/color-bar"
import { THEME_COLOR_SCALES } from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function ThemeColorsSlide() {
  return (
    <Slide id="s-theme-colors">
      <SlideHeader
        subtitle="Foundation"
        title="Theme Colors"
        description="Primary and neutral scales — fully theme-aware and responsive to the active theme."
      />

      <div className={styles.content}>
        {THEME_COLOR_SCALES.map((scale) => (
          <div key={scale.name} className={styles.themeScaleGroup}>
            {scale.brandToken && (
              <ColorBar token={scale.brandToken} label="Brand Color" />
            )}
            <ColorSwatchGrid
              label={scale.name}
              size="lg"
              swatches={scale.swatches.map((s) => ({
                token: s.token,
                hex: s.hex,
                name: s.name,
                lightText: s.lightText,
                dynamic: s.dynamic,
              }))}
            />
          </div>
        ))}
      </div>
    </Slide>
  )
}
