// VI-594 — seed → first-draft proposal: validates to zDraftBrandRecord; faults collapse to
// proposal-failed; keyless fails fast.

import { describe, it, expect } from "vitest"
import { proposeDraftFromText } from "../lib/seed-propose-draft"

const KEY = "sk-ant-test"
const POSITIONING = {
  onliness: "The only design system you compile from typed intent.",
  category: "brand + design system substrate",
  differentiation: "one portable file for humans and agents",
}

/** A fetch stub returning one canned Anthropic Messages response carrying `text` as the body. */
function fetchText(text: string, status = 200): typeof fetch {
  const body = { content: [{ type: "text", text }], stop_reason: "end_turn" }
  return (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
}

describe("proposeDraftFromText — success", () => {
  it("returns a parseable DraftBrandRecord proposal", async () => {
    const res = await proposeDraftFromText("Visor source material", {
      apiKey: KEY,
      fetchImpl: fetchText(JSON.stringify({ positioning: POSITIONING })),
    })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.record.positioning).toEqual(POSITIONING)
  })

  it("accepts an optional essence array", async () => {
    const res = await proposeDraftFromText("source", {
      apiKey: KEY,
      fetchImpl: fetchText(
        JSON.stringify({ positioning: POSITIONING, essence: ["coherent", "open", "yours"] }),
      ),
    })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.record.essence).toEqual(["coherent", "open", "yours"])
  })

  it("strips a ```json fence before parsing", async () => {
    const res = await proposeDraftFromText("source", {
      apiKey: KEY,
      fetchImpl: fetchText("```json\n" + JSON.stringify({ positioning: POSITIONING }) + "\n```"),
    })
    expect(res.ok).toBe(true)
  })
})

describe("proposeDraftFromText — failures collapse to proposal-failed", () => {
  it("keyless → proposal-failed (no provider call)", async () => {
    let called = false
    const res = await proposeDraftFromText("source", {
      apiKey: null,
      fetchImpl: (async () => {
        called = true
        return new Response("{}")
      }) as unknown as typeof fetch,
    })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed" })
    expect(called).toBe(false)
  })

  it("empty seed text → proposal-failed", async () => {
    const res = await proposeDraftFromText("   ", { apiKey: KEY, fetchImpl: fetchText("{}") })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed" })
  })

  it("HTTP error → proposal-failed", async () => {
    const res = await proposeDraftFromText("source", { apiKey: KEY, fetchImpl: fetchText("{}", 429) })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed", detail: "HTTP 429" })
  })

  it("non-JSON completion → proposal-failed", async () => {
    const res = await proposeDraftFromText("source", {
      apiKey: KEY,
      fetchImpl: fetchText("totally not json"),
    })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed" })
  })

  it("a shape that fails zDraftBrandRecord → proposal-failed", async () => {
    const res = await proposeDraftFromText("source", {
      apiKey: KEY,
      fetchImpl: fetchText(JSON.stringify({ positioning: { onliness: 42 } })),
    })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed" })
  })

  it("a valid-but-positioningless proposal → proposal-failed", async () => {
    const res = await proposeDraftFromText("source", {
      apiKey: KEY,
      fetchImpl: fetchText(JSON.stringify({ essence: ["a", "b"] })),
    })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed" })
  })

  it("a network throw → proposal-failed", async () => {
    const res = await proposeDraftFromText("source", {
      apiKey: KEY,
      fetchImpl: (async () => {
        throw new TypeError("Failed to fetch")
      }) as unknown as typeof fetch,
    })
    expect(res).toMatchObject({ ok: false, failure: "proposal-failed" })
  })
})
