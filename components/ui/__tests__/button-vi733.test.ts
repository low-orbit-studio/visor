// @vitest-environment node
/**
 * VI-733 — the compact (`dlg`) destructive Button reads --interactive-destructive-bg / -text / -bg-hover,
 * and an icon sits exactly one gap from its label (JSX's " " makes no empty flex item).
 * Skips where Chromium is unavailable.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { bundle, close, launch, open, ready } from "./render-page"

beforeAll(async () => {
  await launch()
}, 60_000)
afterAll(close, 30_000)

async function read(fixture: string, scopeCss: string, prop: string, opts: { hover?: boolean; componentCss?: string } = {}) {
  const page = await open("button", fixture, { scopeCss, componentCss: opts.componentCss })
  if (opts.hover) await page.hover("#root button")
  const value = (await page.evaluate(`getComputedStyle(document.querySelector("#root button")).${prop}`)) as string
  await page.close()
  return value
}

describe("VI-733 compact destructive reads its keys", () => {
  for (const [token, prop, hover] of [
    ["--interactive-destructive-bg", "backgroundColor", false],
    ["--interactive-destructive-text", "color", false],
    ["--interactive-destructive-bg-hover", "backgroundColor", true],
  ] as const) {
    it(`${token} moves ${prop}; renamed in the CSS it does not`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const scope = `${token}: rgb(1, 2, 3);`
      expect(await read("dlg-destructive", scope, prop, { hover })).toBe("rgb(1, 2, 3)")
      const css = (await bundle("button", "dlg-destructive")).css
      const mutated = css.replace(new RegExp(`${token}(?![a-z0-9-])`, "g"), `${token}-mutated`)
      expect(mutated).not.toBe(css)
      expect(await read("dlg-destructive", scope, prop, { hover, componentCss: mutated })).not.toBe("rgb(1, 2, 3)")
    }, 30_000)
  }
})

describe("VI-733 icon-to-label distance", () => {
  const DISTANCE = `(function () {
    var b = document.querySelector("#root button");
    return b.querySelector("svg").getBoundingClientRect().right - b.querySelector("[data-slot=button-text]").getBoundingClientRect().left;
  })()`
  for (const [scope, gap] of [["", 8], ["--button-icon-gap: 6px;", 6]] as const) {
    it(`icon sits one gap (${gap}px) from the label`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open("button", "icon-label", { scopeCss: scope })
      const d = (await page.evaluate(DISTANCE)) as number
      await page.close()
      expect(d).toBeCloseTo(-gap, 1)
    }, 30_000)
  }
})
