"use client"

import { ElicitThread } from "../components/elicit-thread"
import { LiveCanvas } from "../components/live-canvas"
import styles from "./strategy.module.css"

/**
 * Strategy stage (positioning · essence · personality · pillars) — the VI-559 split-screen: the
 * conversational Elicit beside the live brand canvas. Reused unchanged; forward motion is the spine's
 * Continue control (the AI loop that drives per-step content is VI-562).
 */
export function StrategyView() {
  return (
    <div className={styles.split}>
      <ElicitThread />
      <LiveCanvas />
    </div>
  )
}
