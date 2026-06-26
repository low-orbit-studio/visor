"use client"

import { Progress } from "@/components/ui/progress"
import { TopBar } from "./components/top-bar"
import { DerivationSpine } from "./components/derivation-spine"
import { ElicitThread } from "./components/elicit-thread"
import { LiveCanvas } from "./components/live-canvas"
import { SPINE_PROGRESS } from "./lib/elicit-fixtures"
import styles from "./brand-workbench.module.css"

/**
 * Brand Workbench — core Elicit screen (VI-559).
 *
 * A static, theme-agnostic snapshot of the guided Strategy stage at the Essence step, faithful to
 * docs/design/brand-workbench/elicit-core.html: a three-column split-screen — derivation spine,
 * conversational Elicit, and a live brand canvas. No AI and no state transitions yet (the AI seam is
 * VI-562, journey routes VI-560, canvas live-edit VI-561). The active stage is reflected on the root
 * via `data-stage` until per-stage sub-routing lands (VI-560).
 */
export default function BrandWorkbenchPage() {
  return (
    <div className={styles.app} data-testid="bw-root" data-stage="strategy">
      <TopBar />
      <Progress
        value={SPINE_PROGRESS.pct}
        size="thin"
        className={styles.globalProgress}
        data-testid="bw-global-progress"
        aria-label="Overall brand progress"
      />
      <div className={styles.grid}>
        <DerivationSpine />
        <ElicitThread />
        <LiveCanvas />
      </div>
    </div>
  )
}
