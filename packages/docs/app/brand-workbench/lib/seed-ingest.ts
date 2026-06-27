// Seed ingestion dispatcher (VI-594, UJ-F steps 3–4).
//
// Routes a seed input (paste / URL / file) to the right extractor and returns extracted text — or a
// typed ingestion failure. The failure taxonomy is LOCAL (D4): it is deliberately NOT the frozen
// `zAiFailure` (spec/contracts.ts), which is a closed enum for AI-provider faults. These cover the
// ingest pipeline (bad URL, CORS, unparseable file, empty extraction, failed proposal). Everything
// runs in the browser — no server hop (BUILD-HANDOFF D-9/D-10, local-first).

import { fetchSeedUrl } from "./seed-fetch-url"
import { parseSeedFile, type PdfExtractor } from "./seed-parse-file"

/** The seed-ingestion failure taxonomy (D4). Separate from the frozen AI `zAiFailure` enum. */
export type SeedFailure =
  | "bad-url"
  | "fetch-failed"
  | "cors-blocked"
  | "unparseable"
  | "extraction-empty"
  | "proposal-failed"

/** Which modality produced the extracted text. */
export type SeedSource = "url" | "paste" | "file"

export interface SeedText {
  ok: true
  text: string
  source: SeedSource
}
export interface SeedError {
  ok: false
  failure: SeedFailure
  /** Human-readable detail for the UI (the real reason), beside the closed-enum `failure`. */
  detail?: string
}
export type SeedExtract = SeedText | SeedError

/** One of the three ingestion modalities (D1). */
export type SeedInput =
  | { kind: "url"; url: string }
  | { kind: "paste"; text: string }
  | { kind: "file"; file: File }

/**
 * http(s) URL heuristic for the single seed text field: an explicit scheme, or a bare `domain.tld`
 * (optionally with a path). Whitespace means it's pasted prose, not a URL.
 */
export function looksLikeUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s || /\s/.test(s)) return false
  if (/^https?:\/\//i.test(s)) return true
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(s)
}

/** Classify the single seed text field into a URL or a paste input (the Start view's text affordance). */
export function classifyTextInput(
  raw: string,
): { kind: "url"; url: string } | { kind: "paste"; text: string } {
  return looksLikeUrl(raw) ? { kind: "url", url: raw.trim() } : { kind: "paste", text: raw }
}

/** Generous upper bound on pasted text — keeps a runaway paste from ballooning the proposal prompt. */
const MAX_PASTE = 200_000

/** Extraction dependencies — injectable so the dispatcher + extractors are unit-testable. */
export interface SeedIngestDeps {
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  pdfExtractor?: PdfExtractor
}

/** Route a seed input to its extractor → plain text (or a typed failure). */
export async function extractSeedText(
  input: SeedInput,
  deps: SeedIngestDeps = {},
): Promise<SeedExtract> {
  switch (input.kind) {
    case "url":
      return fetchSeedUrl(input.url, { fetchImpl: deps.fetchImpl, signal: deps.signal })
    case "file":
      return parseSeedFile(input.file, { pdfExtractor: deps.pdfExtractor })
    case "paste": {
      const text = input.text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").trim().slice(0, MAX_PASTE)
      if (!text) return { ok: false, failure: "extraction-empty", detail: "nothing to ingest" }
      return { ok: true, text, source: "paste" }
    }
  }
}
