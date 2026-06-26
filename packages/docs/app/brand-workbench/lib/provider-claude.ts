// AI provider seam — Claude-first, BYOK, local-first (VI-562, D2/D10).
//
// Implements the frozen `elicit(req): Promise<ElicitResponse>` contract (spec/INTERFACE.d.ts). The
// browser calls the Anthropic Messages API directly with the user's BYOK key — no server hop (D1) —
// via the documented `anthropic-dangerous-direct-browser-access` posture. A `Provider` interface
// fronts the implementation so a future provider can slot in without touching the UI (D2 abstraction).
//
// Failures REJECT with an `ElicitError` carrying an `AiFailure` (spec contract: "Rejects with an
// AiFailure"); the Elicit loop maps that to the `error` state.

import {
  zElicitRequest,
  zElicitResponse,
  type ElicitRequest,
  type ElicitResponse,
  type AiFailure,
} from "../../../../../spec/contracts"
import { getApiKey } from "./byok"

/** The provider abstraction the workbench drives (D2 — Claude-first, future providers slot in). */
export interface Provider {
  elicit(req: ElicitRequest): Promise<ElicitResponse>
}

/** A rejected elicit() carries the closed-enum AiFailure the Elicit machine maps to `error`. */
export class ElicitError extends Error {
  readonly failure: AiFailure
  constructor(failure: AiFailure, message?: string) {
    super(message ?? failure)
    this.name = "ElicitError"
    this.failure = failure
  }
}

/** Extract the AiFailure from a thrown value, defaulting unknown throwables to "unknown". */
export function aiFailureOf(err: unknown): AiFailure {
  return err instanceof ElicitError ? err.failure : "unknown"
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
const ANTHROPIC_VERSION = "2023-06-01"
const MAX_TOKENS = 2048
const DEFAULT_TIMEOUT_MS = 60_000

/** Map a non-OK HTTP status to the closest AiFailure (closed enum — no generic server-error bucket). */
function failureForStatus(status: number): AiFailure {
  if (status === 401) return "invalid-key"
  if (status === 403) return "provider-auth-failed"
  if (status === 429) return "rate-limited"
  if (status === 408 || status === 504) return "timeout"
  return "unknown" // 400 / 5xx / 529 — no finer bucket in zAiFailure
}

/**
 * System contract for the strategist. Claude must answer with exactly one JSON object matching the
 * frozen `zElicitResponse` discriminated union — the same shapes the Elicit center-panel renders.
 */
function systemPrompt(step: string): string {
  return [
    "You are the Brand Workbench strategist — a sharp, adversarial brand partner.",
    `The active derivation step is "${step}". Help the operator derive that section of their Brand Record.`,
    "Reply with EXACTLY ONE JSON object (no prose, no markdown fences) matching one of these shapes:",
    '- {"kind":"text","content":string} — a plain conversational reply / question.',
    '- {"kind":"tool","title":string,"template":string,"slots":[{"id":string,"value":string|null}]} — an inline mad-lib to fill.',
    '- {"kind":"challenge","framing":string,"body":string,"keepLabel":string,"rewriteLabel":string} — an adversarial challenge the human must accept or reject.',
    '- {"kind":"warning","message":string,"fixAvailable":boolean} — a non-blocking off-voice/coherence advisory.',
    '- {"kind":"section-complete","patch":object} — the section is settled; patch is the Brand Record fragment to merge.',
    "Prefer a structured tool over free text when eliciting concrete slots. Challenge weak claims before locking.",
  ].join("\n")
}

/** Strip an accidental ```json … ``` fence so a fenced reply still parses. */
function unfence(text: string): string {
  const trimmed = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(trimmed)
  return fence ? fence[1].trim() : trimmed
}

/** Options for the Claude provider — fetch + key are injectable so the seam is unit-testable. */
export interface ClaudeProviderOptions {
  apiKey?: string | null
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

/**
 * Build a Claude-backed Provider. With no options it reads the BYOK key from localStorage and uses
 * the global `fetch`; tests inject a stub key + fetch.
 */
export function createClaudeProvider(options: ClaudeProviderOptions = {}): Provider {
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  return {
    async elicit(rawReq: ElicitRequest): Promise<ElicitResponse> {
      const parsed = zElicitRequest.safeParse(rawReq)
      if (!parsed.success) throw new ElicitError("unknown", "malformed ElicitRequest")
      const req = parsed.data

      const apiKey = options.apiKey ?? getApiKey()
      if (!apiKey) throw new ElicitError("invalid-key", "no BYOK key configured")

      const body = {
        model: req.model,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(req.step),
        messages: [
          {
            role: "user",
            content:
              req.userMessage?.trim() ||
              `Open the "${req.step}" step. Here is the record so far: ${JSON.stringify(req.record)}`,
          },
        ],
      }

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)

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
          body: JSON.stringify(body),
          signal: controller.signal,
        })
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw new ElicitError("timeout", "request timed out")
        }
        throw new ElicitError("network-error", "network request failed")
      } finally {
        clearTimeout(timer)
      }

      if (!res.ok) throw new ElicitError(failureForStatus(res.status), `HTTP ${res.status}`)

      let payload: { content?: { type: string; text?: string }[]; stop_reason?: string }
      try {
        payload = await res.json()
      } catch {
        throw new ElicitError("unknown", "non-JSON response")
      }

      if (payload.stop_reason === "refusal") {
        throw new ElicitError("content-filtered", "provider refused the request")
      }

      const text = payload.content?.find((b) => b.type === "text")?.text
      if (!text) throw new ElicitError("unknown", "empty completion")

      let json: unknown
      try {
        json = JSON.parse(unfence(text))
      } catch {
        throw new ElicitError("unknown", "completion was not valid JSON")
      }

      const out = zElicitResponse.safeParse(json)
      if (!out.success) throw new ElicitError("unknown", "completion did not match ElicitResponse")
      return out.data
    },
  }
}

/** Default provider (reads the BYOK key + global fetch) implementing the frozen seam fn. */
export function elicit(req: ElicitRequest): Promise<ElicitResponse> {
  return createClaudeProvider().elicit(req)
}
