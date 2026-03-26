import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./type-specimen.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TypeSpecimenProps {
  /** CSS custom property token for font size (e.g. "--font-size-xl") */
  token: string
  /** Label for this type step (e.g. "xl", "base") */
  label: string
  /** Font size in pixels for fallback */
  sizePx: number
  /** Sample text to render at this size */
  sampleText: string
  className?: string
}

// ─── TypeSpecimen ───────────────────────────────────────────────────────────

function TypeSpecimen({
  token,
  label,
  sizePx,
  sampleText,
  className,
}: TypeSpecimenProps) {
  return (
    <div data-slot="type-specimen" className={cn(styles.row, className)}>
      <div className={styles.meta}>
        <Text size="xs" weight="medium" color="secondary" as="span">
          {label}
        </Text>
        <Text size="xs" color="tertiary" as="span">
          {sizePx}px
        </Text>
      </div>
      <div
        className={styles.sample}
        style={{ fontSize: `var(${token}, ${sizePx}px)` }}
      >
        {sampleText}
      </div>
    </div>
  )
}

export { TypeSpecimen }
