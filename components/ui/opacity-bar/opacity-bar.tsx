import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./opacity-bar.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OpacityBarItemProps {
  /** CSS custom property token name (e.g. "--opacity-50") */
  token: string
  /** Display name (e.g. "50%") */
  name: string
  /** Opacity value between 0 and 1 */
  value: number
}

export interface OpacityBarProps {
  /** Array of opacity levels to display */
  levels: OpacityBarItemProps[]
  className?: string
}

// ─── OpacityBar ─────────────────────────────────────────────────────────────

function OpacityBar({ levels, className }: OpacityBarProps) {
  return (
    <div data-slot="opacity-bar" className={cn(styles.list, className)}>
      {levels.map((level) => (
        <div key={level.token} className={styles.row}>
          <Text size="xs" weight="medium" as="span" className={styles.label}>
            {level.name}
          </Text>
          <div className={styles.barTrack}>
            <div
              className={styles.bar}
              style={{ opacity: level.value }}
            />
          </div>
          <Text size="xs" color="tertiary" as="span" className={styles.value}>
            {level.token}
          </Text>
        </div>
      ))}
    </div>
  )
}

export { OpacityBar }
