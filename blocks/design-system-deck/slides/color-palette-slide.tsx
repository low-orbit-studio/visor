import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { ColorSwatchGrid, SemanticColorGrid } from "../../../components/ui/color-swatch/color-swatch"
import { Text } from "../../../components/ui/text/text"
import {
  COLOR_SCALES,
  SEMANTIC_COLORS,
} from "../../design-system-specimen/specimen-data"
import styles from "./slides.module.css"

export function ColorPaletteSlide() {
  const categories = Array.from(new Set(SEMANTIC_COLORS.map((c) => c.category)))

  return (
    <Slide id="s-color-palette">
      <SlideHeader
        subtitle="Foundation"
        title="Color Palette"
        description="Primitive color scales and semantic color tokens that adapt to any theme."
      />

      <div className={styles.content}>
        {COLOR_SCALES.map((scale) => (
          <ColorSwatchGrid
            key={scale.name}
            label={scale.name}
            swatches={scale.swatches.map((s) => ({
              token: s.token,
              hex: s.hex,
              name: s.name,
              lightText: s.lightText,
            }))}
          />
        ))}

        <div className={styles.semanticColorSection}>
          <Text weight="medium" size="sm" as="div">Semantic Colors</Text>
          {categories.map((category) => (
            <SemanticColorGrid
              key={category}
              category={category}
              items={SEMANTIC_COLORS
                .filter((c) => c.category === category)
                .map((c) => ({ token: c.token, label: c.label }))}
            />
          ))}
        </div>
      </div>
    </Slide>
  )
}
