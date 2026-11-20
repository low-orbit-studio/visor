/**
 * The glass switch in a real browser (VI-795).
 *
 * Loads visor-core's built tokens.css (which carries the `[data-glass]` switch) and
 * the docs glass recipe, then reads computed styles in Chromium: with no switch the
 * card is solid and nothing has a backdrop-filter; under `data-glass="on"` the glass
 * layer blurs and the edge blends; `data-glass="off"` inside it turns glass back off.
 * Self-skips only where playwright is not installed.
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = process.cwd()
const TOKENS = readFileSync(join(ROOT, "packages/tokens/dist/tokens.css"), "utf-8")
const RECIPE = readFileSync(join(ROOT, "packages/docs/components/looks/glass-specimen.module.css"), "utf-8")

const card = (id: string) => `
  <div class="panel" id="${id}">
    <span class="glass"></span><span class="edge"></span>
    <div class="content"><h3 class="title">T</h3><input class="field" /><button class="control">Go</button></div>
  </div>`

const HTML = `<!doctype html><html><head><style>${TOKENS}</style><style>${RECIPE}
  .field { -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); }
  #theme { --glass-blur: blur(48px) saturate(161%); --glass-fill: rgb(255 0 0 / 0.5); }
</style></head><body>
  <section id="plain">${card("solid")}</section>
  <section data-glass="on" id="photo">${card("glassy")}
    <div data-glass="off">${card("reset")}</div>
  </section>
  <div id="theme"><section data-glass="on">${card("themed")}</section></div>
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

/** Computed values of one card's host, glass layer, edge layer and control. */
async function read(id: string) {
  return page.evaluate<Record<string, string>>(`(() => {
    const q = (s) => getComputedStyle(document.querySelector("#${id} " + s));
    const host = getComputedStyle(document.getElementById("${id}"));
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement("div");
    probe.style.color = root.getPropertyValue("--surface-card");
    document.body.append(probe);
    const surface = getComputedStyle(probe).color;
    probe.style.color = root.getPropertyValue("--border-default");
    const border = getComputedStyle(probe).color;
    probe.remove();
    return {
      hostBg: host.backgroundColor, hostBorder: host.borderTopColor, surface, border,
      glassDisplay: q(".glass").display, glassFilter: q(".glass").backdropFilter, glassBg: q(".glass").backgroundColor,
      edgeDisplay: q(".edge").display, edgeBlend: q(".edge").mixBlendMode,
      controlFilter: q(".control").backdropFilter,
    };
  })()`)
}

describe("VI-795 glass switch (real browser)", () => {
  it("runs in Chromium", () => {
    expect(browser, "playwright's chromium is not installed").not.toBeNull()
  })

  it("off by default: solid surface and border, glass layers hidden", async () => {
    if (!browser) return
    const r = await read("solid")
    expect(r.hostBg).toBe(r.surface)
    expect(r.hostBorder).toBe(r.border)
    expect(r.glassDisplay).toBe("none")
    expect(r.edgeDisplay).toBe("none")
    expect(r.controlFilter).toBe("none")
  })

  it("on: the host clears, the glass layer blurs and the edge blends soft-light", async () => {
    if (!browser) return
    const r = await read("glassy")
    expect(r.hostBg).toBe("rgba(0, 0, 0, 0)")
    expect(r.glassDisplay).toBe("block")
    expect(r.glassFilter).toContain("blur(32px)")
    expect(r.edgeDisplay).toBe("block")
    expect(r.edgeBlend).toBe("soft-light")
    expect(r.controlFilter).toContain("blur(16px)")
  })

  it("off inside on: back to the solid look", async () => {
    if (!browser) return
    const r = await read("reset")
    expect(r.hostBg).toBe(r.surface)
    expect(r.glassDisplay).toBe("none")
    expect(r.controlFilter).toBe("none")
  })

  it("a theme's --glass-* values, set above the switch, flow through it", async () => {
    if (!browser) return
    const r = await read("themed")
    expect(r.glassFilter).toBe("blur(48px) saturate(1.61)")
    expect(r.glassBg).toBe("rgba(255, 0, 0, 0.5)")
  })

  it("with glass off, nothing renders a backdrop-filter (every element and pseudo-element)", async () => {
    if (!browser) return
    const offenders = await page.evaluate<string[]>(`(() => {
      const out = [];
      const plain = [document.getElementById("plain"), ...document.querySelectorAll('[data-glass="off"]')];
      for (const scope of plain) {
        for (const el of [scope, ...scope.querySelectorAll("*:not(.field)")]) {
          for (const pseudo of [null, "::before", "::after"]) {
            const cs = getComputedStyle(el, pseudo);
            const values = [cs.getPropertyValue("backdrop-filter"), cs.getPropertyValue("-webkit-backdrop-filter")];
            // Chromium reports the -webkit- alias as "" in computed style; it shares the unprefixed value.
            if (values.some((v) => v !== "none" && v !== "")) out.push(el.className + (pseudo ?? "") + "=" + values.join("|"));
          }
        }
      }
      return out;
    })()`)
    expect(offenders).toEqual([])
  })

  it("nested blur: nothing between a blurred field and the photo is a backdrop root", async () => {
    if (!browser) return
    const roots = await page.evaluate<string[]>(`(() => {
      const out = [];
      let el = document.querySelector("#glassy .field").parentElement;
      for (; el && el !== document.documentElement; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (cs.backdropFilter !== "none" || cs.filter !== "none" || Number(cs.opacity) < 1 || cs.mixBlendMode !== "normal")
          out.push(el.className || el.id || el.tagName);
      }
      return out;
    })()`)
    expect(roots).toEqual([])
  })
})
