import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import { ElevationCard } from "../../../components/ui/elevation-card/elevation-card"
import { SurfaceRow } from "../../../components/ui/surface-row/surface-row"
import {
  SHADOW_LEVELS,
  SURFACES,
} from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function ElevationSlide() {
  return (
    <Slide id="s-elevation">
      <SlideHeader
        subtitle="Visual Language"
        title="Elevation & Surfaces"
        description="Shadow tokens for depth and surface tokens for layering hierarchy."
      />

      <div className={styles.content}>
        <div>
          <Text weight="medium" size="sm" as="div">Shadows</Text>
          <div className={styles.shadowGrid}>
            {SHADOW_LEVELS.map((level) => (
              <ElevationCard
                key={level.token}
                token={level.token}
                name={level.name}
              />
            ))}
          </div>
        </div>

        <div>
          <Text weight="medium" size="sm" as="div">Surfaces</Text>
          <div className={styles.surfaceGrid}>
            {SURFACES.map((surface) => (
              <SurfaceRow
                key={surface.token}
                token={surface.token}
                name={surface.name}
                lightText={surface.lightText}
              />
            ))}
          </div>
        </div>
      </div>
    </Slide>
  )
}
