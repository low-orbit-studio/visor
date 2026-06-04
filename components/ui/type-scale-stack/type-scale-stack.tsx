import * as React from "react"
import { cn } from "../../../lib/utils"
import { TypeSpecimen } from "../type-specimen/type-specimen"
import styles from "./type-scale-stack.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TypeScaleStepProps {
  /** CSS custom property token for font size (e.g. "--font-size-xl") */
  token: string
  /** Label for this type step (e.g. "xl", "base") */
  label: string
  /** Font size in pixels */
  sizePx: number
  /** Sample text to render at this size */
  sample: string
}

export interface TypeScaleStackProps {
  /** Ordered array of type scale steps */
  steps: TypeScaleStepProps[]
  className?: string
}

// ─── TypeScaleStack ─────────────────────────────────────────────────────────

function TypeScaleStack({ steps, className }: TypeScaleStackProps) {
  return (
    <div data-slot="type-scale-stack" className={cn(styles.stack, className)}>
      {steps.map((step, index) => (
        <TypeSpecimen
          key={step.token}
          token={step.token}
          label={step.label}
          sizePx={step.sizePx}
          sampleText={step.sample}
          className={index === steps.length - 1 ? styles.stackRowLast : styles.stackRow}
        />
      ))}
    </div>
  )
}

export { TypeScaleStack }
