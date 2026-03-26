"use client"

import * as React from "react"
import { cn } from "../../../lib/utils"
import { Text } from "../text/text"
import { Button } from "../button/button"
import styles from "./motion-specimen.module.css"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MotionDurationItemProps {
  /** CSS custom property token for the duration (e.g. "--motion-duration-200") */
  token: string
  /** Display name */
  name: string
  /** Duration in milliseconds */
  ms: number
}

export interface MotionDurationProps {
  /** Array of duration items to display */
  durations: MotionDurationItemProps[]
  className?: string
}

export interface MotionEasingItemProps {
  /** CSS custom property token for the easing (e.g. "--motion-easing-ease-out") */
  token: string
  /** Display name (e.g. "ease-out") */
  name: string
  /** CSS timing function value */
  value: string
}

export interface MotionEasingProps {
  /** Array of easing items to display */
  easings: MotionEasingItemProps[]
  className?: string
}

// ─── MotionDuration ─────────────────────────────────────────────────────────

function MotionDuration({ durations, className }: MotionDurationProps) {
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
    <div data-slot="motion-duration" className={cn(styles.wrapper, className)}>
      <Button variant="outline" size="sm" onClick={handlePlay}>
        Play animation
      </Button>

      <div className={styles.durationList}>
        {durations.map((duration) => (
          <div key={duration.token} className={styles.durationRow}>
            <Text size="xs" weight="medium" as="span" className={styles.durationLabel}>
              {duration.ms}ms
            </Text>
            <div className={styles.barTrack}>
              <div
                className={cn(styles.durationBar, playing && styles.durationBarPlaying)}
                style={{
                  transitionDuration: `var(${duration.token}, ${duration.ms}ms)`,
                }}
              />
            </div>
            <Text size="xs" color="tertiary" as="span" className={styles.durationValue}>
              {duration.token}
            </Text>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── MotionEasing ───────────────────────────────────────────────────────────

function MotionEasing({ easings, className }: MotionEasingProps) {
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
    <div data-slot="motion-easing" className={cn(styles.wrapper, className)}>
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
    </div>
  )
}

export { MotionDuration, MotionEasing }
