// Adversarial challenge generation — prompt + post-process (VI-562, D4 + D7 human gate).
//
// The AI AUTHORS challenges; the operator must explicitly accept or reject one (the human gate lives
// in elicit-loop `resolveChallenge`). This module only (a) builds the prompt that asks Claude to
// challenge a claim, and (b) normalizes a raw reply into the frozen `challenge` ElicitResponse shape.
// It never resolves a challenge and never advances state — "no autonomous strategist" (D4).

import { zElicitResponse, type ElicitResponse } from "../../../../../spec/contracts"
import type { DraftBrandRecord } from "../../../../../spec/types"

/** The challenge payload rendered by ChallengeCard (mirrors the frozen `challenge` union member). */
export interface Challenge {
  framing: string
  body: string
  keepLabel: string
  rewriteLabel: string
}

/** Default gate labels when the AI omits them (kept short + action-shaped). */
export const DEFAULT_KEEP_LABEL = "Keep it"
export const DEFAULT_REWRITE_LABEL = "I'll rewrite it"

/**
 * Build the prompt that asks Claude to adversarially challenge a claim for the given step. The reply
 * must be a `challenge` ElicitResponse. Deterministic — same inputs, same prompt (cache-friendly).
 */
export function buildChallengePrompt(
  step: string,
  claim: string,
  record: DraftBrandRecord,
): string {
  return [
    `You are stress-testing the operator's "${step}" claim before it locks into the Brand Record.`,
    `The claim: ${JSON.stringify(claim)}`,
    `Record so far: ${JSON.stringify(record)}`,
    "Find the weakest assumption: is it actually differentiated, defensible, and true? Name who else",
    "could say the same. Then either point to a sharper wedge or invite the operator to rewrite it.",
    "Reply with a single challenge JSON object:",
    '{"kind":"challenge","framing":<short headline>,"body":<the adversarial argument>,',
    '"keepLabel":<accept-the-strong-version label>,"rewriteLabel":<rewrite-it label>}',
  ].join("\n")
}

/** Truthy non-blank string guard. */
function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0
}

/**
 * Normalize a raw AI reply into a `Challenge`. `framing` + `body` are required; missing/blank labels
 * fall back to the defaults so a terse reply still renders a valid, gated challenge. Returns null
 * when the reply isn't a usable challenge (the loop then keeps the operator in control, not advanced).
 */
export function parseChallenge(raw: unknown): Challenge | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  if ("kind" in r && r.kind !== "challenge") return null
  if (!nonEmpty(r.framing) || !nonEmpty(r.body)) return null
  return {
    framing: r.framing.trim(),
    body: r.body.trim(),
    keepLabel: nonEmpty(r.keepLabel) ? r.keepLabel.trim() : DEFAULT_KEEP_LABEL,
    rewriteLabel: nonEmpty(r.rewriteLabel) ? r.rewriteLabel.trim() : DEFAULT_REWRITE_LABEL,
  }
}

/** Lift a normalized Challenge into a frozen-contract `challenge` ElicitResponse (validated). */
export function toElicitChallenge(c: Challenge): Extract<ElicitResponse, { kind: "challenge" }> {
  return zElicitResponse.parse({ kind: "challenge", ...c }) as Extract<
    ElicitResponse,
    { kind: "challenge" }
  >
}
