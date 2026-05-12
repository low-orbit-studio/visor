"use client"

import * as React from "react"
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
  THEME_COLOR_SCALES,
  STATUS_COLOR_SCALES,
  SEMANTIC_COLORS,
  FONT_FAMILIES,
  TYPE_SPECIMENS,
  SPACING_STEPS,
  SHADOW_LEVELS,
  SURFACES,
  RADIUS_STEPS,
  MOTION_DURATIONS,
  EASINGS,
  CONTRAST_PAIRS,
  ICON_SPECIMENS,
  deriveFontFamiliesFromTypography,
  type FontFamilyData,
  type ThemeTypographyManifest,
} from "./specimen-data"

/**
 * Subset of the docs-site PRIVATE_THEMES manifest the specimen consumes.
 * Only `slug` + `typography` are required — `label`/`group` are accepted to
 * keep callers from having to remap their manifest objects (VI-356).
 */
export interface DesignSystemSpecimenThemeEntry {
  slug: string
  typography?: ThemeTypographyManifest
}

interface DesignSystemSpecimenProps {
  className?: string
  /**
   * Optional theme manifest. When provided alongside an active `*-theme` body
   * class that matches an entry's slug, the Font Families specimen renders
   * the theme's actual loaded weights instead of the hardcoded defaults. If
   * absent or no slug matches, defaults are used. VI-356.
   */
  themeManifest?: DesignSystemSpecimenThemeEntry[]
  /**
   * Optional override for the Font Families specimen rows. Takes precedence
   * over `themeManifest` resolution — useful for tests and one-off renders.
   */
  fontFamilies?: FontFamilyData[]
}

const THEME_CLASS_PATTERN = /(^|\s)([\w-]+)-theme(?=\s|$)/

/**
 * Reads the active theme slug from `body.className` (`{slug}-theme`) and
 * re-syncs whenever the docs site fires `visor-theme-change` or whenever
 * <body>'s class attribute mutates. Returns null in non-browser contexts.
 */
function useActiveThemeSlug(): string | null {
  const [slug, setSlug] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof document === "undefined") return undefined
    const body = document.body

    function read() {
      const match = body.className.match(THEME_CLASS_PATTERN)
      setSlug(match ? match[2] : null)
    }
    read()

    const handler = () => read()
    document.addEventListener("visor-theme-change", handler)
    const obs = new MutationObserver(read)
    obs.observe(body, { attributes: true, attributeFilter: ["class"] })

    return () => {
      document.removeEventListener("visor-theme-change", handler)
      obs.disconnect()
    }
  }, [])

  return slug
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
  themeManifest,
  fontFamilies,
}: DesignSystemSpecimenProps) {
  const activeSlug = useActiveThemeSlug()

  const resolvedFontFamilies = React.useMemo<FontFamilyData[]>(() => {
    if (fontFamilies) return fontFamilies
    if (!themeManifest || !activeSlug) return FONT_FAMILIES
    const entry = themeManifest.find((t) => t.slug === activeSlug)
    return deriveFontFamiliesFromTypography(entry?.typography, FONT_FAMILIES)
  }, [fontFamilies, themeManifest, activeSlug])

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

      <ColorPaletteSection themeScales={THEME_COLOR_SCALES} statusScales={STATUS_COLOR_SCALES} semanticColors={SEMANTIC_COLORS} />
      <Separator />

      <TypographySection fontFamilies={resolvedFontFamilies} specimens={TYPE_SPECIMENS} />
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
