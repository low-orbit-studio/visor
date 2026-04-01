"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import styles from "./steps-section.module.css"

export interface Step {
  title: string
  description: string
  icon?: React.ReactNode
}

export interface StepsSectionProps {
  heading?: string
  description?: string
  steps: Step[]
  className?: string
}

export function StepsSection({
  heading,
  description,
  steps,
  className,
}: StepsSectionProps) {
  const headingId = heading ? "steps-section-heading" : undefined

  return (
    <section
      data-slot="steps-section"
      className={cn(styles.root, className)}
      aria-label={heading ? undefined : "Steps"}
      aria-labelledby={headingId}
    >
      <div className={styles.container}>
        {(heading || description) && (
          <div className={styles.header}>
            {heading && (
              <Heading level={2} id={headingId}>{heading}</Heading>
            )}
            {description && (
              <Text color="secondary">{description}</Text>
            )}
          </div>
        )}
        <div className={styles.grid}>
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(styles.step, i < steps.length - 1 && styles.hasConnector)}
            >
              {step.icon ? (
                <div className={styles.icon}>{step.icon}</div>
              ) : (
                <div className={styles.number} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </div>
              )}
              <Heading level={3} className={styles.title}>{step.title}</Heading>
              <Text color="secondary">{step.description}</Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
