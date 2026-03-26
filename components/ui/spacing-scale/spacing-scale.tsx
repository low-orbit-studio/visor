import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./spacing-scale.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SpacingScaleItemProps {
  /** CSS custom property token name (e.g. "--spacing-4") */
  token: string
  /** Display name (e.g. "4") */
  name: string
  /** Size in pixels */
  px: number
  /** Size in rem (e.g. "1rem") */
  rem: string
}

export interface SpacingScaleProps {
  /** Array of spacing steps to display */
  steps: SpacingScaleItemProps[]
  className?: string
}

// ─── SpacingScale ───────────────────────────────────────────────────────────

function SpacingScale({ steps, className }: SpacingScaleProps) {
  const maxPx = Math.max(...steps.map((s) => s.px), 1)

  return (
    <div data-slot="spacing-scale" className={cn(styles.list, className)}>
      {steps.map((step) => (
        <div key={step.token} className={styles.row}>
          <Text size="xs" weight="medium" as="span" className={styles.label}>
            {step.name}
          </Text>
          <div className={styles.barTrack}>
            <div
              className={styles.bar}
              style={{ width: `${(step.px / maxPx) * 100}%` }}
            />
          </div>
          <Text size="xs" color="tertiary" as="span" className={styles.value}>
            {step.px}px / {step.rem}
          </Text>
        </div>
      ))}
    </div>
  )
}

export { SpacingScale }
