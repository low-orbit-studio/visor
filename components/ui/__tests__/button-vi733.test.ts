// @vitest-environment node
/**
 * VI-733 — the compact (`dlg`) destructive Button reads --button-dlg-destructive-bg / -text / -bg-hover,
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

// origin/main's compact Remove, written as the fallback expressions it carried.
const ORIGINAL = {
  backgroundColor: "var(--surface-error-subtle, color-mix(in srgb, var(--destructive, #ef4444) 8%, transparent))",
  color: "var(--text-error, var(--destructive, #b91c1c))",
  hover: "color-mix(in srgb, var(--destructive, #ef4444) 14%, transparent)",
}

/** What an expression resolves to under the same tokens and theme, via a probe in the page. */
async function resolve(prop: "backgroundColor" | "color", expr: string, opts: { componentCss?: string } = {}) {
  const page = await open("button", "dlg-destructive", { componentCss: opts.componentCss })
  const v = (await page.evaluate(`(function () {
    var p = document.createElement("div"); p.style.${prop} = ${JSON.stringify(expr)};
    document.getElementById("theme-scope").appendChild(p); return getComputedStyle(p).${prop};
  })()`)) as string
  await page.close()
  return v
}

describe("VI-733 compact destructive reads button.dlg-destructive-* keys", () => {
  for (const [prop, hover, expr] of [
    ["backgroundColor", false, ORIGINAL.backgroundColor],
    ["color", false, ORIGINAL.color],
    ["backgroundColor", true, ORIGINAL.hover],
  ] as const) {
    it(`unbound ${prop}${hover ? " on hover" : ""} is origin/main's, with tokens.css loaded`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read("dlg-destructive", "", prop, { hover })).toBe(await resolve(prop, expr))
    }, 30_000)
  }

  for (const [token, prop, hover, value] of [
    ["--button-dlg-destructive-bg", "backgroundColor", false, "rgba(255, 107, 107, 0.08)"],
    ["--button-dlg-destructive-text", "color", false, "rgb(255, 107, 107)"],
    ["--button-dlg-destructive-bg-hover", "backgroundColor", true, "rgba(255, 107, 107, 0.16)"],
  ] as const) {
    it(`${token} moves ${prop}`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read("dlg-destructive", `${token}: ${value};`, prop, { hover })).toBe(value)
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
