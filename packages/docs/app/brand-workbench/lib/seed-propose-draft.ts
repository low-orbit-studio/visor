// Seed → first-draft proposal (VI-594, UJ-F step 3).
//
// Extends the VI-562 Claude seam posture (provider-claude.ts): a direct browser Anthropic call (BYOK,
// no server hop) that turns extracted seed text into a `zDraftBrandRecord` proposal targeting
// Positioning. The output passes the SAME `zDraftBrandRecord` validation as manual entry (D3). Any
// provider / parse / validation fault collapses to the LOCAL `proposal-failed` (D4) — never the frozen
// `zAiFailure`. `fetchImpl` + `apiKey` are injectable so the proposal is unit-testable offline.

import { zDraftBrandRecord } from "../../../../../spec/contracts"
import type { DraftBrandRecord } from "../../../../../spec/types"
import { getApiKey, getModel } from "./byok"

export interface ProposeOk {
  ok: true
  record: DraftBrandRecord
}
export interface ProposeErr {
  ok: false
  failure: "proposal-failed"
  detail?: string
}
export type ProposeResult = ProposeOk | ProposeErr

export interface ProposeOptions {
  fetchImpl?: typeof fetch
  apiKey?: string | null
  model?: string
  signal?: AbortSignal
  timeoutMs?: number
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const ANTHROPIC_VERSION = "2023-06-01"
const MAX_TOKENS = 1024
const DEFAULT_TIMEOUT_MS = 60_000
/** Bound the prompt — a pasted deck/site can be long; the proposal only needs the gist. */
const MAX_SEED_CHARS = 12_000

function proposalSystemPrompt(): string {
  return [
    "You are the Brand Workbench strategist. The operator gave you raw source material (a site, a deck,",
    "or notes). Read it and propose a FIRST-DRAFT positioning they can sharpen — never a finished answer.",
    "Reply with EXACTLY ONE JSON object (no prose, no markdown fences) — a partial Brand Record with:",
    '  {"positioning":{"onliness":string,"category":string,"differentiation":string}}',
    'Optionally also include "essence" (an array of 2–3 short words) when the source clearly implies it.',
    "Every field is a single concise phrase grounded in the source. Invent nothing the source does not support.",
  ].join("\n")
}

/** Strip an accidental ```json … ``` fence so a fenced reply still parses (mirrors provider-claude). */
function unfence(text: string): string {
  const trimmed = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed)
  return fence ? fence[1].trim() : trimmed
}

const fail = (detail: string): ProposeErr => ({ ok: false, failure: "proposal-failed", detail })

/**
 * Turn extracted seed text into a validated `DraftBrandRecord` proposal (positioning-first), or a
 * `proposal-failed`. Keyless → fails fast (R-KEYLESS: no key, no AI).
 */
export async function proposeDraftFromText(
  seedText: string,
  options: ProposeOptions = {},
): Promise<ProposeResult> {
  const apiKey = options.apiKey ?? getApiKey()
  if (!apiKey) return fail("no BYOK key configured")

  const text = seedText.trim().slice(0, MAX_SEED_CHARS)
  if (!text) return fail("no seed text to propose from")

  const fetchImpl = options.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  let res: Response
  try {
    res = await fetchImpl(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: options.model ?? getModel(),
        max_tokens: MAX_TOKENS,
        system: proposalSystemPrompt(),
        messages: [{ role: "user", content: `Source material:\n\n${text}` }],
      }),
      signal: controller.signal,
    })
  } catch (err) {
    return fail(err instanceof Error ? err.message : "request failed")
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) return fail(`HTTP ${res.status}`)

  let payload: { content?: { type: string; text?: string }[] }
  try {
    payload = (await res.json()) as typeof payload
  } catch {
    return fail("non-JSON provider response")
  }

  const raw = payload.content?.find((b) => b.type === "text")?.text
  if (!raw) return fail("empty completion")

  let json: unknown
  try {
    json = JSON.parse(unfence(raw))
  } catch {
    return fail("completion was not valid JSON")
  }

  const parsed = zDraftBrandRecord.safeParse(json)
  if (!parsed.success) return fail("proposal did not match DraftBrandRecord")
  if (!parsed.data.positioning) return fail("proposal had no positioning")
  return { ok: true, record: parsed.data }
}
