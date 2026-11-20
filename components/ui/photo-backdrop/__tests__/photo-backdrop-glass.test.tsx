/**
 * PhotoBackdrop turns the glass layer on, in a real browser (VI-811).
 *
 * Loads visor-core's built tokens.css (whose glass switch also matches a container
 * holding a PhotoBackdrop), PhotoBackdrop's CSS and the docs glass recipe, then reads
 * computed styles in Chromium: a card next to a PhotoBackdrop is glass; a card with
 * none, or next to one that rendered nothing, is solid with no backdrop-filter anywhere.
 * Self-skips where playwright's Chromium is not installed (see the runs-in-Chromium test).
 */

import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { PhotoBackdrop } from "../photo-backdrop"

const ROOT = process.cwd()
const TOKENS = readFileSync(join(ROOT, "packages/tokens/dist/tokens.css"), "utf-8")
const CSS = readFileSync(join(ROOT, "components/ui/photo-backdrop/photo-backdrop.module.css"), "utf-8")
const RECIPE = readFileSync(join(ROOT, "packages/docs/components/looks/glass-specimen.module.css"), "utf-8")

const backdrop = (current: string | null) =>
  renderToStaticMarkup(
    <PhotoBackdrop backgrounds={{ night: { kind: "solid", color: "rgb(20, 30, 60)" } }} current={current} />
  )

const card = (id: string) => `
  <div class="panel" id="${id}">
    <span class="glass"></span><span class="edge"></span>
    <div class="content"><h3 class="title">T</h3><button class="control">Go</button></div>
  </div>`

const stage = (id: string, inner: string) => `<section id="${id}" style="position: relative; height: 200px">${inner}</section>`

const HTML = `<!doctype html><html><head><style>${TOKENS}</style><style>${CSS}</style><style>${RECIPE}</style></head><body>
  ${stage("plain", card("solid"))}
  ${stage("photo", backdrop("night") + card("glassy"))}
  ${stage("empty", backdrop(null) + card("none"))}
  ${stage("opt-out", backdrop("night") + `<div data-glass="off">${card("reset")}</div>`)}
</body></html>`

interface Page {
  setContent(html: string): Promise<void>
  evaluate<T>(fn: string): Promise<T>
}
let browser: { newPage(): Promise<Page>; close(): Promise<void> } | null = null
let page: Page

beforeAll(async () => {
  try {
    const { chromium } = await import("playwright")
    browser = (await chromium.launch()) as unknown as typeof browser
  } catch {
    browser = null
    return
  }
  page = await browser!.newPage()
  await page.setContent(HTML)
})
afterAll(async () => {
  await browser?.close()
})

async function read(id: string) {
  return page.evaluate<Record<string, string>>(`(() => {
    const q = (s) => getComputedStyle(document.querySelector("#${id} " + s));
    return {
      hostBg: getComputedStyle(document.getElementById("${id}")).backgroundColor,
      glassDisplay: q(".glass").display,
      glassFilter: q(".glass").backdropFilter,
      controlFilter: q(".control").backdropFilter,
    };
  })()`)
}

/** Every element (and pseudo-element) in a stage with a backdrop-filter. */
async function blurred(stageId: string) {
  return page.evaluate<string[]>(`(() => {
    const out = [];
    const scope = document.getElementById("${stageId}");
    for (const el of [scope, ...scope.querySelectorAll("*")]) {
      for (const pseudo of [null, "::before", "::after"]) {
        const v = getComputedStyle(el, pseudo).backdropFilter;
        if (v !== "none" && v !== "") out.push(el.className + (pseudo ?? "") + "=" + v);
      }
    }
    return out;
  })()`)
}

describe("VI-811 PhotoBackdrop turns glass on (real browser)", () => {
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(browser, "playwright's chromium is not installed").not.toBeNull()
  })

  it("renders a backdrop for a background and nothing for none", () => {
    expect(backdrop("night")).toContain('data-slot="photo-backdrop"')
    expect(backdrop(null)).toBe("")
  })

  it("a card next to a PhotoBackdrop is glass", async () => {
    if (!browser) return
    const r = await read("glassy")
    expect(r.hostBg).toBe("rgba(0, 0, 0, 0)")
    expect(r.glassDisplay).toBe("block")
    expect(r.glassFilter).toContain("blur(32px)")
    expect(r.controlFilter).toContain("blur(16px)")
  })

  it("with no PhotoBackdrop, or one that rendered nothing, cards are solid and nothing blurs", async () => {
    if (!browser) return
    for (const [stageId, id] of [["plain", "solid"], ["empty", "none"]]) {
      const r = await read(id!)
      expect(r.hostBg).not.toBe("rgba(0, 0, 0, 0)")
      expect(r.glassDisplay).toBe("none")
      expect(await blurred(stageId!)).toEqual([])
    }
  })

  it("data-glass=off inside a PhotoBackdrop's container still turns glass off", async () => {
    if (!browser) return
    const r = await read("reset")
    expect(r.glassDisplay).toBe("none")
    expect(r.controlFilter).toBe("none")
  })
})
