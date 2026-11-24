/**
 * FieldControl's box, glass and theme error colour, in a real browser (VI-805).
 *
 * Loads visor-core's built tokens.css (which carries the `[data-glass]` switch),
 * Field's CSS and the real Input, Textarea and Select CSS, then reads computed
 * styles in Chromium: the control inside the box goes bare and fills it; unbound
 * and glass off the box is solid with the shared control edge and no blur; under
 * `data-glass="on"` it takes the glass layer's control values and the error line
 * takes the on-photo ink; off inside on is solid again.
 * Self-skips where playwright's Chromium is not installed (see the runs-in-Chromium test).
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), "utf-8")
// Input and Textarea both name their root `.base`; prefix each module's classes so they share a page.
const scoped = (css: string, ns: string) => css.replace(/\.(base|size(?:Sm|Md|Lg)|trigger(?:SizeMd)?)(?![\w-])/g, `.${ns}-$1`)
const CSS = [
  read("packages/tokens/dist/tokens.css"),
  read("components/ui/field/field.module.css"),
  scoped(read("components/ui/input/input.module.css"), "input"),
  scoped(read("components/ui/textarea/textarea.module.css"), "textarea"),
  scoped(read("components/ui/select/select.module.css"), "select"),
].join("\n")

// The markup Field, FieldControl and the three controls render, with CSS-module classes unhashed.
const field = (id: string, invalid = false) => {
  const inv = invalid ? ' aria-invalid="true"' : ""
  return `
  <div class="field fieldVertical" id="${id}">
    <label class="fieldLabel">Your name</label>
    <div class="control" data-slot="field-control" data-box="input"><input class="input-base input-sizeMd" data-slot="input" placeholder="Name"${inv} /></div>
    <div class="control controlTall" data-slot="field-control" data-box="textarea"><textarea class="textarea-base textarea-sizeMd"${inv}></textarea></div>
    <div class="control" data-slot="field-control" data-box="select"><button type="button" role="combobox" class="select-trigger select-triggerSizeMd" data-slot="select-trigger"${inv}>Pick one</button></div>
    <div role="alert" class="fieldError fieldErrorWithIcon" data-slot="field-error"><span class="fieldErrorIcon" aria-hidden="true"><svg width="1em" height="1em" fill="currentColor"></svg></span>Required</div>
  </div>`
}

// Visor's reset sizes every box border-box; transitions off so a read never lands mid-change.
const PAGE_CSS = "*, ::before, ::after { box-sizing: border-box; transition: none !important; }"

const HTML = `<!doctype html><html><head><style>${PAGE_CSS}</style><style>${CSS}</style></head><body>
  <section id="plain">${field("solid")}${field("solid-invalid", true)}</section>
  <section data-glass="on">${field("glassy")}${field("glassy-invalid", true)}
    <div data-glass="off">${field("reset")}</div>
  </section>
</body></html>`

interface Page {
  setContent(html: string): Promise<void>
  evaluate<T>(fn: string): Promise<T>
  focus(selector: string): Promise<void>
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

type Box = { bg: string; shadow: string; filter: string; height: number; widgetBg: string; widgetOutline: string; widgetShadow: string; widgetHeight: number }

/** Computed values of one field's boxes and error line, plus the tokens its looks fall back to, resolved. */
async function readField(id: string) {
  return page.evaluate<{ boxes: Record<string, Box>; error: string; icon: string; tokens: Record<string, string> }>(`(() => {
    const root = document.getElementById("${id}");
    const probe = document.createElement("div");
    root.append(probe);
    const color = (v) => { probe.style.color = ""; probe.style.color = v; return getComputedStyle(probe).color; };
    const prop = (name) => getComputedStyle(root).getPropertyValue(name);
    const tokens = {
      fill: color(prop("--surface-interactive-default")),
      edge: color(prop("--border-default")),
      error: color(prop("--text-error")),
      borderError: color(prop("--border-error")),
      primary: color(prop("--text-primary")),
      glassFill: color(prop("--glass-on-control-fill")),
      glassInk: color(prop("--glass-on-ink")),
    };
    probe.remove();
    const boxes = {};
    for (const box of root.querySelectorAll("[data-box]")) {
      const w = box.firstElementChild;
      const b = getComputedStyle(box), c = getComputedStyle(w);
      boxes[box.dataset.box] = {
        bg: b.backgroundColor, shadow: b.boxShadow, filter: b.backdropFilter, height: box.getBoundingClientRect().height,
        widgetBg: c.backgroundColor, widgetOutline: c.outlineStyle, widgetShadow: c.boxShadow, widgetHeight: w.getBoundingClientRect().height,
      };
    }
    const err = root.querySelector('[data-slot="field-error"]');
    return { boxes, error: getComputedStyle(err).color, icon: getComputedStyle(err.querySelector("svg")).fill, tokens };
  })()`)
}

