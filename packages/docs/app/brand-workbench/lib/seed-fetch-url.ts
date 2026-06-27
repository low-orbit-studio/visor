// Seed URL fetch + HTML→text extraction (VI-594, UJ-F).
//
// Browser-side fetch of a seed URL → plain text. No server hop (local-first). Failures map to the
// LOCAL seed taxonomy (seed-ingest.ts), never the frozen `zAiFailure`. Honors an external AbortSignal
// and a request timeout. Cross-origin browser fetches of an arbitrary third-party site usually throw
// a `TypeError` (no CORS headers) — surfaced as `cors-blocked`; an HTTP error response is `fetch-failed`.

import type { SeedError, SeedText } from "./seed-ingest"

/** Default per-request timeout — seed pages should respond fast; a slow one is not worth blocking on. */
const FETCH_TIMEOUT_MS = 15_000

export interface FetchUrlOptions {
  fetchImpl?: typeof fetch
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Normalize a user-entered URL: default the scheme to `https://` when omitted, require http(s), and
 * require a host. Returns null for anything malformed (→ `bad-url`).
 */
export function normalizeUrl(raw: string): URL | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Only default the scheme when NONE is present; a different scheme (e.g. ftp://) must be rejected,
  // not silently re-hosted under https.
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
  const candidate = hasScheme ? trimmed : `https://${trimmed}`
  try {
    const url = new URL(candidate)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    if (!url.hostname) return null
    return url
  } catch {
    return null
  }
}

/** Strip scripts/styles/comments/tags + decode the common entities → collapsed plain text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/** Fetch a seed URL and extract readable text, or return a typed seed failure. */
export async function fetchSeedUrl(
  raw: string,
  options: FetchUrlOptions = {},
): Promise<SeedText | SeedError> {
  const url = normalizeUrl(raw)
  if (!url) {
    return { ok: false, failure: "bad-url", detail: `not a valid URL: ${raw.trim().slice(0, 80)}` }
  }

  const fetchImpl = options.fetchImpl ?? fetch
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? FETCH_TIMEOUT_MS)
  if (options.signal) {
    if (options.signal.aborted) controller.abort()
    else options.signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  let res: Response
  try {
    res = await fetchImpl(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: { accept: "text/html,application/xhtml+xml,text/plain" },
    })
  } catch (err) {
    // A browser cross-origin block and a DNS/network failure both surface as TypeError; an aborted
    // request (external abort or our timeout) is an AbortError. Map each to the closest seed failure.
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, failure: "fetch-failed", detail: "request aborted or timed out" }
    }
    if (err instanceof TypeError) {
      return { ok: false, failure: "cors-blocked", detail: err.message || "cross-origin fetch blocked" }
    }
    return { ok: false, failure: "fetch-failed", detail: err instanceof Error ? err.message : String(err) }
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    return { ok: false, failure: "fetch-failed", detail: `HTTP ${res.status}` }
  }

  let body: string
  try {
    body = await res.text()
  } catch {
    return { ok: false, failure: "fetch-failed", detail: "could not read response body" }
  }

  const text = htmlToText(body)
  if (!text) {
    return { ok: false, failure: "extraction-empty", detail: "no readable text at that URL" }
  }
  return { ok: true, text, source: "url" }
}
