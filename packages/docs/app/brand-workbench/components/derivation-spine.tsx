"use client"

import {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper"
import { Progress } from "@/components/ui/progress"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { NodeStatus } from "../../../../../spec/state-machine"
import { useSpine } from "../lib/use-spine"
import { SPINE_LAYOUT, STAGE_ENCOURAGEMENT } from "../lib/journey-fixtures"
import { SPINE_PROGRESS } from "../lib/elicit-fixtures"
import styles from "./derivation-spine.module.css"

/** The Stepper's status vocabulary (VI-550 adds `locked`). */
export type SpineNodeStatus = "complete" | "active" | "locked" | "upcoming"

/**
 * Frozen NodeStatus → Stepper status. Future steps (`locked`/`pending`) render as `upcoming` so the
 * node stays a clickable nav button — the spine doubles as the journey nav (journey.html), and the
 * frozen testid contract exposes no separate advance affordance. The hard gate is Canvas mode (D-8).
 */
const TO_STEPPER: Record<NodeStatus, SpineNodeStatus> = {
  done: "complete",
  active: "active",
  locked: "upcoming",
  pending: "upcoming",
}

/**
 * Column 1 — the derivation spine: the load-bearing chain (Start → … → Export) that is also the
 * journey nav. The progress card, the per-section Steppers, and the Guided ⇄ Canvas mode card all
 * read live from the frozen state machine (`useSpine`): each node's status comes from
 * `deriveStepStatuses`, progress from `STAGE_PROGRESS`. Nodes are navigable — clicking a reached
 * (`done`/`active`) node jumps there; `locked` nodes are forward-only-gated and inert. Canvas mode
 * is enabled only once the guided chain reaches Export (D-8 / `canEnterCanvas`).
 */
export function DerivationSpine() {
  const { statuses, progress, view, goToStep, mode, setMode, canEnterCanvas } = useSpine()

  return (
    <nav className={styles.spine} data-testid="bw-spine" aria-label="Brand derivation spine">
      <div className={styles.progressCard} data-testid="bw-spine-progress-card">
        <div className={styles.pcHead}>
          <span className={styles.pcBrand}>{SPINE_PROGRESS.brand}</span>
          <span className={styles.pcTag}>{SPINE_PROGRESS.visibility}</span>
        </div>
        <div className={styles.pcCount}>
          <span className={styles.pcBig}>{progress.done}</span>
          <span className={styles.pcOf}>of {SPINE_PROGRESS.total} steps</span>
          <span className={styles.pcPct}>{progress.pct}%</span>
        </div>
        <Progress
          value={progress.pct}
          size="thin"
          className={styles.pcBar}
          aria-label={`${progress.done} of ${SPINE_PROGRESS.total} steps complete`}
        />
        <p className={styles.pcEnc}>{STAGE_ENCOURAGEMENT[view]}</p>
      </div>

      {SPINE_LAYOUT.map((group) => {
        const doneCount = group.nodes.filter((n) => statuses[n.id] === "done").length
        const allDone = doneCount === group.nodes.length
        return (
          <div key={group.label} className={styles.group}>
            <div className={styles.eyebrow}>
              {group.label}
              <span className={allDone ? styles.countDone : styles.count}>
                {doneCount} / {group.nodes.length}
              </span>
            </div>
            <Stepper orientation="vertical" variant="prominent" activeStep={-1}>
              {group.nodes.map((node, i) => {
                const stepperStatus = TO_STEPPER[statuses[node.id]]
                return (
                  <StepperItem
                    key={node.id}
                    step={i}
                    status={stepperStatus}
                    data-testid={`bw-spine-node-${node.id}`}
                  >
                    <StepperTrigger
                      step={i}
                      status={stepperStatus}
                      aria-label={node.title}
                      onClick={() => goToStep(node.id)}
                    />
                    <StepperTitle>{node.title}</StepperTitle>
                    <StepperDescription>{node.sublabel}</StepperDescription>
                    {i < group.nodes.length - 1 && (
                      <StepperSeparator complete={statuses[node.id] === "done"} />
                    )}
                  </StepperItem>
                )
              })}
            </Stepper>
          </div>
        )
      })}

      <div className={styles.modeCard}>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as "guided" | "canvas")}
          variant="outline"
          size="sm"
          aria-label="Authoring mode"
        >
          <ToggleGroupItem value="guided" data-testid="bw-mode-guided">
            Guided
          </ToggleGroupItem>
          <ToggleGroupItem value="canvas" data-testid="bw-mode-canvas" disabled={!canEnterCanvas}>
            Canvas
          </ToggleGroupItem>
        </ToggleGroup>
        <p className={styles.modeHint}>
          Guided walks you to a complete draft. Switch to Canvas any time to free-edit any block, in
          any order.
        </p>
      </div>
    </nav>
  )
}
