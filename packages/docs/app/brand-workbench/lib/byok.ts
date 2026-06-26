// BYOK key management — local-first, per-browser, opt-in (VI-562, D1/D9).
//
// The API key lives in `localStorage` only; there is no server roundtrip. Keyless is the default and
// a fully functional manual tool — a key only unlocks the AI turbo path (R-KEYLESS). This module is
// the single source of truth for: key storage, the offered model list (D5), and the per-call cost
// estimate shown in the BYOK surface. Pure + SSR-safe (every localStorage access is window-guarded).

import type { KeyStatus } from "../../../../../spec/state-machine"

/** localStorage slot for the BYOK Anthropic key (per-browser, opt-in). */
export const BYOK_KEY_STORAGE = "visor-bw-anthropic-key"
/** localStorage slot for the chosen model id (defaults to DEFAULT_MODEL when unset). */
export const BYOK_MODEL_STORAGE = "visor-bw-model"

/** An offered Claude model + its public per-million-token rates (USD), for the cost estimate. */
export interface ModelOption {
  id: string
  label: string
  /** USD per 1M input tokens. */
  inputPerMTok: number
  /** USD per 1M output tokens. */
  outputPerMTok: number
}

/**
 * Offered models (D5: Claude-first, "per global doc model freshness"). The frozen contracts.ts
 * example pins `claude-opus-4-8`; the current Opus/Sonnet pair supersedes the 4.7 ids named when the
 * decision was written. Rates are the published platform prices.
 */
export const MODELS: readonly ModelOption[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", inputPerMTok: 5, outputPerMTok: 25 },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", inputPerMTok: 3, outputPerMTok: 15 },
] as const

/** Default model — the most capable Opus tier (D5). */
export const DEFAULT_MODEL = MODELS[0].id

/** True when running in a browser with localStorage available (SSR + private-mode safe). */
function canStore(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage
  } catch {
    return false
  }
}

/** The stored API key, or null when absent/empty/unavailable. Whitespace-only counts as absent. */
export function getApiKey(): string | null {
  if (!canStore()) return null
  const raw = window.localStorage.getItem(BYOK_KEY_STORAGE)
  const trimmed = raw?.trim()
  return trimmed ? trimmed : null
}

/** Store the API key. An empty/whitespace value clears it (never persists a blank key). */
export function setApiKey(key: string): void {
  if (!canStore()) return
  const trimmed = key.trim()
  if (trimmed) window.localStorage.setItem(BYOK_KEY_STORAGE, trimmed)
  else window.localStorage.removeItem(BYOK_KEY_STORAGE)
}

/** Remove the stored API key (drops the workbench back to keyless). */
export function clearApiKey(): void {
  if (!canStore()) return
  window.localStorage.removeItem(BYOK_KEY_STORAGE)
}

/** Whether a usable key is present. */
export function hasKey(): boolean {
  return getApiKey() !== null
}

/** Resolve the BYOK status (R-KEYLESS gate): a present key → `key-active`, otherwise `keyless`. */
export function getKeyStatus(): KeyStatus {
  return hasKey() ? "key-active" : "keyless"
}

/** The chosen model id, falling back to DEFAULT_MODEL when unset or unknown. */
export function getModel(): string {
  if (!canStore()) return DEFAULT_MODEL
  const stored = window.localStorage.getItem(BYOK_MODEL_STORAGE)
  return stored && MODELS.some((m) => m.id === stored) ? stored : DEFAULT_MODEL
}

/** Persist the chosen model id (ignored if it isn't an offered model). */
export function setModel(id: string): void {
  if (!canStore()) return
  if (MODELS.some((m) => m.id === id)) window.localStorage.setItem(BYOK_MODEL_STORAGE, id)
}

/** Look up an offered model's rate card by id (null when not offered). */
export function modelOption(id: string): ModelOption | null {
  return MODELS.find((m) => m.id === id) ?? null
}

/**
 * Estimated USD cost of one call at the model's published rates: input + output tokens, priced per
 * million. Refreshed per call by the BYOK surface (D5). Unknown models price at 0.
 */
export function estimateCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const m = modelOption(modelId)
  if (!m) return 0
  return (inputTokens / 1_000_000) * m.inputPerMTok + (outputTokens / 1_000_000) * m.outputPerMTok
}

/** Human-facing cost string. Sub-cent estimates render at 4 dp; larger ones at 2 dp. */
export function formatCost(usd: number): string {
  if (usd > 0 && usd < 0.01) return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}
