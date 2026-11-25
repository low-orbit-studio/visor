/**
 * NumberInput's invalid look, in a real browser (VI-821).
 *
 * Loads visor-core's built tokens.css plus Input's and NumberInput's own CSS, then reads
 * computed styles in Chromium: a NumberInput whose input carries aria-invalid="true"
 * draws the same fill and inset ring an invalid Input draws, a valid one draws neither,
 * and under data-glass="on" it takes the Field box's glass error look (VI-805).
 * Self-skips where playwright's Chromium is not installed.
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = process.cwd()
const TOKENS = readFileSync(join(ROOT, "packages/tokens/dist/tokens.css"), "utf-8")
const INPUT_CSS = readFileSync(join(ROOT, "components/ui/input/input.module.css"), "utf-8")
const CSS = readFileSync(join(ROOT, "components/ui/number-input/number-input.module.css"), "utf-8")

// The markup NumberInput renders, with its CSS-module classes unhashed.
const field = (id: string, invalid: boolean) => `
  <div class="wrapper" id="${id}">
    <button type="button" class="button">-</button>
    <input class="input" value="2"${invalid ? ' aria-invalid="true"' : ""} />
    <button type="button" class="button">+</button>
  </div>`

const HTML = `<!doctype html><html><head><style>${TOKENS}</style><style>${INPUT_CSS}</style><style>${CSS}</style></head><body>
  ${field("valid", false)}
  ${field("invalid", true)}
  <input class="base" id="input-invalid" aria-invalid="true" />
  <section style="--control-invalid-ring-width: 1px; --control-invalid-ring-color: rgb(9, 8, 7);">
    ${field("themed", true)}
    <input class="base" id="input-themed" aria-invalid="true" />
  </section>
  <section data-glass="on">${field("glass", true)}</section>
</body></html>`

interface Page {
  setContent(html: string): Promise<void>
  focus(selector: string): Promise<void>
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

const read = (id: string) =>
  page.evaluate<Record<string, string>>(`(() => {
    const el = document.getElementById("${id}");
    const s = getComputedStyle(el);
    const probe = document.createElement("div");
    document.body.append(probe);
    const resolve = (v) => { probe.style.color = ""; probe.style.color = v; return getComputedStyle(probe).color; };
    const out = {
      bg: s.backgroundColor, shadow: s.boxShadow, outline: s.outlineColor,
      glassFill: resolve(s.getPropertyValue("--glass-on-control-hover-fill")),
      glassInk: resolve(s.getPropertyValue("--glass-on-ink")),
    };
    probe.remove();
    return out;
  })()`)

describe("VI-821 NumberInput invalid look (real browser)", () => {
  it("valid: no error fill, no ring", async () => {
    if (!browser) return
    const [valid, input] = [await read("valid"), await read("input-invalid")]
    expect(valid.bg).not.toBe(input.bg)
    expect(valid.shadow).toBe("none")
  })

  it("aria-invalid draws the same fill and inset ring Input draws", async () => {
    if (!browser) return
    const [r, input] = [await read("invalid"), await read("input-invalid")]
    expect(r.bg).toBe(input.bg)
    expect(r.shadow).toBe(input.shadow)
    expect(r.shadow).toContain("inset")
    expect(r.outline).toBe("rgba(0, 0, 0, 0)")
  })

  it("reads the shared control invalid tokens, as Input does", async () => {
    if (!browser) return
    const [r, input] = [await read("themed"), await read("input-themed")]
    expect(r.shadow).toContain("rgb(9, 8, 7) 0px 0px 0px 1px inset")
    expect(r.shadow).toBe(input.shadow)
  })

  it("keeps the error ring while focused", async () => {
    if (!browser) return
    await page.focus("#invalid .input")
    const r = await read("invalid")
    expect(r.shadow).toContain("0px 0px 0px 1.5px inset")
    expect(r.outline).toBe("rgba(0, 0, 0, 0)")
  })

  it("under glass: the Field box's glass fill and ink line", async () => {
    if (!browser) return
    const r = await read("glass")
    expect(r.bg).toBe(r.glassFill)
    expect(r.shadow).toContain(`${r.glassInk} 0px 0px 0px 1.5px inset`)
  })
})
