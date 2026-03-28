import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { Text } from "../../../components/ui/text/text"
import styles from "./slides.module.css"

const THEME_LAYERS = [
  {
    name: "Primitives",
    description: "Raw values — colors, spacing, font sizes. The building blocks.",
    example: "--color-blue-500: #3b82f6",
  },
  {
    name: "Semantic",
    description: "Named by purpose. Components reference these, never primitives.",
    example: "--text-link: var(--color-blue-600)",
  },
  {
    name: "Adaptive",
    description: "Theme-aware reassignments. Switch themes by swapping this layer.",
    example: ".theme-dark { --text-primary: var(--color-gray-50) }",
  },
] as const

export function ThemeArchitectureSlide() {
  return (
    <Slide id="s-theme-architecture">
      <SlideHeader
        subtitle="Foundation"
        title="Theme Architecture"
        description="A 3-tier token system. Primitives define the palette. Semantic tokens name by purpose. Adaptive tokens switch with the theme."
      />

      <div className={styles.themeLayerStack}>
        {THEME_LAYERS.map((layer, i) => (
          <div key={layer.name} className={styles.themeLayer}>
            <div className={styles.themeLayerNumber}>
              <Text size="xs" color="tertiary" weight="medium" as="span">{i + 1}</Text>
            </div>
            <div className={styles.themeLayerContent}>
              <Text weight="medium" size="md" as="div">{layer.name}</Text>
              <Text size="sm" color="secondary" as="p">{layer.description}</Text>
              <code className={styles.themeLayerCode}>{layer.example}</code>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  )
}
