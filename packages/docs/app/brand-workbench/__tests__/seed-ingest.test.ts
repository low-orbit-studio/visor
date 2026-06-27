// VI-594 — seed dispatcher: paste / URL / file each route to the right extractor; classification.

import { describe, it, expect } from "vitest"
import {
  extractSeedText,
  classifyTextInput,
  looksLikeUrl,
  type SeedInput,
} from "../lib/seed-ingest"

describe("looksLikeUrl / classifyTextInput", () => {
  it("treats an explicit scheme or bare domain as a URL", () => {
    expect(looksLikeUrl("https://visor.design")).toBe(true)
    expect(looksLikeUrl("visor.design/brand")).toBe(true)
  })
  it("treats prose (whitespace / no TLD) as paste", () => {
    expect(looksLikeUrl("a design system you copy and own")).toBe(false)
    expect(looksLikeUrl("visor")).toBe(false)
  })
  it("classifies the single text field accordingly", () => {
    expect(classifyTextInput(" visor.design ")).toEqual({ kind: "url", url: "visor.design" })
    expect(classifyTextInput("raw notes here")).toEqual({ kind: "paste", text: "raw notes here" })
  })
})

describe("extractSeedText — routing", () => {
  it("paste → passthrough text (source paste)", async () => {
    const res = await extractSeedText({ kind: "paste", text: "  some brand notes  " })
    expect(res).toEqual({ ok: true, text: "some brand notes", source: "paste" })
  })

  it("empty paste → extraction-empty", async () => {
    const res = await extractSeedText({ kind: "paste", text: "   " })
    expect(res).toMatchObject({ ok: false, failure: "extraction-empty" })
  })

  it("url → the URL fetcher (uses the injected fetch)", async () => {
    let hitUrl: string | undefined
    const res = await extractSeedText(
      { kind: "url", url: "visor.design" },
      {
        fetchImpl: (async (url: string) => {
          hitUrl = url
          return new Response("<h1>Seeded</h1>", { status: 200 })
        }) as unknown as typeof fetch,
      },
    )
    expect(hitUrl).toBe("https://visor.design/")
    expect(res).toEqual({ ok: true, text: "Seeded", source: "url" })
  })

  it("file → the file parser (uses the injected PDF extractor)", async () => {
    const input: SeedInput = {
      kind: "file",
      file: new File([new Uint8Array([1])], "deck.pdf", { type: "application/pdf" }),
    }
    const res = await extractSeedText(input, { pdfExtractor: async () => "from the deck" })
    expect(res).toEqual({ ok: true, text: "from the deck", source: "file" })
  })
})
