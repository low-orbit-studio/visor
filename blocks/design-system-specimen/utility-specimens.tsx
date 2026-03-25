import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Badge } from "../../components/ui/badge/badge"
import {
  House,
  MagnifyingGlass,
  Gear,
  User,
  Bell,
  EnvelopeSimple,
  Plus,
  X,
  Check,
  Warning,
  Info,
  ArrowRight,
  CaretDown,
  DotsThree,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react"
import styles from "./design-system-specimen.module.css"
import type { IconSpecimenData, ContrastPairData } from "./specimen-data"
import { ICON_SIZES } from "./specimen-data"

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill" }>> = {
  House,
  MagnifyingGlass,
  Gear,
  User,
  Bell,
  EnvelopeSimple,
  Plus,
  X,
  Check,
  Warning,
  Info,
  ArrowRight,
  CaretDown,
  DotsThree,
  PencilSimple,
  Trash,
}

// ─── Icon Grid ───────────────────────────────────────────────────────────────

interface IconGridSectionProps {
  icons: IconSpecimenData[]
  className?: string
}

export function IconGridSection({ icons, className }: IconGridSectionProps) {
  return (
    <section id="specimen-icons" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Icons</Heading>
      <Text color="secondary" size="sm">
        Phosphor icons at multiple sizes. All icons from @phosphor-icons/react.
      </Text>

      <div className={styles.iconSubsection}>
        <Text weight="medium" size="sm" as="div">Size Scale</Text>
        <div className={styles.iconSizeRow}>
          {ICON_SIZES.map((size) => (
            <div key={size} className={styles.iconSizeItem}>
              <div className={styles.iconSizeBox}>
                <House size={size} />
              </div>
              <Text size="xs" color="secondary" as="span">{size}px</Text>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.iconSubsection}>
        <Text weight="medium" size="sm" as="div">Icon Map</Text>
        <div className={styles.iconGrid}>
          {icons.map((icon) => {
            const IconComponent = ICON_MAP[icon.phosphorName]
            if (!IconComponent) return null
            return (
              <div key={icon.name} className={styles.iconGridItem}>
                <div className={styles.iconGridBox}>
                  <IconComponent size={24} />
                </div>
                <Text size="xs" weight="medium" as="span">{icon.name}</Text>
                <Text size="xs" color="tertiary" as="span">{icon.usage}</Text>
              </div>
            )
          })}
        </div>
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
          <div key={i} className={styles.contrastRow}>
            <div className={styles.contrastSwatches}>
              <div
                className={styles.contrastPreview}
                style={{
                  background: `var(${pair.bgToken})`,
                  color: `var(${pair.fgToken})`,
                }}
              >
                Aa
              </div>
            </div>
            <div className={styles.contrastInfo}>
              <Text size="xs" weight="medium" as="span">
                {pair.fgLabel} / {pair.bgLabel}
              </Text>
              <Text size="xs" color="secondary" as="span">
                {pair.ratio}:1
              </Text>
            </div>
            <div className={styles.contrastBadges}>
              <Badge variant={pair.wcagAA ? "default" : "outline"}>
                AA {pair.wcagAA ? "\u2713" : "\u2717"}
              </Badge>
              <Badge variant={pair.wcagAAA ? "default" : "outline"}>
                AAA {pair.wcagAAA ? "\u2713" : "\u2717"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
