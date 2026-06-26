"use client"

import { SquaresFour } from "@phosphor-icons/react"
import { Spinner } from "@/components/ui/spinner"
import { EditableBlock } from "@/components/ui/editable-block"
import { useDraft } from "../lib/draft-store"
import { CANVAS_CONTENT } from "../lib/journey-fixtures"
import stage from "./stage.module.css"
import styles from "./canvas.module.css"

/**
 * Canvas stage (journey.html L567–589) — the free-edit board, reachable only at/after Export (D-8 /
 * `canEnterCanvas`). Every block of the shared draft (VI-561 `draft-store`) is editable in any order
 * via `EditableBlock`; saving a block writes the single shared draft and marks its downstream
 * derivation closure `stale` (D4, scoped per pillar). Stale blocks show a re-resolving affordance and
 * settle back to `set` lazily, on the next view of the Guided section that owns them. The AI
 * pressure-test action is suppressed here — it depends on the BYOK/AI seam (VI-562).
 */
export function CanvasView() {
  const { blocks, editBlock } = useDraft()

  return (
    <div className={stage.scroll} data-testid="bw-canvas-view">
      <div className={styles.head}>
        <div className={styles.headText}>
          <div className={stage.eyebrow}>{CANVAS_CONTENT.eyebrow}</div>
          <h2 className={stage.heading}>{CANVAS_CONTENT.heading}</h2>
          <p className={stage.lede}>{CANVAS_CONTENT.lede}</p>
        </div>
        <span className={styles.banner}>
          <SquaresFour aria-hidden="true" />
          {CANVAS_CONTENT.banner}
        </span>
      </div>

      <div className={styles.board} data-testid="bw-board">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={styles.cell}
            data-testid="bw-block"
            data-block={block.id}
            data-status={block.status}
          >
            <EditableBlock
              label={block.label}
              value={block.value}
              done={block.status !== "stale"}
              aiActionLabel={null}
              onSave={(value) => editBlock(block.id, value)}
            />
            {block.status === "stale" ? (
              <span className={styles.reresolving}>
                <Spinner size="xs" tone="primary" />
                re-resolving from upstream…
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}
