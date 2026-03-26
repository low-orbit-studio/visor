import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import styles from "./radius-scale.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RadiusScaleItemProps {
  /** CSS custom property token for the radius (e.g. "--radius-lg") */
  token: string
  /** Display name (e.g. "lg", "full") */
  name: string
  /** Radius in pixels */
  px: number
}

export interface RadiusScaleProps {
  /** Array of radius steps to display */
  steps: RadiusScaleItemProps[]
  className?: string
}

// ─── RadiusScale ────────────────────────────────────────────────────────────

function RadiusScale({ steps, className }: RadiusScaleProps) {
  return (
    <div data-slot="radius-scale" className={cn(styles.grid, className)}>
      {steps.map((step) => (
        <div key={step.token} className={styles.item}>
          <div
            className={styles.box}
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
  )
}

export { RadiusScale }
