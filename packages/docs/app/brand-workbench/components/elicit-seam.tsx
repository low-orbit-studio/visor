"use client"

// Live Elicit seam (VI-562) — the interactive layer rendered below the locked VI-559 static thread.
// It surfaces only the new BYOK/AI seam behaviors so the approved static conversation stays intact:
//   • status strip — keyless (manual) vs key-active (AI turbo) + section-locked state.
//   • keyless     — a manual "Lock section" affordance (the only non-AI route to section-complete).
//   • key-active  — streaming, the live adversarial challenge (human gate: keep/rewrite), and errors.
// All testids are namespaced `bw-seam-*` (VI-562 surface) so they never collide with the frozen
// golden-path testids in the static thread above.

import { Sparkle, Lock, Check, Warning, ArrowClockwise } from "@phosphor-icons/react"
import {
  ChallengeCard,
  ChallengeCardHeader,
  ChallengeCardBody,
  ChallengeCardActions,
  ChallengeCardAction,
  ChallengeCardGate,
} from "@/components/ui/challenge-card"
import { StatusDot } from "@/components/ui/status-dot"
import { Button } from "@/components/ui/button"
import type { ElicitSeamController } from "../lib/use-elicit-seam"
import styles from "./elicit-seam.module.css"

export function ElicitSeam({ ctl }: { ctl: ElicitSeamController }) {
  const { keyStatus, state, lastResponse, lastFailure, lastFailureDetail, busy } = ctl
  const active = keyStatus === "key-active"
  const complete = state.kind === "section-complete"

  return (
    <section
      className={styles.seam}
      data-testid="bw-seam"
      data-key-status={keyStatus}
      data-state={state.kind}
    >
      <div className={styles.status} data-testid="bw-seam-status">
        <StatusDot tone={active ? "mint" : "muted"} aria-hidden="true" />
        <span>{active ? "AI turbo · key active" : "Manual · keyless"}</span>
        {complete ? (
          <span className={styles.locked} data-testid="bw-seam-locked">
            <Check weight="bold" aria-hidden="true" /> Section locked
          </span>
        ) : null}
      </div>

      {/* Keyless: the manual lock is the only non-AI route to section-complete (R-KEYLESS). */}
      {!active && !complete ? (
        <Button size="sm" variant="outline" onClick={ctl.lock} data-testid="bw-seam-lock">
          <Lock aria-hidden="true" /> Lock section manually
        </Button>
      ) : null}

      {/* Key-active: live AI turn driven by the composer. */}
      {active && busy ? (
        <div className={styles.streaming} data-testid="bw-seam-streaming">
          <Sparkle weight="fill" aria-hidden="true" /> Strategist is drafting…
        </div>
      ) : null}

      {active && state.kind === "challenge-shown" && lastResponse?.kind === "challenge" ? (
        <ChallengeCard data-testid="bw-seam-challenge">
          <ChallengeCardHeader>{lastResponse.framing}</ChallengeCardHeader>
          <ChallengeCardBody>{lastResponse.body}</ChallengeCardBody>
          <ChallengeCardActions>
            <ChallengeCardAction
              variant="primary"
              onClick={ctl.keep}
              data-testid="bw-seam-challenge-keep"
            >
              {lastResponse.keepLabel}
            </ChallengeCardAction>
            <ChallengeCardAction
              variant="ghost"
              icon={null}
              onClick={ctl.rewrite}
              data-testid="bw-seam-challenge-rewrite"
            >
              {lastResponse.rewriteLabel}
            </ChallengeCardAction>
            <ChallengeCardGate />
          </ChallengeCardActions>
        </ChallengeCard>
      ) : null}

      {active && state.kind === "error" ? (
        <div className={styles.error} data-testid="bw-seam-error">
          <Warning aria-hidden="true" />
          <span>
            {lastFailureDetail
              ? `Provider error: ${lastFailureDetail}`
              : `Provider error: ${lastFailure ?? "unknown"}.`}
          </span>
          <button type="button" className={styles.retry} onClick={ctl.retry} data-testid="bw-seam-retry">
            <ArrowClockwise aria-hidden="true" /> Retry
          </button>
        </div>
      ) : null}
    </section>
  )
}
