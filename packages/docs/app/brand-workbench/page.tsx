"use client"

import { Progress } from "@/components/ui/progress"
import { TopBar } from "./components/top-bar"
import { DerivationSpine } from "./components/derivation-spine"
import { StageHost } from "./components/stage-host"
import { SpineProvider, useSpineController, useSpine } from "./lib/use-spine"
import { DraftProvider, useDraftController, useResolveOnView } from "./lib/draft-store"
import styles from "./brand-workbench.module.css"

/**
 * The shell: a three-region surface (top bar / spine nav / stage host). The active view + global
 * progress read from the navigation controller; `data-stage` reflects the active `SectionViewId`.
 */
function BrandWorkbenchShell() {
  const { view, progress } = useSpine()
  // D4 lazy trigger: re-resolve the active view's derived sections whenever the view changes.
  useResolveOnView(view)

  return (
    <div className={styles.app} data-testid="bw-root" data-stage={view}>
      <TopBar />
      <Progress
        value={progress.pct}
        size="thin"
        className={styles.globalProgress}
        data-testid="bw-global-progress"
        aria-label="Overall brand progress"
      />
      <div className={styles.grid}>
        <DerivationSpine />
        <StageHost />
      </div>
    </div>
  )
}

/**
 * Brand Workbench (VI-560) — the seven journey stages (Start → Strategy → Verbal → Visual → Prove →
 * Export → Canvas) as navigable views on a single `/brand-workbench` route (FREEZE-LEDGER E-6: no
 * sub-routes). The spine drives content switching off the frozen `spec/state-machine.ts` via
 * `useSpineController`; Canvas is gated to ≥Export (D-8). The shared draft store + lazy per-pillar
 * re-resolution are VI-561 (Guided ⇄ Canvas). No AI (VI-562).
 */
export default function BrandWorkbenchPage() {
  const controller = useSpineController()
  const draft = useDraftController()
  return (
    <SpineProvider value={controller}>
      <DraftProvider value={draft}>
        <BrandWorkbenchShell />
      </DraftProvider>
    </SpineProvider>
  )
}
