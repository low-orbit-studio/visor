import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { IconGrid, IconSizeRow } from "../../components/ui/icon-grid/icon-grid"
import { AccessibilitySpecimen } from "../../components/ui/accessibility-specimen/accessibility-specimen"
import { House } from "@phosphor-icons/react"
import styles from "./design-system-specimen.module.css"
import type { IconSpecimenData, ContrastPairData } from "./specimen-data"
import { ICON_SIZES } from "./specimen-data"
import { ICON_MAP } from "./icon-map"

// ─── Icon Grid ───────────────────────────────────────────────────────────────

interface IconGridSectionProps {
  icons: IconSpecimenData[]
  className?: string
}

export function IconGridSection({ icons, className }: IconGridSectionProps) {
  const gridItems = icons
    .filter((icon) => ICON_MAP[icon.phosphorName])
    .map((icon) => {
      const IconComponent = ICON_MAP[icon.phosphorName]
      return {
        name: icon.name,
        usage: icon.usage,
        icon: <IconComponent size={24} />,
      }
    })

  return (
    <section id="specimen-icons" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Icons</Heading>
      <Text color="secondary" size="sm">
        Phosphor icons at multiple sizes. All icons from @phosphor-icons/react.
      </Text>

      <div className={styles.iconSubsection}>
        <Text weight="medium" size="sm" as="div">Size Scale</Text>
        <IconSizeRow
          sizes={ICON_SIZES.map((size) => ({
            size,
            icon: <House size={size} />,
          }))}
        />
      </div>

      <div className={styles.iconSubsection}>
        <Text weight="medium" size="sm" as="div">Icon Map</Text>
        <IconGrid icons={gridItems} />
      </div>
    </section>
  )
}

// ─── Accessibility ───────────────────────────────────────────────────────────

interface AccessibilitySectionProps {
  pairs: ContrastPairData[]
  className?: string
}

export function AccessibilitySection({
  pairs,
  className,
}: AccessibilitySectionProps) {
  return (
    <section id="specimen-accessibility" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Accessibility</Heading>
      <Text color="secondary" size="sm">
        WCAG contrast ratios for key text/background pairs.
      </Text>

      <div className={styles.contrastList}>
        {pairs.map((pair, i) => (
          <AccessibilitySpecimen
            key={i}
            fgToken={pair.fgToken}
            bgToken={pair.bgToken}
            fgLabel={pair.fgLabel}
            bgLabel={pair.bgLabel}
            ratio={pair.ratio}
            wcagAA={pair.wcagAA}
            wcagAAA={pair.wcagAAA}
          />
        ))}
      </div>
    </section>
  )
}
