"use client"

import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Separator } from "../../components/ui/separator/separator"
import styles from "./design-system-specimen.module.css"

import {
  ColorPaletteSection,
  TypographySection,
  SpacingSection,
  ShadowSection,
  SurfaceSection,
  RadiusSection,
} from "./token-specimens"
import { MotionDurationSection, MotionEasingSection } from "./motion-specimens"
import { IconGridSection, AccessibilitySection } from "./utility-specimens"
import {
  ButtonSpecimenSection,
  FormSpecimenSection,
  ComponentShowcaseSection,
} from "./component-specimens"
import {
  COLOR_SCALES,
  SEMANTIC_COLORS,
  TYPE_SPECIMENS,
  SPACING_STEPS,
  SHADOW_LEVELS,
  SURFACES,
  RADIUS_STEPS,
  MOTION_DURATIONS,
  EASINGS,
  CONTRAST_PAIRS,
  ICON_SPECIMENS,
} from "./specimen-data"

interface DesignSystemSpecimenProps {
  className?: string
}

/**
 * Design System Specimen
 *
 * A live, interactive design system specimen block that showcases
 * the full Visor token system and component library.
 * Responds dynamically to the active theme.
 */
export function DesignSystemSpecimen({
  className,
}: DesignSystemSpecimenProps) {
  return (
    <div className={cn(styles.root, className)}>
      <div>
        <Heading level={2}>Design System Specimen</Heading>
        <Text color="secondary">
          A live showcase of all Visor design tokens and components.
          Switch themes to see everything update in real-time.
        </Text>
      </div>

      <Separator />

      <ColorPaletteSection scales={COLOR_SCALES} semanticColors={SEMANTIC_COLORS} />
      <Separator />

      <TypographySection specimens={TYPE_SPECIMENS} />
      <Separator />

      <SpacingSection steps={SPACING_STEPS} />
      <Separator />

      <ShadowSection levels={SHADOW_LEVELS} />
      <Separator />

      <SurfaceSection surfaces={SURFACES} />
      <Separator />

      <RadiusSection steps={RADIUS_STEPS} />
      <Separator />

      <MotionDurationSection durations={MOTION_DURATIONS} />
      <Separator />

      <MotionEasingSection easings={EASINGS} />
      <Separator />

      <IconGridSection icons={ICON_SPECIMENS} />
      <Separator />

      <AccessibilitySection pairs={CONTRAST_PAIRS} />
      <Separator />

      <ButtonSpecimenSection />
      <Separator />

      <FormSpecimenSection />
      <Separator />

      <ComponentShowcaseSection />
    </div>
  )
}
