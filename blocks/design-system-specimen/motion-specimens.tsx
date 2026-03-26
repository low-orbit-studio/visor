"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { MotionDuration, MotionEasing } from "../../components/ui/motion-specimen/motion-specimen"
import styles from "./design-system-specimen.module.css"
import type { MotionDurationData, EasingData } from "./specimen-data"

// ─── Motion Duration ─────────────────────────────────────────────────────────

interface MotionDurationSectionProps {
  durations: MotionDurationData[]
  className?: string
}

export function MotionDurationSection({
  durations,
  className,
}: MotionDurationSectionProps) {
  return (
    <section id="specimen-motion" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Motion & Duration</Heading>
      <Text color="secondary" size="sm">
        Duration tokens control transition speed.
      </Text>

      <MotionDuration durations={durations} />
    </section>
  )
}

// ─── Easing Curves ───────────────────────────────────────────────────────────

interface MotionEasingSectionProps {
  easings: EasingData[]
  className?: string
}

export function MotionEasingSection({
  easings,
  className,
}: MotionEasingSectionProps) {
  return (
    <section id="specimen-easing" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Easing Curves</Heading>
      <Text color="secondary" size="sm">
        Easing tokens control the feel of transitions.
      </Text>

      <MotionEasing easings={easings} />
    </section>
  )
}
