/**
 * Card's glass variant and editable state, in a real browser (VI-804).
 *
 * Loads visor-core's built tokens.css (which carries the `[data-glass]` switch) and
 * Card's own CSS, then reads computed styles in Chromium: with glass off the glass
 * layer draws the card surface and the edge a plain border, with nothing blurred;
 * under `data-glass="on"` the layers blur and blend, and a blurred field inside
 * keeps a clean path to the photo. Hover, focus and the flash run in Chromium too.
 * Self-skips where playwright's Chromium is not installed (see the runs-in-Chromium test).
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = process.cwd()
const TOKENS = readFileSync(join(ROOT, "packages/tokens/dist/tokens.css"), "utf-8")
const CSS = readFileSync(join(ROOT, "components/ui/card/card.module.css"), "utf-8")
// What the CSS-module build makes of `:global([data-glass="on"]) .edgeLayer`.
const BUILT = CSS.replace(/:global\((\[[^\]]*\])\)/g, "$1")

// The markup Card renders, with its CSS-module classes unhashed.
const glassCard = (id: string, extra = "") => `
  <div class="card glass${extra}" id="${id}" data-variant="glass">
    <span class="glassLayer" aria-hidden="true"></span>
    <span class="edgeLayer" aria-hidden="true"></span>
    <div class="body"><input class="field" aria-label="Field" /></div>
  </div>`

const editable = (id: string, cls = "card editable") => `
  <button type="button" class="${cls}" id="${id}" data-editable>
    <span>Doors at nine</span>
    <span class="pen" aria-hidden="true"><svg></svg></span>
  </button>`

// A blurred field, as a glass Input would draw it.
const FIELD = `.field { -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }`

const HTML = `<!doctype html><html><head><style>${TOKENS}</style><style>${BUILT}</style><style>${FIELD}</style></head><body>
  <section id="plain-scope"><div class="card" id="plain">Plain</div>${glassCard("off")}</section>
  <section id="photo" data-glass="on" style="background: linear-gradient(#f59e0b, #1e3a8a)">
    ${glassCard("on")}
    <div data-glass="off">${glassCard("reset")}</div>
  </section>
  <section>${editable("ed")} ${editable("ed-glass", "card glass editable")}</section>
</body></html>`

interface Page {
  setContent(html: string): Promise<void>
  evaluate<T>(fn: string): Promise<T>
  hover(selector: string): Promise<void>
  focus(selector: string): Promise<void>
  keyboard: { press(key: string): Promise<void> }
  mouse: { move(x: number, y: number): Promise<void> }
  emulateMedia(o: { reducedMotion: "reduce" | "no-preference" }): Promise<void>
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

/** A root token resolved to a computed colour. */
const colour = (token: string) =>
  page.evaluate<string>(`(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(${token})";
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  })()`)

async function layers(id: string) {
  return page.evaluate<Record<string, string>>(`(() => {
    const card = document.getElementById("${id}");
    const g = getComputedStyle(card.querySelector(".glassLayer"));
    const e = getComputedStyle(card.querySelector(".edgeLayer"));
    const c = getComputedStyle(card);
    return {
      cardBg: c.backgroundColor, cardShadow: c.boxShadow, overflow: c.overflow, cardFilter: c.backdropFilter,
      glassBg: g.backgroundColor, glassImage: g.backgroundImage, glassFilter: g.backdropFilter, glassDisplay: g.display,
      edgeColor: e.borderTopColor, edgeWidth: e.borderTopWidth, blend: e.mixBlendMode,
    };
  })()`)
}

