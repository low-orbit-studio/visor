/**
 * NumberInput's skin hooks and glass, in a real browser (VI-798).
 *
 * Loads visor-core's built tokens.css (which carries the `[data-glass]` switch) and
 * NumberInput's own CSS, then reads computed styles in Chromium: unbound, the field
 * draws what it drew before the hooks; the hooks move their properties; under
 * `data-glass="on"` the field takes the glass layer's control values, and with no
 * switch (or `data-glass="off"`) nothing in it has a backdrop-filter.
 * Self-skips where playwright's Chromium is not installed (see the runs-in-Chromium test).
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = process.cwd()
const TOKENS = readFileSync(join(ROOT, "packages/tokens/dist/tokens.css"), "utf-8")
const CSS = readFileSync(join(ROOT, "components/ui/number-input/number-input.module.css"), "utf-8")

// The markup NumberInput renders, with its CSS-module classes unhashed.
const field = (id: string) => `
  <div class="wrapper" id="${id}">
    <button type="button" class="button minus"><svg class="buttonIcon"></svg></button>
    <input class="input" value="2" />
    <button type="button" class="button plus"><svg class="buttonIcon"></svg></button>
  </div>`

const KIT = `--number-input-height: 54px; --number-input-radius: 12px; --number-input-value-width: 72px;
  --number-input-value-font-size: 22px; --number-input-value-font-weight: 640; --number-input-button-size: 40px;
  --number-input-button-inset: 7px; --number-input-button-radius: 50%; --number-input-icon-size: 20px;
  --number-input-bg: rgb(1, 2, 3); --number-input-border: rgb(4, 5, 6); --number-input-button-color: rgb(7, 8, 9);`

const HTML = `<!doctype html><html><head><style>${TOKENS}</style><style>${CSS}</style></head><body>
  <section id="plain">${field("solid")}</section>
  <section id="kit" style="${KIT}">${field("bound")}
    <div data-glass="on">${field("bound-glass")}</div>
  </section>
  <section data-glass="on">${field("glassy")}
    <div data-glass="off">${field("reset")}</div>
  </section>
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

/** Computed values of one field, plus the root tokens its solid look falls back to, resolved to colours. */
async function read(id: string) {
  return page.evaluate<Record<string, string>>(`(() => {
    const el = document.getElementById("${id}");
    const w = getComputedStyle(el);
    const b = getComputedStyle(el.querySelector(".plus"));
    const i = getComputedStyle(el.querySelector(".input"));
    const icon = getComputedStyle(el.querySelector(".buttonIcon"));
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement("div");
    document.body.append(probe);
    const resolve = (v) => { probe.style.color = ""; probe.style.color = v; return getComputedStyle(probe).color; };
    const tokens = {
      fillToken: resolve(root.getPropertyValue("--surface-interactive-default")),
      edgeToken: resolve(root.getPropertyValue("--border-default")),
      secondaryToken: resolve(root.getPropertyValue("--text-secondary")),
      primaryToken: resolve(root.getPropertyValue("--text-primary")),
      controlFill: resolve(getComputedStyle(el).getPropertyValue("--glass-on-control-fill")),
      radiusToken: (probe.style.borderRadius = root.getPropertyValue("--radius-md"), getComputedStyle(probe).borderTopLeftRadius),
    };
    probe.remove();
    return {
      ...tokens,
      bg: w.backgroundColor, outline: w.outlineColor, radius: w.borderTopLeftRadius, filter: w.backdropFilter,
      width: String(el.getBoundingClientRect().width), height: String(el.getBoundingClientRect().height),
      buttonW: b.width, buttonH: b.height, buttonRadius: b.borderTopLeftRadius, buttonMargin: b.marginLeft,
      buttonColor: b.color, buttonFilter: b.backdropFilter,
      inputW: i.width, inputH: i.height, fontSize: i.fontSize, fontWeight: i.fontWeight, inputColor: i.color,
      iconW: icon.width,
    };
  })()`)
}

describe("VI-798 NumberInput skin and glass (real browser)", () => {
  // Build & Test shards have no Chromium and self-skip; "Verify docs build" installs it
  // and sets VISOR_REQUIRE_BROWSER, so the proof cannot silently skip there.
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(browser, "playwright's chromium is not installed").not.toBeNull()
  })

  it("unbound and off: the shipped solid look, no blur", async () => {
    if (!browser) return
    const r = await read("solid")
    expect(r.bg).toBe(r.fillToken)
    expect(r.outline).toBe(r.edgeToken)
    expect(r.radius).toBe(r.radiusToken)
    expect(r.filter).toBe("none")
    expect([r.buttonW, r.buttonH, r.inputH]).toEqual(["36px", "36px", "36px"])
    expect(r.inputW).toBe("64px")
    expect(r.buttonRadius).toBe("0px")
    expect(r.buttonMargin).toBe("0px")
    expect(r.buttonColor).toBe(r.secondaryToken)
    expect(r.inputColor).toBe(r.primaryToken)
    expect(r.fontSize).toBe("14px")
    expect(r.iconW).toBe("14px")
  })

  it("the hooks move their properties: the kit's 54 / 72 / 54 field with 40px round buttons", async () => {
    if (!browser) return
    const r = await read("bound")
    expect(r.bg).toBe("rgb(1, 2, 3)")
    expect(r.outline).toBe("rgb(4, 5, 6)")
    expect(r.buttonColor).toBe("rgb(7, 8, 9)")
    expect(r.radius).toBe("12px")
    expect([r.buttonW, r.buttonH, r.buttonRadius, r.buttonMargin]).toEqual(["40px", "40px", "50%", "7px"])
    expect([r.inputW, r.inputH, r.fontSize, r.fontWeight, r.iconW]).toEqual(["72px", "54px", "22px", "640", "20px"])
    // 54 + 72 + 54, plus the 1px geometry border each side.
    expect(r.width).toBe("182")
    expect(r.height).toBe("56")
  })

  it("glass on: the glass layer's control fill, ink and blur, ahead of the theme's solid hooks", async () => {
    if (!browser) return
    for (const id of ["glassy", "bound-glass"]) {
      const r = await read(id)
      expect(r.filter, id).toContain("blur(16px)")
      expect(r.bg, id).toBe(r.controlFill)
      expect(r.buttonColor, id).toBe(r.primaryToken)
      expect(r.inputColor, id).toBe(r.primaryToken)
      // The buttons carry no blur of their own: only the field blurs the photo.
      expect(r.buttonFilter, id).toBe("none")
    }
    // The size hooks still apply under glass.
    expect((await read("bound-glass")).inputH).toBe("54px")
  })

  it("off inside on: back to the solid look", async () => {
    if (!browser) return
    const r = await read("reset")
    expect(r.bg).toBe(r.fillToken)
    expect(r.filter).toBe("none")
    expect(r.buttonColor).toBe(r.secondaryToken)
  })

  it("with glass off, nothing in the field renders a backdrop-filter", async () => {
    if (!browser) return
    const offenders = await page.evaluate<string[]>(`(() => {
      const out = [];
      for (const scope of [document.getElementById("plain"), document.getElementById("bound"), ...document.querySelectorAll('[data-glass="off"]')]) {
        for (const el of [scope, ...scope.querySelectorAll("*")]) {
          const v = getComputedStyle(el).backdropFilter;
          if (v !== "none") out.push((el.id || el.className) + "=" + v);
        }
      }
      return out;
    })()`)
    expect(offenders).toEqual([])
  })
})
