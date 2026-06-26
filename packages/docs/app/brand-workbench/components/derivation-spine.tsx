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
import { SPINE_GROUPS, SPINE_PROGRESS } from "../lib/elicit-fixtures"
import styles from "./derivation-spine.module.css"

/** Per-node status, mapped onto the Stepper's status vocabulary (VI-550 adds `locked`). */
export type SpineNodeStatus = "complete" | "active" | "locked" | "upcoming"

/**
 * Column 1 — the derivation spine: the load-bearing chain (Start → … → Export) that is also the
 * journey nav. A welcoming progress card, then per-section vertical Steppers (with `locked` nodes
 * gated forward-only in guided mode), then the Guided ⇄ Canvas mode card. Static in VI-559: the
 * mode switch and node navigation arrive with VI-560/VI-561.
 */
export function DerivationSpine() {
  return (
    <nav className={styles.spine} data-testid="bw-spine" aria-label="Brand derivation spine">
      <div className={styles.progressCard} data-testid="bw-spine-progress-card">
        <div className={styles.pcHead}>
          <span className={styles.pcBrand}>{SPINE_PROGRESS.brand}</span>
          <span className={styles.pcTag}>{SPINE_PROGRESS.visibility}</span>
        </div>
        <div className={styles.pcCount}>
          <span className={styles.pcBig}>{SPINE_PROGRESS.done}</span>
          <span className={styles.pcOf}>of {SPINE_PROGRESS.total} steps</span>
          <span className={styles.pcPct}>{SPINE_PROGRESS.pct}%</span>
        </div>
        <Progress
          value={SPINE_PROGRESS.pct}
          size="thin"
          className={styles.pcBar}
          aria-label={`${SPINE_PROGRESS.done} of ${SPINE_PROGRESS.total} steps complete`}
        />
        <p className={styles.pcEnc}>
          Nice start — the hard part, your <em>only</em>, is locked. About 8 min to a complete draft.
        </p>
      </div>

      {SPINE_GROUPS.map((group) => (
        <div key={group.label} className={styles.group}>
          <div className={styles.eyebrow}>
            {group.label}
            <span className={group.countDone ? styles.countDone : styles.count}>{group.count}</span>
          </div>
          <Stepper orientation="vertical" variant="prominent" activeStep={-1}>
            {group.nodes.map((node, i) => (
              <StepperItem
                key={node.id}
                step={i}
                status={node.status}
                data-testid={`bw-spine-node-${node.id}`}
              >
                <StepperTrigger step={i} status={node.status} aria-label={node.title} />
                <StepperTitle>{node.title}</StepperTitle>
                <StepperDescription>{node.sublabel}</StepperDescription>
                {i < group.nodes.length - 1 && (
                  <StepperSeparator complete={node.status === "complete"} />
                )}
              </StepperItem>
            ))}
          </Stepper>
        </div>
      ))}

      <div className={styles.modeCard}>
        <ToggleGroup
          type="single"
          value="guided"
          onValueChange={() => {}}
          variant="outline"
          size="sm"
          aria-label="Authoring mode"
        >
          <ToggleGroupItem value="guided" data-testid="bw-mode-guided">
            Guided
          </ToggleGroupItem>
          <ToggleGroupItem value="canvas" data-testid="bw-mode-canvas" disabled>
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
