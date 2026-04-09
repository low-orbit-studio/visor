import * as React from "react"
import { cn } from "../../../lib/utils"
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

// ─── ColorSwatch ────────────────────────────────────────────────────────────

function ColorSwatch({
  token,
  hex,
  name,
  lightText,
  size = "default",
  className,
}: ColorSwatchProps) {
  return (
    <div data-slot="color-swatch" className={cn(styles.swatch, className)}>
      <div
        className={styles.preview}
        style={{ background: `var(${token}, ${hex})` }}
      >
        <span
          className={cn(styles.hex, size === "sm" && styles.hexSm)}
          style={{ color: lightText ? "#ffffff" : "#111827" }}
        >
          {hex}
        </span>
      </div>
      <Text size="xs" color="secondary" as="span" className={styles.label}>
        {name}
      </Text>
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

export { ColorSwatch, ColorSwatchGrid, SemanticColorItem, SemanticColorGrid }