describe("VI-804 Card glass and editable (real browser)", () => {
  // Build & Test shards have no Chromium and self-skip; "Verify docs build" installs it
  // and sets VISOR_REQUIRE_BROWSER, so the proof cannot silently skip there.
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(browser, "playwright's chromium is not installed").not.toBeNull()
  })

  it("glass off: the glass layer is the card surface, the edge a plain border, nothing blurred", async () => {
    if (!browser) return
    const surface = await colour("--surface-card")
    const border = await colour("--border-default")
    for (const id of ["off", "reset"]) {
      const r = await layers(id)
      expect(r.glassBg, id).toBe(surface)
      expect(r.glassFilter, id).toBe("none")
      expect(r.edgeColor, id).toBe(border)
      expect(r.edgeWidth, id).toBe("1px")
      expect(r.blend, id).toBe("normal")
      expect(r.cardBg, id).toBe("rgba(0, 0, 0, 0)")
      expect(r.overflow, id).toBe("visible")
    }
  })

  it("glass on: the layers blur and blend, with the lift laid over the fill", async () => {
    if (!browser) return
    const r = await layers("on")
    expect(r.glassFilter).toContain("blur(32px)")
    expect(r.blend).toBe("soft-light")
    expect(r.glassImage).toMatch(/^linear-gradient\(/)
    expect(r.glassBg).not.toBe(await colour("--surface-card"))
    // The host carries no glass of its own: it would become the field's backdrop root.
    expect(r.cardFilter).toBe("none")
  })

  it("a blurred field inside the glass card keeps a clean path to the photo", async () => {
    if (!browser) return
    const blockers = await page.evaluate<string[]>(`(() => {
      const field = document.querySelector("#on .field");
      const out = [];
      if (getComputedStyle(field).backdropFilter === "none") out.push("field has no blur");
      for (let el = field.parentElement; el && el.id !== "photo"; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (s.backdropFilter !== "none") out.push(el.className + " backdrop-filter");
        if (s.filter !== "none") out.push(el.className + " filter");
        if (s.maskImage !== "none") out.push(el.className + " mask");
        if (s.transform !== "none") out.push(el.className + " transform");
        if (Number(s.opacity) < 1) out.push(el.className + " opacity");
        if (s.mixBlendMode !== "normal") out.push(el.className + " blend");
        if (s.isolation === "isolate") out.push(el.className + " isolation");
      }
      return out;
    })()`)
    expect(blockers).toEqual([])
  })

  it("a plain Card is untouched: no glass, its own surface and shadow", async () => {
    if (!browser) return
    const r = await page.evaluate<Record<string, string>>(`(() => {
      const s = getComputedStyle(document.getElementById("plain"));
      return { bg: s.backgroundColor, overflow: s.overflow, position: s.position, filter: s.backdropFilter };
    })()`)
    expect(r).toEqual({ bg: await colour("--surface-card"), overflow: "hidden", position: "static", filter: "none" })
  })

  it("hover lifts the editable card: key-filled pen, deeper shadow, no transform", async () => {
    if (!browser) return
    const rest = await page.evaluate<string>(`getComputedStyle(document.getElementById("ed")).boxShadow`)
    await page.hover("#ed")
    // Let the 300ms colour and shadow transitions finish.
    await page.evaluate(`new Promise((r) => setTimeout(r, 450))`)
    const r = await page.evaluate<Record<string, string>>(`(() => {
      const card = document.getElementById("ed");
      const pen = getComputedStyle(card.querySelector(".pen"));
      const c = getComputedStyle(card);
      return { penBg: pen.backgroundColor, penInk: pen.color, shadow: c.boxShadow, transform: c.transform };
    })()`)
    expect(r.penBg).toBe(await colour("--interactive-primary-bg"))
    expect(r.penInk).toBe(await colour("--interactive-primary-text"))
    expect(r.shadow).not.toBe(rest)
    expect(r.transform).toBe("none")
    await page.mouse.move(0, 0)
  })

  it("focus draws the outline in the key colour", async () => {
    if (!browser) return
    await page.focus("#ed")
    await page.keyboard.press("Shift")
    const outline = await page.evaluate<string>(`getComputedStyle(document.getElementById("ed")).outlineColor`)
    expect(outline).toBe(await colour("--interactive-primary-bg"))
  })

  it("data-flash plays one 1.6s flash on the card, in the key colour", async () => {
    if (!browser) return
    // Let the hover test's transitions settle, so only the flash is running.
    await page.evaluate(`(document.activeElement?.blur(), new Promise((r) => setTimeout(r, 450)))`)
    for (const id of ["ed", "ed-glass"]) {
      const r = await page.evaluate<{ count: number; duration: number; first: string }>(`(() => {
        const card = document.getElementById("${id}");
        card.setAttribute("data-flash", "");
        const anims = card.getAnimations();
        const first = anims[0]?.effect.getKeyframes()[0]?.boxShadow ?? "";
        const out = { count: anims.length, duration: anims[0]?.effect.getTiming().duration, first };
        card.removeAttribute("data-flash");
        return out;
      })()`)
      expect(r.count, id).toBe(1)
      expect(r.duration, id).toBe(1600)
      expect(r.first, id).toContain(await colour("--interactive-primary-bg"))
    }
  })

  it("reduced motion: no press transform and no transition time", async () => {
    if (!browser) return
    await page.emulateMedia({ reducedMotion: "reduce" })
    try {
      const r = await page.evaluate<{ durations: string[]; press: string }>(`(() => {
        const card = document.getElementById("ed");
        // The :active rule's own value, read off the stylesheet (a script cannot hold :active).
        const sheet = [...document.styleSheets].find((s) => [...s.cssRules].some((r) => r.cssText.includes(".editable:active")));
        const media = [...sheet.cssRules].find((r) => r.media && r.media.mediaText.includes("reduce") && r.cssText.includes(".editable:active"));
        const press = [...media.cssRules].find((r) => r.selectorText === ".editable:active").style.transform;
        return {
          durations: [getComputedStyle(card).transitionDuration, getComputedStyle(card.querySelector(".pen")).transitionDuration],
          press,
        };
      })()`)
      expect(r.press).toBe("none")
      // Card asks for 0s; visor-core's reduced-motion base rule pins every transition
      // to 0.01ms with a layered !important, which no component rule can beat. Both are instant.
      for (const d of r.durations.flatMap((v) => v.split(","))) expect(["0s", "1e-05s"]).toContain(d.trim())
    } finally {
      await page.emulateMedia({ reducedMotion: "no-preference" })
    }
  })
})

describe("VI-804 Card CSS guards", () => {
  const rules = (selector: RegExp) => [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => selector.test(m[1]!))

  it("every backdrop-filter reads the glass switch or the card hook, falling back to none", () => {
    const values = [...CSS.matchAll(/backdrop-filter:\s*([^;]+);/g)].map((m) => m[1]!.trim())
    expect(values.length).toBeGreaterThan(0)
    for (const v of values) expect(v).toBe("var(--card-glass-filter, var(--glass-on-blur, none))")
  })

  it("nothing moves on hover", () => {
    for (const [, , body] of rules(/:hover/)) expect(body).not.toMatch(/transform/)
  })

  it("the pen and the flash use the theme's key colour, never a literal", () => {
    const flash = CSS.slice(CSS.indexOf("@keyframes card-flash"))
    expect(flash).toContain("var(--interactive-primary-bg")
    expect(flash).not.toMatch(/rgb\(255 45 138|#ff2d8a/i)
    expect(CSS).toMatch(/\.editable:hover \.pen \{[^}]*var\(--interactive-primary-bg/)
  })
})
