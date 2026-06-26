"use client"

import { ScoreIndicator } from "@/components/ui/score-indicator"
import { CheckGroup, CheckRow } from "@/components/ui/coherence-check"
import { PROVE_CONTENT } from "../lib/journey-fixtures"
import stage from "./stage.module.css"
import styles from "./prove.module.css"

/**
 * Prove stage (journey.html L499–522) — the coherence audit: a score ring, a pass/warn/fail summary,
 * and grouped checks. Per R-PROVE-NONBLOCKING (D-7) warn and fail are advisory — nothing blocks the
 * export. The audit is a static snapshot here; live re-proving on edit is VI-561.
 */
export function ProveView() {
  const { score, summary, summarySub, counts, groups } = PROVE_CONTENT

  return (
    <div className={stage.scroll} data-testid="bw-prove">
      <div className={stage.eyebrow}>{PROVE_CONTENT.eyebrow}</div>
      <h2 className={stage.heading}>{PROVE_CONTENT.heading}</h2>
      <p className={stage.lede}>{PROVE_CONTENT.lede}</p>

      <div className={styles.scorebar}>
        <ScoreIndicator
          value={score}
          variant="ring"
          size="lg"
          ariaLabel={`Coherence score ${score} percent`}
          data-testid="bw-score-ring"
        />
        <div className={styles.sx}>
          <b>{summary}</b>
          <p>{summarySub}</p>
        </div>
        <div className={styles.counts}>
          <span className={styles.count}>
            <span className={styles.dotPass} aria-hidden="true" />
            {counts.pass} pass
          </span>
          <span className={styles.count}>
            <span className={styles.dotWarn} aria-hidden="true" />
            {counts.warn} warn
          </span>
          <span className={styles.count}>
            <span className={styles.dotFail} aria-hidden="true" />
            {counts.fail} fail
          </span>
        </div>
      </div>

      {groups.map((group) => (
        <CheckGroup key={group.heading} heading={group.heading} className={styles.group}>
          {group.checks.map((check) => (
            <CheckRow
              key={check.title}
              state={check.state}
              title={check.title}
              description={check.description}
              fixLabel={"fixLabel" in check ? check.fixLabel : undefined}
              data-testid="bw-check"
            />
          ))}
        </CheckGroup>
      ))}
    </div>
  )
}
