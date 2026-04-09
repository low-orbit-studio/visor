import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { ColorSwatchGrid, SemanticColorGrid } from "../../components/ui/color-swatch/color-swatch"
import { TypeSpecimen } from "../../components/ui/type-specimen/type-specimen"
import { FontShowcaseGrid } from "../../components/ui/font-showcase/font-showcase"
import { SpacingScale } from "../../components/ui/spacing-scale/spacing-scale"
import { ElevationCard } from "../../components/ui/elevation-card/elevation-card"
import { SurfaceRow } from "../../components/ui/surface-row/surface-row"
import { RadiusScale } from "../../components/ui/radius-scale/radius-scale"
import styles from "./design-system-specimen.module.css"
import type {
  ColorScaleData,
  StatusColorScaleData,
  SemanticColorData,
  FontFamilyData,
  TypeSpecimenData,
  SpacingStepData,
  ShadowLevelData,
  SurfaceData,
  RadiusStepData,
} from "./specimen-data"

// ─── Color Palette ───────────────────────────────────────────────────────────

interface ColorPaletteSectionProps {
  themeScales: ColorScaleData[]
  statusScales: StatusColorScaleData[]
  semanticColors: SemanticColorData[]
  className?: string
}

export function ColorPaletteSection({
  themeScales,
  statusScales,
  semanticColors,
  className,
}: ColorPaletteSectionProps) {
  const categories = Array.from(new Set(semanticColors.map((c) => c.category)))

  return (
    <section id="specimen-colors" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Color Palette</Heading>
      <Text color="secondary" size="sm">
        Theme identity colors, status indicators, and semantic tokens.
      </Text>

      {/* Theme Colors — prominent */}
      <div className={styles.themeColors}>
        <Text size="xs" color="tertiary" weight="medium" as="div" className={styles.subsectionLabel}>
          Theme Colors
        </Text>
        {themeScales.map((scale) => (
          <ColorSwatchGrid
            key={scale.name}
            label={scale.name}
            size="lg"
            swatches={scale.swatches.map((s) => ({
              token: s.token,
              hex: s.hex,
              name: s.name,
              lightText: s.lightText,
            }))}
          />
        ))}
      </div>

      {/* Status Colors — compact */}
      <div className={styles.statusColors}>
        <Text size="xs" color="tertiary" weight="medium" as="div" className={styles.subsectionLabel}>
          Status Colors
        </Text>
        <div className={styles.statusGrid}>
          {statusScales.map((scale) => (
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
      </div>

      {/* Semantic Colors — unchanged */}
      <div className={styles.semanticColorSection}>
        <Text size="xs" color="tertiary" weight="medium" as="div" className={styles.subsectionLabel}>
          Semantic Tokens
        </Text>
        {categories.map((category) => (
          <SemanticColorGrid
            key={category}
            category={category}
            items={semanticColors
              .filter((c) => c.category === category)
              .map((c) => ({ token: c.token, label: c.label }))}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Typography ──────────────────────────────────────────────────────────────

interface TypographySectionProps {
  fontFamilies: FontFamilyData[]
  specimens: TypeSpecimenData[]
  className?: string
}

export function TypographySection({
  fontFamilies,
  specimens,
  className,
}: TypographySectionProps) {
  return (
    <section id="specimen-typography" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Typography</Heading>
      <Text color="secondary" size="sm">
        Font families, weights, and the full type scale.
      </Text>

      {/* Font Showcase */}
      <div>
        <Text size="xs" color="tertiary" weight="medium" as="div" className={styles.subsectionLabel}>
          Font Families
        </Text>
        <FontShowcaseGrid
          fonts={fontFamilies.map((f) => ({
            token: f.token,
            role: f.role,
            familyName: f.familyName,
            weights: f.weights,
          }))}
        />
      </div>

      {/* Type Scale */}
      <div>
        <Text size="xs" color="tertiary" weight="medium" as="div" className={styles.subsectionLabel}>
          Type Scale
        </Text>
        <div className={styles.typeSpecimenList}>
          {specimens.map((spec) => (
            <TypeSpecimen
              key={spec.token}
              token={spec.token}
              label={spec.label}
              sizePx={spec.sizePx}
              sampleText={spec.sampleText}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Spacing ─────────────────────────────────────────────────────────────────

interface SpacingSectionProps {
  steps: SpacingStepData[]
  className?: string
}

export function SpacingSection({ steps, className }: SpacingSectionProps) {
  return (
    <section id="specimen-spacing" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Spacing</Heading>
      <Text color="secondary" size="sm">
        4px-based spacing scale.
      </Text>

      <SpacingScale steps={steps} />
    </section>
  )
}

// ─── Shadows ─────────────────────────────────────────────────────────────────

interface ShadowSectionProps {
  levels: ShadowLevelData[]
  className?: string
}

export function ShadowSection({ levels, className }: ShadowSectionProps) {
  return (
    <section id="specimen-shadows" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Shadows & Elevation</Heading>
      <Text color="secondary" size="sm">
        Shadow tokens from subtle to prominent.
      </Text>

      <div className={styles.shadowGrid}>
        {levels.map((level) => (
          <ElevationCard
            key={level.token}
            token={level.token}
            name={level.name}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

interface SurfaceSectionProps {
  surfaces: SurfaceData[]
  className?: string
}

export function SurfaceSection({ surfaces, className }: SurfaceSectionProps) {
  return (
    <section id="specimen-surfaces" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Surfaces</Heading>
      <Text color="secondary" size="sm">
        Background surface tokens for layering and hierarchy.
      </Text>

      <div className={styles.surfaceGrid}>
        {surfaces.map((surface) => (
          <SurfaceRow
            key={surface.token}
            token={surface.token}
            name={surface.name}
            lightText={surface.lightText}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Border Radius ───────────────────────────────────────────────────────────

interface RadiusSectionProps {
  steps: RadiusStepData[]
  className?: string
}

export function RadiusSection({ steps, className }: RadiusSectionProps) {
  return (
    <section id="specimen-radius" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Border Radius</Heading>
      <Text color="secondary" size="sm">
        Radius scale from sharp to fully rounded.
      </Text>

      <RadiusScale steps={steps} />
    </section>
  )
}
