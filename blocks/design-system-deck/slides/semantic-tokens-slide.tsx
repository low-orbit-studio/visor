import { Slide } from "../../../components/deck/slide/slide"
import { SlideHeader } from "../../../components/deck/slide-header/slide-header"
import { SemanticColorGrid } from "../../../components/ui/color-swatch/color-swatch"
import { Text } from "../../../components/ui/text/text"
import { SLIDE_SEMANTIC_COLORS } from "./slide-data"
import styles from "./slides.module.css"

export function SemanticTokensSlide() {
  const categories = Array.from(new Set(SLIDE_SEMANTIC_COLORS.map((c) => c.category)))

  return (
    <Slide id="s-semantic-tokens">
      <SlideHeader
        subtitle="Foundation"
        title="Semantic Tokens"
        description="Named by purpose, not by value. These tokens switch automatically when the theme changes — components never need to know which theme is active."
      />

      <div className={styles.semanticColorSection}>
        {categories.map((category) => (
          <div key={category}>
            <Text weight="medium" size="sm" as="div">{category}</Text>
            <SemanticColorGrid
              category={category}
              items={SLIDE_SEMANTIC_COLORS
                .filter((c) => c.category === category)
                .map((c) => ({ token: c.token, label: c.label }))}
            />
          </div>
        ))}
      </div>
    </Slide>
  )
}
