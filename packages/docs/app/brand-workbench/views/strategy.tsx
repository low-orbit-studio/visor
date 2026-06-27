"use client"

import { Sparkle } from "@phosphor-icons/react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { ElicitThread } from "../components/elicit-thread"
import { LiveCanvas } from "../components/live-canvas"
import { useSpine } from "../lib/use-spine"
import { useSeed } from "../lib/seed-store"
import styles from "./strategy.module.css"

/**
 * Strategy stage (positioning · essence · personality · pillars) — the VI-559 split-screen: the
 * conversational Elicit beside the live brand canvas. When the seed path (UJ-F, VI-594) proposed a
 * first-draft positioning, a success banner surfaces it at the top of Positioning ("land on
 * Positioning with seeded draft"); the AI loop that drives per-step content is VI-562.
 */
export function StrategyView() {
  const { currentStep } = useSpine()
  const { seeded } = useSeed()
  const seededPositioning = currentStep === "positioning" ? seeded?.positioning : undefined

  return (
    <div className={styles.stage}>
      {seededPositioning ? (
        <Alert variant="success" className={styles.seededBanner} data-testid="bw-seeded-draft">
          <AlertTitle>
            <Sparkle weight="fill" aria-hidden="true" /> First draft seeded from your materials
          </AlertTitle>
          <AlertDescription>{seededPositioning.onliness}</AlertDescription>
        </Alert>
      ) : null}
      <div className={styles.split}>
        <ElicitThread />
        <LiveCanvas />
      </div>
    </div>
  )
}
