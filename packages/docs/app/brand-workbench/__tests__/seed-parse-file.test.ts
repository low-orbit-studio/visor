// @vitest-environment node
// VI-594 — seed file parser: real PDF.js extraction from a fixture, text/markdown passthrough, MIME
// dispatch + failures. Runs under the node env so the PDF.js legacy build extracts on the main thread.

import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import path from "node:path"
import { parseSeedFile } from "../lib/seed-parse-file"

// Threads pool: read the fixture via a cwd-relative path (vitest runs from the repo root), not
// import.meta.url (which isn't a file:// URL under the threads pool).
const FIXTURE = path.join(
  process.cwd(),
  "packages/docs/app/brand-workbench/__tests__/fixtures/seed-sample.pdf",
)

function fileFrom(bytes: Uint8Array | string, name: string, type: string): File {
  return new File([bytes], name, { type })
}

describe("parseSeedFile — PDF (real PDF.js)", () => {
  it("extracts the text layer from a fixture PDF", async () => {
    const bytes = new Uint8Array(readFileSync(FIXTURE))
    const res = await parseSeedFile(fileFrom(bytes, "deck.pdf", "application/pdf"))
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.source).toBe("file")
      expect(res.text).toContain("Visor seed fixture text")
    }
  })

  it("a non-PDF given a .pdf name/type → unparseable", async () => {
    const res = await parseSeedFile(fileFrom("not a pdf at all", "fake.pdf", "application/pdf"))
    expect(res).toMatchObject({ ok: false, failure: "unparseable" })
  })

  it("uses an injected PDF extractor when provided (no PDF.js boot)", async () => {
    const res = await parseSeedFile(fileFrom(new Uint8Array([1, 2, 3]), "x.pdf", "application/pdf"), {
      pdfExtractor: async () => "injected text",
    })
    expect(res).toEqual({ ok: true, text: "injected text", source: "file" })
  })

  it("an empty PDF text layer → extraction-empty", async () => {
    const res = await parseSeedFile(fileFrom(new Uint8Array([1]), "x.pdf", "application/pdf"), {
      pdfExtractor: async () => "   ",
    })
    expect(res).toMatchObject({ ok: false, failure: "extraction-empty" })
  })
})

describe("parseSeedFile — text / markdown passthrough + dispatch", () => {
  it("reads a text/plain file", async () => {
    const res = await parseSeedFile(fileFrom("plain notes", "notes.txt", "text/plain"))
    expect(res).toEqual({ ok: true, text: "plain notes", source: "file" })
  })

  it("reads a markdown file by extension (no MIME type)", async () => {
    const res = await parseSeedFile(fileFrom("# Brand\nnotes", "brand.md", ""))
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.text).toContain("# Brand")
  })

  it("an empty text file → extraction-empty", async () => {
    const res = await parseSeedFile(fileFrom("   ", "empty.txt", "text/plain"))
    expect(res).toMatchObject({ ok: false, failure: "extraction-empty" })
  })

  it("an unsupported binary type → unparseable", async () => {
    const res = await parseSeedFile(fileFrom(new Uint8Array([0, 1, 2]), "logo.png", "image/png"))
    expect(res).toMatchObject({ ok: false, failure: "unparseable" })
  })
})
