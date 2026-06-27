"use client"

// Elicit seam controller (VI-562) — the live layer that overlays the locked VI-559 static thread.
// It owns the runtime ElicitState and drives the frozen FSM via elicit-loop:
//   • key-active → composer send calls the real Claude provider (the CUJ mocks at the network layer).
//   • keyless    → the AI is suppressed; the manual lock is the only route to section-complete.
//   • a shown challenge advances only on an explicit operator keep/rewrite (human gate).

import * as React from "react"
import { runAiTurn, resolveChallenge, manualLock, elicitReduceGated } from "./elicit-loop"
import { createClaudeProvider } from "./provider-claude"
import { getModel } from "./byok"
import { useByok } from "./use-byok"
import { useSpine } from "./use-spine"
import { useSeed } from "./seed-store"
import type { ElicitState, KeyStatus } from "../../../../../spec/state-machine"
import type { ElicitRequest, ElicitResponse, AiFailure } from "../../../../../spec/contracts"

export interface ElicitSeamController {
  keyStatus: KeyStatus
  state: ElicitState
  lastResponse?: ElicitResponse
  lastFailure?: AiFailure
  /** Human-readable detail for the last failure (the provider's real message), when available. */
  lastFailureDetail?: string
  busy: boolean
  /** Send a composer message (key-active only; no-op in keyless — use `lock`). */
  send: (message: string) => Promise<void>
  /** Resolve a shown challenge — the human gate. */
  keep: () => void
  rewrite: () => void
  /** Manually lock the section (keyless or key-active). */
  lock: () => void
  /** Retry after a provider error. */
  retry: () => void
}

/**
 * The overlay continuation point. The locked VI-559 static thread already renders the AI's opening
 * question, so the live seam continues from `awaiting-input` for BOTH modes (rather than the pure-FSM
 * `empty`): key-active → composer send; keyless → manual lock. This is the seam's start-state choice,
 * not a new machine edge (the keyless G-B reasoning generalizes to the overlay).
 */
const OVERLAY_START: ElicitState = { kind: "awaiting-input" }

export function useElicitSeam(): ElicitSeamController {
  const { keyStatus } = useByok()
  const { currentStep } = useSpine()
  const { seeded } = useSeed()
  const [state, setState] = React.useState<ElicitState>(OVERLAY_START)
  const [lastResponse, setLastResponse] = React.useState<ElicitResponse | undefined>(undefined)
  const [lastFailure, setLastFailure] = React.useState<AiFailure | undefined>(undefined)
  const [lastFailureDetail, setLastFailureDetail] = React.useState<string | undefined>(undefined)
  const [busy, setBusy] = React.useState(false)

  // Flipping the key (keyless ⇄ key-active) resets the live overlay to the continuation point.
  React.useEffect(() => {
    setState(OVERLAY_START)
    setLastResponse(undefined)
    setLastFailure(undefined)
    setLastFailureDetail(undefined)
  }, [keyStatus])

  const send = React.useCallback(
    async (message: string) => {
      if (keyStatus !== "key-active" || !message.trim()) return
      setBusy(true)
      setLastFailure(undefined)
      setLastFailureDetail(undefined)
      const req: ElicitRequest = {
        requestId: crypto.randomUUID(),
        step: currentStep,
        // Seed the AI's "record so far" with the UJ-F first-draft proposal when present (VI-594).
        record: seeded ?? {},
        userMessage: message,
        model: getModel(),
      }
      const turn = await runAiTurn(state, req, { provider: createClaudeProvider(), keyStatus })
      setState(turn.state)
      setLastResponse(turn.response)
      setLastFailure(turn.failure)
      setLastFailureDetail(turn.detail)
      setBusy(false)
    },
    [keyStatus, currentStep, state, seeded],
  )

  const keep = React.useCallback(() => setState((s) => resolveChallenge(s, "keep")), [])
  const rewrite = React.useCallback(() => setState((s) => resolveChallenge(s, "rewrite")), [])
  const lock = React.useCallback(() => setState((s) => manualLock(s)), [])
  const retry = React.useCallback(
    () => setState((s) => elicitReduceGated(s, "error-retry", keyStatus)),
    [keyStatus],
  )

  return {
    keyStatus,
    state,
    lastResponse,
    lastFailure,
    lastFailureDetail,
    busy,
    send,
    keep,
    rewrite,
    lock,
    retry,
  }
}
