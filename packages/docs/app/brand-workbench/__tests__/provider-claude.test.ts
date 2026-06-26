// VI-562 — Claude provider seam: success / error / rate-limit / refusal / parse handling.

import { describe, it, expect } from "vitest"
import { createClaudeProvider } from "../lib/provider-claude"
import type { ElicitRequest, ElicitResponse } from "../../../../../spec/contracts"

const REQ: ElicitRequest = {
  requestId: "11111111-1111-4111-8111-111111111111",
  step: "positioning",
  record: {},
  userMessage: "Visor is a design system you copy and own.",
  model: "claude-opus-4-8",
}

/** A fetch stub that returns one canned Anthropic Messages response. */
function fetchOk(elicit: ElicitResponse, stopReason = "end_turn"): typeof fetch {
  const body = { content: [{ type: "text", text: JSON.stringify(elicit) }], stop_reason: stopReason }
  return (async () => new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
}

/** A fetch stub that returns a raw status (non-OK). */
function fetchStatus(status: number): typeof fetch {
  return (async () => new Response("{}", { status })) as unknown as typeof fetch
}

function provider(fetchImpl: typeof fetch) {
  return createClaudeProvider({ apiKey: "sk-ant-test", fetchImpl })
}

describe("provider-claude — success", () => {
  it("parses a text reply into ElicitResponse", async () => {
    const p = provider(fetchOk({ kind: "text", content: "Tell me more." }))
    await expect(p.elicit(REQ)).resolves.toEqual({ kind: "text", content: "Tell me more." })
  })

  it("parses a section-complete reply with a record patch", async () => {
    const resp: ElicitResponse = {
      kind: "section-complete",
      patch: { essence: ["coherent", "open", "yours"] },
    }
    const p = provider(fetchOk(resp))
    await expect(p.elicit(REQ)).resolves.toEqual(resp)
  })

  it("strips an accidental ```json fence before parsing", async () => {
    const body = {
      content: [{ type: "text", text: '```json\n{"kind":"text","content":"fenced"}\n```' }],
      stop_reason: "end_turn",
    }
    const fetchImpl = (async () =>
      new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
    await expect(provider(fetchImpl).elicit(REQ)).resolves.toEqual({
      kind: "text",
      content: "fenced",
    })
  })
})

describe("provider-claude — failures reject with an AiFailure", () => {
  it("401 → invalid-key", async () => {
    await expect(provider(fetchStatus(401)).elicit(REQ)).rejects.toMatchObject({
      failure: "invalid-key",
    })
  })

  it("403 → provider-auth-failed", async () => {
    await expect(provider(fetchStatus(403)).elicit(REQ)).rejects.toMatchObject({
      failure: "provider-auth-failed",
    })
  })

  it("429 → rate-limited", async () => {
    await expect(provider(fetchStatus(429)).elicit(REQ)).rejects.toMatchObject({
      failure: "rate-limited",
    })
  })

  it("500 → unknown (no finer bucket in the closed enum)", async () => {
    await expect(provider(fetchStatus(500)).elicit(REQ)).rejects.toMatchObject({
      failure: "unknown",
    })
  })

  it("network throw → network-error", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("Failed to fetch")
    }) as unknown as typeof fetch
    await expect(provider(fetchImpl).elicit(REQ)).rejects.toMatchObject({ failure: "network-error" })
  })

  it("AbortError → timeout", async () => {
    const fetchImpl = (async () => {
      throw new DOMException("aborted", "AbortError")
    }) as unknown as typeof fetch
    await expect(provider(fetchImpl).elicit(REQ)).rejects.toMatchObject({ failure: "timeout" })
  })

  it("stop_reason refusal → content-filtered", async () => {
    const p = provider(fetchOk({ kind: "text", content: "x" }, "refusal"))
    await expect(p.elicit(REQ)).rejects.toMatchObject({ failure: "content-filtered" })
  })

  it("no key configured → invalid-key", async () => {
    const p = createClaudeProvider({ apiKey: null, fetchImpl: fetchStatus(200) })
    await expect(p.elicit(REQ)).rejects.toMatchObject({ failure: "invalid-key" })
  })

  it("non-JSON completion → unknown", async () => {
    const body = { content: [{ type: "text", text: "not json at all" }], stop_reason: "end_turn" }
    const fetchImpl = (async () =>
      new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
    await expect(provider(fetchImpl).elicit(REQ)).rejects.toMatchObject({ failure: "unknown" })
  })

  it("completion that doesn't match ElicitResponse → unknown", async () => {
    const body = { content: [{ type: "text", text: '{"kind":"bogus"}' }], stop_reason: "end_turn" }
    const fetchImpl = (async () =>
      new Response(JSON.stringify(body), { status: 200 })) as unknown as typeof fetch
    await expect(provider(fetchImpl).elicit(REQ)).rejects.toMatchObject({ failure: "unknown" })
  })
})
