// Elicit conversation loop — drives the frozen Elicit FSM per R-ELICIT (VI-562).
//
// This module NEVER edits the frozen machine (spec/state-machine.ts). It composes `elicitReduce`,
// the `ELICIT_TRANSITIONS` table, and `AI_DEPENDENT_EVENTS` into the runtime loop:
//   • R-KEYLESS gate — in `keyless` no AI-dependent event fires; the manual route still works.
//   • AI turn — user-sends → assistant-streaming → provider.elicit → mapped event (or ai-errors).
//   • Human gate — a challenge only advances on an explicit operator keep/rewrite.
//
// G-B resolution (R-KEYLESS NOTE): the frozen table defines `section-lock` only from
// `assistant-streaming`, and `assistant-asks` (the only exit from `empty`) is AI-dependent — so a
// keyless session can't leave `empty`. Rather than INVENT a new machine edge (which the NOTE
// forbids), the build (a) seeds the keyless Elicit state at `awaiting-input` — the composer + mad-lib
// are live from the start, matching BUILD-HANDOFF "fully manual, all UI intact" — and (b) reaches
// `section-complete` by COMPOSING the two existing non-AI-dependent edges the table already defines:
// `user-sends` (awaiting-input → assistant-streaming) then `section-lock` (→ section-complete).

import {
  elicitReduce,
  AI_DEPENDENT_EVENTS,
  type ElicitState,
  type ElicitEvent,
  type ChallengeResolution,
  type KeyStatus,
} from "../../../../../spec/state-machine"
import type { ElicitRequest, ElicitResponse, AiFailure } from "../../../../../spec/contracts"
import { type Provider, aiFailureOf, aiDetailOf } from "./provider-claude"

export type { ChallengeResolution }

/** Outcome of one AI turn: the next state, plus the provider reply or the AiFailure that occurred. */
export interface ElicitTurn {
  state: ElicitState
  response?: ElicitResponse
  failure?: AiFailure
  /** Human-readable failure detail (the provider's real message), surfaced beside `failure`. */
  detail?: string
}

/** Map a provider reply to the Elicit event that consumes it (assistant-streaming → next state). */
export function responseToEvent(resp: ElicitResponse): ElicitEvent {
  switch (resp.kind) {
    case "text":
      return "ai-returns-text"
    case "tool":
      return "ai-returns-tool"
    case "challenge":
      return "ai-returns-challenge"
    case "warning":
      return "ai-returns-warning"
    case "section-complete":
      return "section-lock"
  }
}

/** AI turbo is on only with a key (R-KEYLESS). */
export function aiEnabled(keyStatus: KeyStatus): boolean {
  return keyStatus === "key-active"
}

/**
 * R-KEYLESS-gated reduce. In `keyless`, an AI-dependent event is suppressed (never fires) and the
 * state is returned unchanged; every non-AI event reduces normally. In `key-active`, identical to
 * `elicitReduce`.
 */
export function elicitReduceGated(
  state: ElicitState,
  event: ElicitEvent,
  keyStatus: KeyStatus,
): ElicitState {
  if (keyStatus === "keyless" && AI_DEPENDENT_EVENTS.includes(event)) return state
  return elicitReduce(state, event)
}

/**
 * Initial Elicit state for the key status (G-B resolution). Key-active opens at `empty` and the AI
 * fires `assistant-asks`; keyless opens at `awaiting-input` so the manual mad-lib + lock path is
 * immediately usable without any AI turn. Not a new machine edge — a build-time start-state choice.
 */
export function initialElicitForKey(keyStatus: KeyStatus): ElicitState {
  return keyStatus === "keyless" ? { kind: "awaiting-input" } : { kind: "empty" }
}

/** Events that move a valid source state into `assistant-streaming` (the AI-call entry points). */
type StreamTrigger = "user-sends" | "user-submits-tool" | "warning-apply-fix"

/**
 * Drive one AI turn. Reduces the trigger to `assistant-streaming`, calls the provider, then reduces
 * the mapped reply event — or `ai-errors` on rejection. In `keyless` this is a no-op (AI suppressed,
 * provider never called): the manual route (`manualLock`) is the only path to `section-complete`.
 */
export async function runAiTurn(
  state: ElicitState,
  req: ElicitRequest,
  deps: { provider: Provider; keyStatus: KeyStatus },
  trigger: StreamTrigger = "user-sends",
): Promise<ElicitTurn> {
  if (deps.keyStatus === "keyless") return { state }

  const streaming = elicitReduceGated(state, trigger, deps.keyStatus)
  if (streaming.kind !== "assistant-streaming") return { state: streaming } // invalid trigger: no-op

  try {
    const response = await deps.provider.elicit(req)
    return {
      state: elicitReduceGated(streaming, responseToEvent(response), deps.keyStatus),
      response,
    }
  } catch (err) {
    return {
      state: elicitReduceGated(streaming, "ai-errors", deps.keyStatus),
      failure: aiFailureOf(err),
      detail: aiDetailOf(err),
    }
  }
}

/**
 * Resolve a shown challenge — the human gate. Only an explicit operator choice advances the machine
 * (keep → section-complete; rewrite → awaiting-input); nothing else moves it out of `challenge-shown`.
 * challenge-keep / challenge-rewrite are operator events, never AI-dependent, so they fire in keyless.
 */
export function resolveChallenge(state: ElicitState, resolution: ChallengeResolution): ElicitState {
  return elicitReduce(state, resolution === "keep" ? "challenge-keep" : "challenge-rewrite")
}

/**
 * Manual section lock — the only non-AI route to `section-complete` (R-KEYLESS). Composes the two
 * non-AI-dependent edges the frozen table defines: `user-sends` (awaiting-input → assistant-streaming)
 * then `section-lock` (assistant-streaming → section-complete). A no-op once already complete.
 */
export function manualLock(state: ElicitState): ElicitState {
  let next = state
  if (next.kind === "awaiting-input") next = elicitReduce(next, "user-sends")
  if (next.kind === "assistant-streaming") next = elicitReduce(next, "section-lock")
  return next
}
