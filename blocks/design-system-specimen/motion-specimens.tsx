"use client"

import * as React from "react"
import { cn } from "../../lib/utils"
import { Heading } from "../../components/ui/heading/heading"
import { Text } from "../../components/ui/text/text"
import { Button } from "../../components/ui/button/button"
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
  const [playing, setPlaying] = React.useState(false)

  const handlePlay = () => {
    setPlaying(false)
    // Force reflow to restart animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPlaying(true)
      })
    })
  }

  return (
    <section id="specimen-motion" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Motion & Duration</Heading>
      <Text color="secondary" size="sm">
        Duration tokens control transition speed.
      </Text>

      <Button variant="outline" size="sm" onClick={handlePlay}>
        Play animation
      </Button>

      <div className={styles.motionList}>
        {durations.map((duration) => (
          <div key={duration.token} className={styles.motionRow}>
            <Text size="xs" weight="medium" as="span" className={styles.motionLabel}>
              {duration.ms}ms
            </Text>
            <div className={styles.motionBarTrack}>
              <div
                className={cn(styles.motionBar, playing && styles.motionBarPlaying)}
                style={{
                  transitionDuration: `var(${duration.token}, ${duration.ms}ms)`,
                }}
              />
            </div>
            <Text size="xs" color="tertiary" as="span" className={styles.motionValue}>
              {duration.token}
            </Text>
          </div>
        ))}
      </div>
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
  const [playing, setPlaying] = React.useState(false)

  const handlePlay = () => {
    setPlaying(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPlaying(true)
      })
    })
  }

  return (
    <section id="specimen-easing" className={cn(styles.section, className)}>
      <Heading level={3} size="lg">Easing Curves</Heading>
      <Text color="secondary" size="sm">
        Easing tokens control the feel of transitions.
      </Text>

      <Button variant="outline" size="sm" onClick={handlePlay}>
        Play animation
      </Button>

      <div className={styles.easingList}>
        {easings.map((easing) => (
          <div key={easing.token} className={styles.easingRow}>
            <Text size="xs" weight="medium" as="span" className={styles.easingLabel}>
              {easing.name}
            </Text>
            <div className={styles.easingTrack}>
              <div
                className={cn(styles.easingDot, playing && styles.easingDotPlaying)}
                style={{
                  transitionTimingFunction: `var(${easing.token}, ${easing.value})`,
                }}
              />
            </div>
            <Text size="xs" color="tertiary" as="span" className={styles.easingValue}>
              {easing.value}
            </Text>
          </div>
        ))}
      </div>
    </section>
  )
}
