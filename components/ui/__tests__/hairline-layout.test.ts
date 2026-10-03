// @vitest-environment node
/**
 * VI-680 — the hairline switch moves nothing, proven in a real browser.
 *
 * `--hairline-width: 0` must not shift layout. This bundles real components the
 * way `visor render` does, loads each in Chromium with the switch on and off,
 * and compares the bounding box of every element on the page (portaled content
 * included). The pattern (a transparent border of constant width, with the line
 * painted by outline, border-image or an inset shadow) is what makes that hold;
 * a hairline painted by a plain `border` shifts its box and fails here.
 *
 * Skips where Chromium is unavailable, like control-edge-switch.test.ts. The
 * CI-portable half is hairline-switch.test.ts.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { bundle, close, launch, open, ready } from "./render-page"

/** Fixtures that draw a hairline, one per painting technique. */
const FIXTURES = [
  { id: "tabs/line", component: "tabs", fixture: "line" }, // border-image rule
  { id: "dialog/default", component: "dialog", fixture: "default" }, // border-image rule in a portal
  { id: "popover/selection", component: "popover", fixture: "selection" }, // outline ring
  { id: "doc-nav/default", component: "doc-nav", fixture: "default" }, // outline rings
  { id: "fidelity-mirror/default", component: "fidelity-mirror", fixture: "default" }, // rings + rules
]

const OFF = ":root { --hairline-width: 0 !important; }"

const RECTS = `JSON.stringify([].map.call(document.querySelectorAll("body *"), function (el) {
  if (el.tagName === "STYLE" || el.tagName === "SCRIPT") return null;
  var r = el.getBoundingClientRect(); return [el.tagName, r.x, r.y, r.width, r.height];
}).filter(Boolean))`

beforeAll(async () => {
  await launch()
}, 60_000)
afterAll(close)

async function rects(component: string, fixture: string, extraCss = "", componentCss?: string): Promise<string> {
  const page = await open(component, fixture, { extraCss, componentCss })
  const out = (await page.evaluate(RECTS)) as string
  await page.close()
  return out
}

describe("VI-680 — --hairline-width: 0 shifts no layout (real browser)", () => {
  for (const { id, component, fixture } of FIXTURES) {
    it(`${id}: every box is where it was with the switch off`, { timeout: 60_000 }, async (ctx) => {
      if (!ready()) return ctx.skip()
      const on = JSON.parse(await rects(component, fixture))
      const off = JSON.parse(await rects(component, fixture, OFF))
      expect(on.length).toBeGreaterThan(3)
      expect(off).toEqual(on)
    })
  }

  it("tabs: the content under the rail does not move", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const probe = `JSON.stringify(document.querySelector('[data-slot="tabs-content"], [role="tabpanel"]').getBoundingClientRect().toJSON())`
    const read = async (extra: string) => {
      const page = await open("tabs", "line", { extraCss: extra })
      const v = (await page.evaluate(probe)) as string
      await page.close()
      return v
    }
    expect(await read(OFF)).toBe(await read(""))
  })

  it("dialog: the body does not move", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    const probe = `JSON.stringify(document.querySelector("p").getBoundingClientRect().toJSON())`
    const read = async (extra: string) => {
      const page = await open("dialog", "default", { extraCss: extra })
      const v = (await page.evaluate(probe)) as string
      await page.close()
      return v
    }
    expect(await read(OFF)).toBe(await read(""))
  })

  it("mutation control — a hairline painted by a plain border IS caught", { timeout: 60_000 }, async (ctx) => {
    if (!ready()) return ctx.skip()
    // Put the dialog footer rule back to a plain border and the switch shifts it.
    const b = await bundle("dialog", "default")
    const mutated = b.css.replace(
      /(_footer \{[^}]*?)border-top:[^;]*;\s*border-image:[^;]*;/,
      "$1border-top: var(--hairline-width, 1px) solid var(--hairline, #e5e7eb);",
    )
    expect(mutated).not.toBe(b.css)
    const on = await rects("dialog", "default", "", mutated)
    const off = await rects("dialog", "default", OFF, mutated)
    expect(off).not.toEqual(on)
  })
})
