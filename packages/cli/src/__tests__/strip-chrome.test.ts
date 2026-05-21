import { describe, expect, it } from "vitest"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import {
  DEFAULT_STRIP_SELECTORS,
  resolveStripSelectors,
  stripDocumentaryChrome,
} from "../commands/sandbox/strip-chrome.js"

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE_HTML = readFileSync(
  join(HERE, "fixtures", "prototype-with-chrome", "screen-1-list.html"),
  "utf-8"
)

describe("stripDocumentaryChrome", () => {
  it("returns the input unchanged when the selector list is empty", () => {
    expect(stripDocumentaryChrome(FIXTURE_HTML, [])).toBe(FIXTURE_HTML)
  })

  it("strips every default chrome variant from the fixture", () => {
    const out = stripDocumentaryChrome(FIXTURE_HTML, DEFAULT_STRIP_SELECTORS)
    expect(out).not.toContain("proto-nav")
    expect(out).not.toContain("state-section__header")
    expect(out).not.toContain("state-callout")
    expect(out).not.toContain("data-documentary-chrome")
    expect(out).not.toContain("background: mint")
    // Real content survives.
    expect(out).toContain("List screen prototype body")
    expect(out).toContain("content-keep")
    expect(out).toContain("custom-chip")
  })

  it("removes element through its matching closing tag (including nested children)", () => {
    const html = `<div class="state-callout"><p>nested <span>deep</span></p></div><div class="keep">x</div>`
    const out = stripDocumentaryChrome(html, [".state-callout"])
    expect(out).toBe(`<div class="keep">x</div>`)
  })

  it("matches attribute-substring selectors", () => {
    const html = `<span style="background: mint; color: white;">chip</span><span style="background: blue;">keep</span>`
    const out = stripDocumentaryChrome(html, ['[style*="mint"]'])
    expect(out).not.toContain("mint")
    expect(out).toContain("blue")
  })

  it("matches attribute-presence selectors", () => {
    const html = `<div data-documentary-chrome>x</div><div>y</div>`
    const out = stripDocumentaryChrome(html, ["[data-documentary-chrome]"])
    expect(out).toBe(`<div>y</div>`)
  })

  it("does not match a class that is a substring of another class token", () => {
    const html = `<div class="state-callout-real">keep</div>`
    const out = stripDocumentaryChrome(html, [".state-callout"])
    expect(out).toContain("state-callout-real")
  })

  it("handles self-closing void elements (img, br)", () => {
    const html = `<img class="proto-nav" src="x.png"><p>keep</p>`
    const out = stripDocumentaryChrome(html, [".proto-nav"])
    expect(out).not.toContain("proto-nav")
    expect(out).toContain("<p>keep</p>")
  })
})

describe("resolveStripSelectors", () => {
  it("returns [] when stripChrome is not set", () => {
    expect(resolveStripSelectors(undefined)).toEqual([])
    expect(resolveStripSelectors(false)).toEqual([])
  })

  it("returns defaults when stripChrome is true (bare flag)", () => {
    expect(resolveStripSelectors(true)).toEqual(DEFAULT_STRIP_SELECTORS)
  })

  it("returns defaults when stripChrome is an empty string", () => {
    expect(resolveStripSelectors("")).toEqual(DEFAULT_STRIP_SELECTORS)
  })

  it("REPLACES defaults when stripChrome is a comma list", () => {
    expect(resolveStripSelectors(".a, .b")).toEqual([".a", ".b"])
  })

  it("MERGES additional with defaults when stripChrome is true", () => {
    expect(resolveStripSelectors(true, ".x, .y")).toEqual([
      ...DEFAULT_STRIP_SELECTORS,
      ".x",
      ".y",
    ])
  })

  it("MERGES additional with the replacement when stripChrome is a comma list", () => {
    expect(resolveStripSelectors(".a", ".b")).toEqual([".a", ".b"])
  })

  it("treats --strip-chrome-additional alone as defaults plus extras (forgiving)", () => {
    expect(resolveStripSelectors(undefined, ".x")).toEqual([
      ...DEFAULT_STRIP_SELECTORS,
      ".x",
    ])
  })

  it("drops empty / whitespace-only entries", () => {
    expect(resolveStripSelectors(" .a , , .b ,")).toEqual([".a", ".b"])
  })
})