describe("VI-805 FieldControl box, glass and error colour (real browser)", () => {
  // Build & Test shards have no Chromium and self-skip; the glass-switch CI step installs
  // it and sets VISOR_REQUIRE_BROWSER, so the proof cannot silently skip there.
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(browser, "playwright's chromium is not installed").not.toBeNull()
  })

  it("the control inside goes bare and fills the box: transparent, no outline, no shadow, same height", async () => {
    if (!browser) return
    for (const id of ["solid", "solid-invalid", "glassy", "glassy-invalid"]) {
      const { boxes } = await readField(id)
      for (const [name, b] of Object.entries(boxes)) {
        expect(b.widgetBg, `${id} ${name}`).toBe("rgba(0, 0, 0, 0)")
        expect(b.widgetOutline, `${id} ${name}`).toBe("none")
        expect(b.widgetShadow, `${id} ${name}`).toBe("none")
        expect(b.widgetHeight, `${id} ${name}`).toBe(b.height)
      }
    }
  })

  it("unbound and off: a solid box with the shared control edge, no blur, the theme's error colour", async () => {
    if (!browser) return
    const r = await readField("solid")
    for (const b of Object.values(r.boxes)) {
      expect(b.bg).toBe(r.tokens.fill)
      expect(b.shadow).toBe(`${r.tokens.edge} 0px 0px 0px 1px inset`)
      expect(b.filter).toBe("none")
    }
    expect(r.boxes.input.height).toBe(44)
    expect(r.boxes.textarea.height).toBe(100)
    expect(r.error).toBe(r.tokens.error)
    expect(r.icon).toBe(r.tokens.error)
  })

  it("invalid: the box draws the error line, and the error reads the theme's error colour", async () => {
    if (!browser) return
    const r = await readField("solid-invalid")
    for (const b of Object.values(r.boxes)) expect(b.shadow).toBe(`${r.tokens.borderError} 0px 0px 0px 1.5px inset`)
    expect(r.error).toBe(r.tokens.error)
  })

  it("glass on: the glass control fill and blur, and the error line in the on-photo ink", async () => {
    if (!browser) return
    for (const id of ["glassy", "glassy-invalid"]) {
      const r = await readField(id)
      for (const b of Object.values(r.boxes)) {
        expect(b.filter, id).toContain("blur(16px)")
        if (id === "glassy") expect(b.bg, id).toBe(r.tokens.glassFill)
      }
      expect(r.error, id).toBe(r.tokens.glassInk)
      expect(r.icon, id).toBe(r.tokens.glassInk)
      expect(r.error, id).not.toBe(r.tokens.error)
    }
    const inv = await readField("glassy-invalid")
    expect(inv.boxes.input.shadow).toBe(`${inv.tokens.glassInk} 0px 0px 0px 1.5px inset`)
  })

  it("off inside on: back to the solid box and the theme's error colour", async () => {
    if (!browser) return
    const r = await readField("reset")
    expect(r.boxes.input.bg).toBe(r.tokens.fill)
    expect(r.boxes.input.filter).toBe("none")
    expect(r.error).toBe(r.tokens.error)
  })

  it("keyboard focus draws a 2px ring on the box", async () => {
    if (!browser) return
    await page.focus('#solid [data-box="input"] input')
    const shadow = await page.evaluate<string>(`getComputedStyle(document.querySelector('#solid [data-box="input"]')).boxShadow`)
    expect(shadow).toMatch(/ 0px 0px 0px 2px inset$/)
  })

  it("with glass off, nothing in a field renders a backdrop-filter", async () => {
    if (!browser) return
    const offenders = await page.evaluate<string[]>(`(() => {
      const out = [];
      for (const scope of [document.getElementById("plain"), ...document.querySelectorAll('[data-glass="off"]')]) {
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
