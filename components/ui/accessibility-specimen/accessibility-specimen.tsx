import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import { Badge } from "../badge/badge"
import styles from "./accessibility-specimen.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AccessibilitySpecimenProps {
  /** CSS custom property for the foreground/text color */
  fgToken: string
  /** CSS custom property for the background color */
  bgToken: string
  /** Human-readable label for the foreground color */
  fgLabel: string
  /** Human-readable label for the background color */
  bgLabel: string
  /** Contrast ratio (e.g. 4.5) */
  ratio: number
  /** Whether the pair passes WCAG AA */
  wcagAA: boolean
  /** Whether the pair passes WCAG AAA */
  wcagAAA: boolean
  className?: string
}

// ─── AccessibilitySpecimen ──────────────────────────────────────────────────

function AccessibilitySpecimen({
  fgToken,
  bgToken,
  fgLabel,
  bgLabel,
  ratio,
  wcagAA,
  wcagAAA,
  className,
}: AccessibilitySpecimenProps) {
  return (
    <div data-slot="accessibility-specimen" className={cn(styles.row, className)}>
      <div className={styles.swatches}>
        <div
          className={styles.preview}
          style={{
            background: `var(${bgToken})`,
            color: `var(${fgToken})`,
          }}
        >
          Aa
        </div>
      </div>
      <div className={styles.info}>
        <Text size="xs" weight="medium" as="span">
          {fgLabel} / {bgLabel}
        </Text>
        <Text size="xs" color="secondary" as="span">
          {ratio}:1
        </Text>
      </div>
      <div className={styles.badges}>
        <Badge variant={wcagAA ? "default" : "outline"}>
          AA {wcagAA ? "\u2713" : "\u2717"}
        </Badge>
        <Badge variant={wcagAAA ? "default" : "outline"}>
          AAA {wcagAAA ? "\u2713" : "\u2717"}
        </Badge>
      </div>
    </div>
  )
}

export { AccessibilitySpecimen }
