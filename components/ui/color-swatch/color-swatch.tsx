"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { toHex, needsLightText } from "../../../lib/color-utils"
import { Text } from "../text/text"
import styles from "./color-swatch.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ColorSwatchProps {
  /** CSS custom property token name (e.g. "--color-gray-500") */
  token: string
  /** Hex value for fallback and display */
  hex: string
  /** Label shown beneath the swatch */
  name: string
  /** When true, hex text renders white instead of dark */
  lightText?: boolean
  /** Size variant — controls hex text size; passed down from ColorSwatchGrid */
  size?: "default" | "lg" | "sm"
  /** When true, reads the live computed CSS value for the hex display instead of the static fallback */
  dynamic?: boolean
  className?: string
}

export interface ColorSwatchGridProps {
  /** Scale name shown above the grid */
  label: string
  /** Array of swatch data to render */
  swatches: ColorSwatchProps[]
  /** Grid density: lg for theme colors, sm for status colors, default for standard */
  size?: "default" | "lg" | "sm"
  className?: string
}

export interface BrandColorSwatchProps {
  /** CSS custom property token for the brand color (e.g. "--interactive-primary-bg") */
  token: string
  /** Label shown on the swatch */
  label?: string
  className?: string
}

export interface SemanticColorItemProps {
  /** CSS custom property token name */
  token: string
  /** Human-readable label */
  label: string
  className?: string
}

export interface SemanticColorGridProps {
  /** Category name shown above the group */
  category: string
  /** Items in this category */
  items: SemanticColorItemProps[]
  className?: string
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Resolves the live color value of a CSS custom property by applying it as
 * backgroundColor on a hidden probe div inside document.body (the theme scope),
 * then reading the fully-resolved getComputedStyle value.
 *
 * This mirrors the useLiveFontName pattern and is guaranteed to work regardless
 * of where the theme class is applied (html vs body vs a child element).
 */
function useLiveCssColor(token: string, enabled: boolean): string | null {
  const [value, setValue] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    const probe = document.createElement("div")
    Object.assign(probe.style, {
      position: "absolute",
      visibility: "hidden",
      pointerEvents: "none",
      backgroundColor: `var(${token})`,
    })
    document.body.appendChild(probe)

    function read() {
      // Re-stamp the var so the browser recalculates after a theme class change
      probe.style.backgroundColor = `var(${token})`
      const resolved = getComputedStyle(probe).backgroundColor
      // Skip transparent/unset (means the token isn't defined in this theme)
      if (resolved && resolved !== "rgba(0, 0, 0, 0)" && resolved !== "transparent") {
        setValue(toHex(resolved))
      }
    }

    read()
    const obs = new MutationObserver(read)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    obs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme"] })

    return () => {
      obs.disconnect()
      probe.remove()
    }
  }, [token, enabled])

  return value
}

// ─── ColorSwatch ────────────────────────────────────────────────────────────

function ColorSwatch({
  token,
  hex,
  name,
  lightText,
  size = "default",
  dynamic,
  className,
}: ColorSwatchProps) {
  const liveHex = useLiveCssColor(token, !!dynamic)
  const displayHex = dynamic && liveHex ? liveHex : hex
  // Auto-compute text color from live value when dynamic; fall back to prop
  const useLightText = dynamic && liveHex ? needsLightText(liveHex) : !!lightText

  return (
    <div data-slot="color-swatch" className={cn(styles.swatch, className)}>
      <div
        className={styles.preview}
        style={{ background: `var(${token}, ${hex})` }}
      >
        <span
          className={cn(styles.hex, size === "sm" && styles.hexSm)}
          style={{ color: useLightText ? "#ffffff" : "#111827" }}
        >
          {displayHex}
        </span>
      </div>
      <Text size="xs" color="secondary" as="span" className={styles.label}>
        {name}
      </Text>
    </div>
  )
}

// ─── BrandColorSwatch ───────────────────────────────────────────────────────

function BrandColorSwatch({ token, label = "Brand Color", className }: BrandColorSwatchProps) {
  const liveHex = useLiveCssColor(token, true)
  const useLightText = liveHex ? needsLightText(liveHex) : false
  const textColor = useLightText ? "#ffffff" : "#111827"

  return (
    <div
      data-slot="brand-color-swatch"
      className={cn(styles.brandSwatch, className)}
      style={{ background: `var(${token})` }}
    >
      <div className={styles.brandContent}>
        <span className={styles.brandLabel} style={{ color: textColor }}>
          {label}
        </span>
        <code className={styles.brandHex} style={{ color: textColor }}>
          {liveHex ?? ""}
        </code>
      </div>
      <code className={styles.brandToken} style={{ color: textColor }}>
        {token}
      </code>
    </div>
  )
}

// ─── ColorSwatchGrid ────────────────────────────────────────────────────────

const gridSizeClass = {
  default: styles.grid,
  lg: styles.gridLg,
  sm: styles.gridSm,
} as const

function ColorSwatchGrid({ label, swatches, size = "default", className }: ColorSwatchGridProps) {
  return (
    <div data-slot="color-swatch-grid" className={cn(styles.scaleGroup, className)}>
      <Text weight="medium" size="sm" as="div">{label}</Text>
      <div className={gridSizeClass[size]}>
        {swatches.map((swatch) => (
          <ColorSwatch key={swatch.token} {...swatch} size={size} />
        ))}
      </div>
    </div>
  )
}

// ─── SemanticColorItem ──────────────────────────────────────────────────────

function SemanticColorItem({ token, label, className }: SemanticColorItemProps) {
  return (
    <div data-slot="semantic-color-item" className={cn(styles.semanticItem, className)}>
      <div
        className={styles.semanticPreview}
        style={{ background: `var(${token})` }}
      />
      <Text size="xs" color="secondary" as="span">
        {label}
      </Text>
    </div>
  )
}

// ─── SemanticColorGrid ──────────────────────────────────────────────────────

function SemanticColorGrid({ category, items, className }: SemanticColorGridProps) {
  return (
    <div data-slot="semantic-color-grid" className={cn(styles.semanticGroup, className)}>
      <Text size="xs" color="tertiary" weight="medium" as="div">
        {category}
      </Text>
      <div className={styles.semanticGrid}>
        {items.map((item) => (
          <SemanticColorItem key={item.token} {...item} />
        ))}
      </div>
    </div>
  )
}

export { ColorSwatch, BrandColorSwatch, ColorSwatchGrid, SemanticColorItem, SemanticColorGrid }
