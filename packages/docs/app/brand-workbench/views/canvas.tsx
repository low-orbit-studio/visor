"use client"

import { Check, PencilSimple, SquaresFour } from "@phosphor-icons/react"
import { CANVAS_CONTENT } from "../lib/journey-fixtures"
import stage from "./stage.module.css"
import styles from "./canvas.module.css"

/**
 * Canvas stage (journey.html L567–589) — the free-edit board, reachable only at/after Export (D-8 /
 * `canEnterCanvas`). Every block of the complete draft, editable in any order. The inline edit/save,
 * AI pressure-test, and live downstream re-resolution are VI-561/VI-562 — here the board is static.
 */
export function CanvasView() {
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
        {CANVAS_CONTENT.blocks.map((block) => (
          <div key={block.label} className={styles.block} data-testid="bw-block">
            <div className={styles.blockKey}>
              <span className={styles.ok} aria-hidden="true">
                <Check weight="bold" />
              </span>
              {block.label}
            </div>
            <div className={styles.blockVal}>{block.value}</div>
            <span className={styles.edit} aria-hidden="true">
              <PencilSimple />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
