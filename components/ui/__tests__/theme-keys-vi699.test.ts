// @vitest-environment node
/**
 * VI-699 — each new focus-halo / refused-field theme key (the Button keys are in type-tokens.test.ts), set on the
 * theme scope and read back from the rendered component in Chromium. Skips
 * where Chromium is unavailable (the CSS-level half is the token contract).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { close, launch, open, ready } from "./render-page"

beforeAll(async () => {
  await launch()
}, 60_000)
afterAll(close, 30_000)

/** Computed value of `prop` on the first `selector` match, optionally after focusing it. */
async function read(component: string, fixture: string, scopeCss: string, selector: string, prop: string, focus = false) {
  const page = await open(component, fixture, { scopeCss })
  const value = await page.evaluate(
    `(function () { var el = document.querySelector(${JSON.stringify(selector)}); ${focus ? "el.focus();" : ""} return getComputedStyle(el)[${JSON.stringify(prop)}]; })()`,
  )
  await page.close()
  return value as string
}

describe("VI-699 theme keys read back from the rendered component", () => {
  for (const [component, selector] of [
    ["input", "#root input"],
    ["textarea", "#root textarea"],
    ["select", "#root button"],
    ["tag-input", "#root [data-slot=tag-input]"],
  ] as const) {
    it(`${component}: focus halo colour and width`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open(component, "default", { scopeCss: "--control-focus-halo-color: rgb(10, 20, 30); --control-focus-halo-width: 7px;" })
      // TagInput draws focus from React state, so let the re-render land first.
      const shadow = (await page.evaluate(
        `new Promise(function (done) { document.querySelector(${JSON.stringify(component === "tag-input" ? "#root input" : selector)}).focus(); setTimeout(function () { done(getComputedStyle(document.querySelector(${JSON.stringify(selector)})).boxShadow); }, 50); })`,
      )) as string
      await page.close()
      expect(shadow).toContain("rgb(10, 20, 30)")
      expect(shadow).toContain("7px")
    }, 30_000)
  }

  it("input invalid: ring colour, halo colour and well", async (ctx) => {
    if (!ready()) return ctx.skip()
    const scope = "--control-invalid-ring-color: rgb(1, 2, 3); --control-invalid-halo-color: rgb(4, 5, 6); --control-invalid-halo-width: 5px; --input-bg-invalid: rgb(7, 8, 9);"
    const shadow = await read("input", "invalid", scope, "#root input", "boxShadow")
    expect(shadow).toContain("rgb(1, 2, 3)")
    expect(shadow).toContain("rgb(4, 5, 6)")
    expect(await read("input", "invalid", scope, "#root input", "backgroundColor")).toBe("rgb(7, 8, 9)")
  }, 30_000)

  it("textarea and select invalid: ring colour, halo colour", async (ctx) => {
    if (!ready()) return ctx.skip()
    const scope = "--control-invalid-ring-color: rgb(1, 2, 3); --control-invalid-halo-color: rgb(4, 5, 6);"
    expect(await read("textarea", "invalid", scope, "#root textarea", "outlineColor")).toBe("rgb(1, 2, 3)")
    expect(await read("textarea", "invalid", scope, "#root textarea", "boxShadow")).toContain("rgb(4, 5, 6)")
    expect(await read("select", "invalid", scope, "#root button", "outlineColor")).toBe("rgb(1, 2, 3)")
    expect(await read("select", "invalid", scope, "#root button", "boxShadow")).toContain("rgb(4, 5, 6)")
  }, 30_000)

  for (const [component, selector] of [
    ["textarea", "#root textarea"],
    ["select", "#root button"],
    ["tag-input", "#root [data-slot=tag-input]"],
  ] as const) {
    it(`${component} invalid: bg-invalid well; unset keeps the resting well`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(component, "invalid", "--input-bg-invalid: rgb(7, 8, 9);", selector, "backgroundColor")).toBe("rgb(7, 8, 9)")
      expect(await read(component, "invalid", "", selector, "backgroundColor")).toBe(await read(component, "default", "", selector, "backgroundColor"))
    }, 30_000)
  }
})
