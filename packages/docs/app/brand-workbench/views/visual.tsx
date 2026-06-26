"use client"

import { X } from "@phosphor-icons/react"
import { VISUAL_CONTENT } from "../lib/journey-fixtures"
import stage from "./stage.module.css"
import styles from "./visual.module.css"

/**
 * Visual stage (journey.html L455–496) — the look that falls out of the strategy: a suggested palette
 * (token-driven, so it re-tints with the theme), type specimen, brand marks, and AI-drafted don'ts.
 * Static review here; the AI suggestions are VI-562.
 */
export function VisualView() {
  return (
    <div className={stage.scroll} data-testid="bw-visual">
      <div className={stage.eyebrow}>{VISUAL_CONTENT.eyebrow}</div>
      <h2 className={stage.heading}>{VISUAL_CONTENT.heading}</h2>
      <p className={stage.lede}>{VISUAL_CONTENT.lede}</p>

      <div className={styles.two}>
        <div className={styles.col}>
          <div className={styles.panel}>
            <h4 className={styles.panelHead}>
              Color
              <span className={styles.tag}>suggested from strategy</span>
            </h4>
            <div className={styles.swrow}>
              {VISUAL_CONTENT.swatches.map((sw) => (
                <div key={sw.label} className={styles.swatch}>
                  <span className={styles.swChip} style={{ background: sw.value }} aria-hidden="true" />
                  <span className={styles.swLabel}>{sw.label}</span>
                  <code className={styles.swCode}>{sw.code}</code>
                </div>
              ))}
            </div>
            <div className={styles.rampNote}>{VISUAL_CONTENT.rampNote}</div>
            <div className={styles.ramp} aria-hidden="true" />
          </div>

          <div className={styles.panel}>
            <h4 className={styles.panelHead}>
              Don&apos;ts
              <span className={styles.tag}>AI-generated, you approve</span>
            </h4>
            <div className={styles.donts}>
              {VISUAL_CONTENT.donts.map((dont) => (
                <div key={dont} className={styles.dont}>
                  <span className={styles.dontMark} aria-hidden="true">
                    <X weight="bold" />
                  </span>
                  {dont}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.panel}>
            <h4 className={styles.panelHead}>
              Type
              <span className={styles.tag}>{VISUAL_CONTENT.typeTag}</span>
            </h4>
            <div className={styles.typeSpecimen}>{VISUAL_CONTENT.typeSpecimen}</div>
            <div className={styles.typeNote}>{VISUAL_CONTENT.typeNote}</div>
          </div>

          <div className={styles.panel}>
            <h4 className={styles.panelHead}>
              Marks
              <span className={styles.tag}>live on theme</span>
            </h4>
            <div className={styles.markbox}>
              <div className={styles.markLight}>Visor</div>
              <div className={styles.markDark}>Visor</div>
            </div>
            <div className={styles.markNote}>{VISUAL_CONTENT.markNote}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
