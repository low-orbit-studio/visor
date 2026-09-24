// @vitest-environment node
/**
 * VI-658 — InlineEdit in a real browser: no layout shift between rest and
 * editing, typography inherited from `as`, no edge at rest, a title that
 * wraps instead of truncating. The edge switch itself is covered with every
 * other control in control-edge-switch.test.ts.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { REST_EDGE, close, launch, open, ready, type PageLike } from "./render-page"

/**
 * Visor's element reset (`@loworbitstudio/visor-core/reset`) is what gives a
 * form control `font: inherit` (VI-616); InlineEdit relies on it, like every
 * control, so these pages load it. `visor render` does not, to keep existing
 * renders unchanged.
 */
const RESET = readFileSync("packages/tokens/dist/reset.css", "utf-8")
const openWithReset = (fixture: string, opts: { extraCss?: string } = {}) =>
  open("inline-edit", fixture, { extraCss: `${RESET}\n${opts.extraCss ?? ""}` })

const ROOT = "#root [data-slot=inline-edit]"
/** The two sizes the editor uses: 14px body text and the 21px display heading. */
const SIZES = [
  { name: "14px body", fixture: "default", css: `${ROOT} { font-size: 14px; line-height: 1.5; }` },
  { name: "21px display heading", fixture: "heading", css: "" },
]

/**
 * The line InlineEdit sits in: #root's box. An inline root's own rect is only
 * its font's content area, so the containing block is what shows a jump.
 */
const box = (page: PageLike) =>
  page.evaluate(`(function () {
    var r = document.getElementById("root").getBoundingClientRect();
    var own = document.querySelector(${JSON.stringify(ROOT)}).getBoundingClientRect();
    return { top: own.top, height: r.height };
  })()`) as Promise<{ top: number; height: number }>

/** Left edge of the first glyph: the text span at rest, the input's content box while editing. */
const textLeft = (page: PageLike) =>
  page.evaluate(`(function () {
    var input = document.querySelector("${ROOT} input");
    if (!input) return document.querySelector("${ROOT} [data-slot=inline-edit-text]").getBoundingClientRect().left;
    return input.getBoundingClientRect().left + parseFloat(getComputedStyle(input).paddingLeft);
  })()`) as Promise<number>

/** Width of the box: text + pencil at rest, the field while editing. */
const boxWidth = (page: PageLike) =>
  page.evaluate(`(function () {
    var field = document.querySelector("${ROOT} [data-slot=inline-edit-field]");
    if (field) return field.getBoundingClientRect().width;
    var text = document.querySelector("${ROOT} [data-slot=inline-edit-text]").getBoundingClientRect();
    return document.querySelector("${ROOT} [data-slot=inline-edit-pencil]").getBoundingClientRect().right - text.left;
  })()`) as Promise<number>

async function startEditing(page: PageLike) {
  await page.evaluate(`document.querySelector("${ROOT} [data-slot=inline-edit-pencil]").click()`)
  await page.waitForFunction(`!!document.querySelector("${ROOT} input")`, undefined, { timeout: 5000 })
}

