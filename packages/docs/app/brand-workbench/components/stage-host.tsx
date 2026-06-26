"use client"

import type { SectionViewId } from "../../../../../spec/state-machine"
import { useSpine } from "../lib/use-spine"
import { StartView } from "../views/start"
import { StrategyView } from "../views/strategy"
import { VerbalToneView } from "../views/verbal-tone"
import { VisualView } from "../views/visual"
import { ProveView } from "../views/prove"
import { ExportView } from "../views/export"
import { CanvasView } from "../views/canvas"
import styles from "./stage-host.module.css"

/** One view component per frozen `SectionViewId` (`STEP_TO_VIEW`). */
const VIEWS: Record<SectionViewId, React.ComponentType> = {
  start: StartView,
  strategy: StrategyView,
  verbal: VerbalToneView,
  visual: VisualView,
  prove: ProveView,
  export: ExportView,
  canvas: CanvasView,
}

/**
 * The content region of the shell. Renders the single active view for the current step
 * (`STEP_TO_VIEW[currentStep]`). View switching is pure state — no routing (FREEZE-LEDGER E-6).
 */
export function StageHost() {
  const { view } = useSpine()
  const View = VIEWS[view]
  return (
    <div className={styles.host}>
      <View />
    </div>
  )
}
