import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import styles from "./design-system-specimen.module.css"
import type {
  ColorScaleData,
  SemanticColorData,
  TypeSpecimenData,
  SpacingStepData,
  ShadowLevelData,
  SurfaceData,
  RadiusStepData,
} from "./specimen-data"

// ─── Color Palette ───────────────────────────────────────────────────────────

interface ColorPaletteSectionProps {
  scales: ColorScaleData[]
  semanticColors: SemanticColorData[]
  className?: string
}

export function ColorPaletteSection({
  scales,
  semanticColors,
  className,
}: ColorPaletteSectionProps) {
  const categories = Array.from(new Set(semanticColors.map((c) => c.category)))

  return (
    <section id="specimen-colors" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Color Palette</Heading>
      <Text color="secondary" size="sm">
        Primitive color scales and semantic color tokens.
      </Text>

      {scales.map((scale) => (
        <div key={scale.name} className={styles.colorScaleGroup}>
          <Text weight="medium" size="sm" as="div">{scale.name}</Text>
          <div className={styles.colorGrid}>
            {scale.swatches.map((swatch) => (
              <div key={swatch.token} className={styles.colorSwatch}>
                <div
                  className={styles.colorSwatchPreview}
                  style={{ background: `var(${swatch.token}, ${swatch.hex})` }}
                >
                  <span
                    className={styles.colorSwatchHex}
                    style={{ color: swatch.lightText ? "#ffffff" : "#111827" }}
                  >
                    {swatch.hex}
                  </span>
                </div>
                <Text size="xs" color="secondary" as="span" className={styles.colorSwatchLabel}>
                  {swatch.name}
                </Text>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.semanticColorSection}>
        <Text weight="medium" size="sm" as="div">Semantic Colors</Text>
        {categories.map((category) => (
          <div key={category} className={styles.semanticColorGroup}>
            <Text size="xs" color="tertiary" weight="medium" as="div">
              {category}
            </Text>
            <div className={styles.semanticColorGrid}>
              {semanticColors
                .filter((c) => c.category === category)
                .map((color) => (
                  <div key={color.token} className={styles.semanticColorItem}>
                    <div
                      className={styles.semanticColorPreview}
                      style={{ background: `var(${color.token})` }}
                    />
                    <Text size="xs" color="secondary" as="span">
                      {color.label}
                    </Text>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Typography ──────────────────────────────────────────────────────────────

interface TypographySectionProps {
  specimens: TypeSpecimenData[]
  className?: string
}

export function TypographySection({
  specimens,
  className,
}: TypographySectionProps) {
  return (
    <section id="specimen-typography" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Typography</Heading>
      <Text color="secondary" size="sm">
        Full type scale from display to fine print.
      </Text>

      <div className={styles.typeSpecimenList}>
        {specimens.map((spec) => (
          <div key={spec.token} className={styles.typeRow}>
            <div className={styles.typeRowMeta}>
              <Text size="xs" weight="medium" color="secondary" as="span">
                {spec.label}
              </Text>
              <Text size="xs" color="tertiary" as="span">
                {spec.sizePx}px
              </Text>
            </div>
            <div
              className={styles.typeRowSample}
              style={{ fontSize: `var(${spec.token}, ${spec.sizePx}px)` }}
            >
              {spec.sampleText}
            </div>
          </div>
        ))}
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
  const maxPx = Math.max(...steps.map((s) => s.px), 1)

  return (
    <section id="specimen-spacing" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Spacing</Heading>
      <Text color="secondary" size="sm">
        4px-based spacing scale.
      </Text>

      <div className={styles.spacingList}>
        {steps.map((step) => (
          <div key={step.token} className={styles.spacingRow}>
            <Text size="xs" weight="medium" as="span" className={styles.spacingLabel}>
              {step.name}
            </Text>
            <div className={styles.spacingBarTrack}>
              <div
                className={styles.spacingBar}
                style={{ width: `${(step.px / maxPx) * 100}%` }}
              />
            </div>
            <Text size="xs" color="tertiary" as="span" className={styles.spacingValue}>
              {step.px}px / {step.rem}
            </Text>
          </div>
        ))}
      </div>
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
          <div
            key={level.token}
            className={styles.shadowCard}
            style={{ boxShadow: `var(${level.token})` }}
          >
            <Text weight="medium" size="sm">{level.name}</Text>
            <Text size="xs" color="secondary" as="span">{level.token}</Text>
          </div>
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
          <div
            key={surface.token}
            className={styles.surfaceCard}
            style={{ background: `var(${surface.token})` }}
          >
            <span
              className={styles.surfaceLabel}
              style={{ color: surface.lightText ? "var(--text-inverse, #ffffff)" : "var(--text-primary, #111827)" }}
            >
              {surface.name}
            </span>
            <span
              className={styles.surfaceToken}
              style={{ color: surface.lightText ? "var(--text-inverse-secondary, #e5e7eb)" : "var(--text-secondary, #6b7280)" }}
            >
              {surface.token}
            </span>
          </div>
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

      <div className={styles.radiusGrid}>
        {steps.map((step) => (
          <div key={step.token} className={styles.radiusItem}>
            <div
              className={styles.radiusBox}
              style={{
                borderRadius: step.name === "full"
                  ? "var(--radius-full, 9999px)"
                  : `var(${step.token}, ${step.px}px)`,
              }}
            />
            <Text weight="medium" size="xs" as="span">{step.name}</Text>
            <Text size="xs" color="tertiary" as="span">
              {step.name === "full" ? "9999px" : `${step.px}px`}
            </Text>
          </div>
        ))}
      </div>
    </section>
  )
}