async function restAndEditing(fixture: string, extraCss: string) {
  const page = await openWithReset(fixture, { extraCss })
  const rest = { box: await box(page), left: await textLeft(page), width: await boxWidth(page) }
  await startEditing(page)
  const editing = { box: await box(page), left: await textLeft(page), width: await boxWidth(page) }
  await page.close()
  return { rest, editing }
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-658 — InlineEdit (real browser)", () => {
  describe("no layout shift between rest and editing", () => {
    for (const s of SIZES) {
      it(`${s.name}: the box keeps its computed height, width and position, and the text does not move`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const { rest, editing } = await restAndEditing(s.fixture, s.css)
        expect(editing.box).toEqual(rest.box)
        expect(editing.left).toBeCloseTo(rest.left, 1)
        expect(Math.abs(editing.width - rest.width), `rest ${rest.width}px, editing ${editing.width}px`).toBeLessThanOrEqual(1)
      }, 30_000)
    }

    it("mutation control — an input whose padding takes layout space IS caught", async (ctx) => {
      if (!ready()) return ctx.skip()
      const { rest, editing } = await restAndEditing("default", `${SIZES[0].css} ${ROOT} input { margin: 0 !important; }`)
      expect(editing.box.height).not.toBe(rest.box.height)
    }, 30_000)

    it("mutation control — an input sized by its container, not its text, IS caught", async (ctx) => {
      if (!ready()) return ctx.skip()
      const { rest, editing } = await restAndEditing("default", `${SIZES[0].css} ${ROOT} [data-slot=inline-edit-field] { display: block !important; }`)
      expect(Math.abs(editing.width - rest.width)).toBeGreaterThan(1)
    }, 30_000)
  })

  describe("typography inherits from `as`", () => {
    it("the 21px heading's input takes the heading's size, weight and colour", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await openWithReset("heading-editing")
      const [root, input] = (await page.evaluate(`${JSON.stringify([ROOT, `${ROOT} input`])}.map(function (sel) {
        var cs = getComputedStyle(document.querySelector(sel));
        return [cs.fontSize, cs.fontWeight, cs.color, cs.fontFamily];
      })`)) as string[][]
      await page.close()
      expect(root[0]).toBe("21px")
      expect(input).toEqual(root)
    }, 30_000)
  })

  describe("the resting state", () => {
    for (const fixture of ["default", "default-value", "heading"]) {
      it(`${fixture}: text and a pencil, with no edge`, async (ctx) => {
        if (!ready()) return ctx.skip()
        const page = await openWithReset(fixture)
        expect(await page.evaluate(REST_EDGE)).toBe(0)
        await page.close()
      }, 30_000)
    }

    it("mutation control — the editing state does draw an edge", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await openWithReset("editing")
      expect(await page.evaluate(REST_EDGE)).toBeGreaterThan(0)
      await page.close()
    }, 30_000)

    it("the default shows muted, apart from the text colour", async (ctx) => {
      if (!ready()) return ctx.skip()
      const read = `getComputedStyle(document.querySelector("${ROOT} [data-slot=inline-edit-text]")).color`
      const set = await openWithReset("default")
      const setColor = await set.evaluate(read)
      await set.close()
      const empty = await openWithReset("default-value")
      const defaultColor = await empty.evaluate(read)
      const tertiary = await empty.evaluate(`(function () {
        var probe = document.createElement("span");
        probe.style.color = "var(--text-tertiary)";
        document.querySelector(${JSON.stringify(ROOT)}).appendChild(probe);
        return getComputedStyle(probe).color;
      })()`)
      await empty.close()
      expect(defaultColor).toBe(tertiary)
      expect(defaultColor).not.toBe(setColor)
    }, 30_000)

    it("the pencil's hit target is the icon Button's (glyph + pad on every side) without adding height", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await openWithReset("default", { extraCss: SIZES[0].css })
      const [hit, line] = (await page.evaluate(`(function () {
        var pencil = document.querySelector("${ROOT} [data-slot=inline-edit-pencil]");
        var before = getComputedStyle(pencil, "::before");
        var size = pencil.getBoundingClientRect().height;
        return [size - 2 * parseFloat(before.top), document.getElementById("root").getBoundingClientRect().height];
      })()`)) as [number, number]
      await page.close()
      expect(hit).toBe(32)
      expect(line).toBe(21)
    }, 30_000)
  })

  describe("never truncated", () => {
    const LONG = `${ROOT} { display: block; width: 160px; font-size: 14px; line-height: 1.5; }`
    const measure = `(function () {
      var root = document.querySelector(${JSON.stringify(ROOT)});
      var text = root.querySelector("[data-slot=inline-edit-text]");
      text.textContent = "Hospitality and technical rider for festival shows";
      var pencil = root.querySelector("[data-slot=inline-edit-pencil]").getBoundingClientRect();
      var r = root.getBoundingClientRect();
      return { lines: Math.round(r.height / 21), clipped: text.scrollWidth > root.clientWidth, pencilInside: pencil.right <= r.right + 0.5 };
    })()`

    it("a long title wraps onto more lines, whole, with the pencil inside the box", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await openWithReset("default", { extraCss: LONG })
      const m = (await page.evaluate(measure)) as { lines: number; clipped: boolean; pencilInside: boolean }
      await page.close()
      expect(m.lines).toBeGreaterThan(1)
      expect(m.clipped).toBe(false)
      expect(m.pencilInside).toBe(true)
    }, 30_000)

    it("mutation control — a truncating title IS caught", async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await openWithReset("default", {
        extraCss: `${LONG} ${ROOT} { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }`,
      })
      const m = (await page.evaluate(measure)) as { lines: number; clipped: boolean }
      await page.close()
      expect(m.lines).toBe(1)
    }, 30_000)
  })
})
