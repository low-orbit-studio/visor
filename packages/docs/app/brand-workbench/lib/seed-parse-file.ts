// Seed file parser (VI-594, UJ-F).
//
// MIME/extension dispatch for a dropped file → plain text. PDFs go through PDF.js (browser-native,
// no server); text/markdown pass straight through. Everything runs in the browser (local-first).
// Failures map to the LOCAL seed taxonomy (seed-ingest.ts). The PDF extractor is injectable so the
// dispatcher is unit-testable without booting the full PDF.js stack.

import type { SeedError, SeedText } from "./seed-ingest"

/** Turns raw PDF bytes into its concatenated text layer. */
export type PdfExtractor = (data: ArrayBuffer) => Promise<string>

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name)
}

function isText(file: File): boolean {
  return file.type.startsWith("text/") || /\.(txt|md|markdown|mdx|csv|json)$/i.test(file.name)
}

/**
 * Default PDF text extractor — PDF.js legacy build, main-thread (no separate worker file to bundle,
 * which keeps Turbopack happy and works headless in tests). Reads the text layer only (no canvas
 * render), so it is light enough for a one-shot seed parse.
 */
export const defaultPdfExtractor: PdfExtractor = async (data) => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const task = pdfjs.getDocument({
    data: new Uint8Array(data),
    useWorkerFetch: false,
  })
  const doc = await task.promise
  const pages: string[] = []
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n)
    const content = await page.getTextContent()
    pages.push(
      content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
    )
  }
  await task.destroy()
  return pages.join("\n").replace(/\s+/g, " ").trim()
}

export interface ParseFileOptions {
  pdfExtractor?: PdfExtractor
}

/** Parse a dropped file to plain text, or return a typed seed failure. */
export async function parseSeedFile(
  file: File,
  options: ParseFileOptions = {},
): Promise<SeedText | SeedError> {
  if (isPdf(file)) {
    let text: string
    try {
      const data = await file.arrayBuffer()
      text = await (options.pdfExtractor ?? defaultPdfExtractor)(data)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      return { ok: false, failure: "unparseable", detail: `PDF parse failed: ${detail.slice(0, 120)}` }
    }
    if (!text.trim()) {
      return { ok: false, failure: "extraction-empty", detail: "no text layer in that PDF" }
    }
    return { ok: true, text: text.trim(), source: "file" }
  }

  if (isText(file)) {
    const text = (await file.text()).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "").trim()
    if (!text) return { ok: false, failure: "extraction-empty", detail: "that file is empty" }
    return { ok: true, text, source: "file" }
  }

  return {
    ok: false,
    failure: "unparseable",
    detail: `unsupported file type: ${file.type || file.name || "unknown"}`,
  }
}
