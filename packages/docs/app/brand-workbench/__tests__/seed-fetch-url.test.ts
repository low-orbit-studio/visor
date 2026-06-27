// VI-594 — seed URL fetch: normalize, HTML→text, AbortSignal, CORS/HTTP failure mapping.

import { describe, it, expect } from "vitest"
import { fetchSeedUrl, normalizeUrl, htmlToText } from "../lib/seed-fetch-url"

/** A fetch stub returning one canned HTML body. */
function fetchHtml(html: string, status = 200): typeof fetch {
  return (async () =>
    new Response(html, { status, headers: { "content-type": "text/html" } })) as unknown as typeof fetch
}

describe("normalizeUrl", () => {
  it("accepts an explicit http(s) URL", () => {
    expect(normalizeUrl("https://visor.design/x")?.toString()).toBe("https://visor.design/x")
  })
  it("defaults a bare domain to https", () => {
    expect(normalizeUrl("visor.design")?.toString()).toBe("https://visor.design/")
  })
  it("rejects a non-http scheme", () => {
    expect(normalizeUrl("ftp://visor.design")).toBeNull()
  })
  it("rejects a malformed URL", () => {
    expect(normalizeUrl("https://")).toBeNull()
    expect(normalizeUrl("   ")).toBeNull()
  })
})

describe("htmlToText", () => {
  it("strips tags, scripts, and styles", () => {
    const html =
      "<html><head><style>.x{color:red}</style></head><body><script>evil()</script><h1>Visor</h1><p>copy &amp; own</p></body></html>"
    const text = htmlToText(html)
    expect(text).toContain("Visor")
    expect(text).toContain("copy & own")
    expect(text).not.toContain("evil")
    expect(text).not.toContain("color:red")
    expect(text).not.toMatch(/[<>]/)
  })

  it("decodes numeric quote/apostrophe entities to the right characters", () => {
    expect(htmlToText("<p>say &#34;hi&#34; it&#39;s fine</p>")).toBe(`say "hi" it's fine`)
  })
})

describe("fetchSeedUrl — routing + extraction", () => {
  it("extracts text from an HTML body", async () => {
    const res = await fetchSeedUrl("https://visor.design", {
      fetchImpl: fetchHtml("<h1>Compile your brand</h1>"),
    })
    expect(res).toEqual({ ok: true, text: "Compile your brand", source: "url" })
  })

  it("a malformed URL → bad-url (no fetch attempted)", async () => {
    let called = false
    const res = await fetchSeedUrl("https://", {
      fetchImpl: (async () => {
        called = true
        return new Response("x")
      }) as unknown as typeof fetch,
    })
    expect(res).toMatchObject({ ok: false, failure: "bad-url" })
    expect(called).toBe(false)
  })

  it("an empty-text body → extraction-empty", async () => {
    const res = await fetchSeedUrl("https://visor.design", {
      fetchImpl: fetchHtml("<html><body><script>x()</script></body></html>"),
    })
    expect(res).toMatchObject({ ok: false, failure: "extraction-empty" })
  })
})

describe("fetchSeedUrl — failure mapping", () => {
  it("a 4xx response → fetch-failed", async () => {
    const res = await fetchSeedUrl("https://visor.design", { fetchImpl: fetchHtml("nope", 404) })
    expect(res).toMatchObject({ ok: false, failure: "fetch-failed", detail: "HTTP 404" })
  })

  it("a 5xx response → fetch-failed", async () => {
    const res = await fetchSeedUrl("https://visor.design", { fetchImpl: fetchHtml("boom", 500) })
    expect(res).toMatchObject({ ok: false, failure: "fetch-failed", detail: "HTTP 500" })
  })

  it("a TypeError (cross-origin block) → cors-blocked", async () => {
    const res = await fetchSeedUrl("https://other.example", {
      fetchImpl: (async () => {
        throw new TypeError("Failed to fetch")
      }) as unknown as typeof fetch,
    })
    expect(res).toMatchObject({ ok: false, failure: "cors-blocked" })
  })

  it("honors an AbortSignal — an already-aborted signal aborts the fetch", async () => {
    const controller = new AbortController()
    controller.abort()
    let sawAborted: boolean | undefined
    const res = await fetchSeedUrl("https://visor.design", {
      signal: controller.signal,
      fetchImpl: (async (_url: string, init: RequestInit) => {
        sawAborted = init.signal?.aborted
        throw new DOMException("aborted", "AbortError")
      }) as unknown as typeof fetch,
    })
    expect(sawAborted).toBe(true)
    expect(res).toMatchObject({ ok: false, failure: "fetch-failed" })
  })
})
