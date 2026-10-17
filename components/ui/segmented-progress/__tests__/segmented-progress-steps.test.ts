// @vitest-environment node
/**
 * VI-713 — SegmentedProgress's labelled steps, proven in a real browser.
 *
 *  - Each state paints its fill and its label: done, current (the strong rung,
 *    rebindable through --button-strong-fill), pending, and failed (the error red).
 *  - Labels draw at 12px under sm and 14px under md, and follow their hooks.
 *  - The fills animate once with motion allowed, and draw filled and static
 *    under prefers-reduced-motion.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { close, launch, open, ready } from "../../__tests__/render-page"

const STEP = (state: string) => `#root [data-slot=segmented-progress-step][data-state=${state}]`
const FILL = (state: string) => `${STEP(state)} [data-slot=segmented-progress-segment]`
const LABEL = (state: string) => `${STEP(state)} [data-slot=segmented-progress-label]`

async function read(
  fixture: string,
  selector: string,
  prop: string,
  opts: Parameters<typeof open>[2] & { pseudo?: string } = {},
): Promise<string> {
  const page = await open("segmented-progress", fixture, opts)
  const value = (await page.evaluate(
    `getComputedStyle(document.querySelector(${JSON.stringify(selector)}), ${JSON.stringify(opts.pseudo ?? null)}).getPropertyValue(${JSON.stringify(prop)})`,
  )) as string
  await page.close()
  return value
}

const SCOPE = [
  "--interactive-primary-bg: #0000ff",
  "--interactive-destructive-bg: #ff0000",
  "--surface-muted: #cccccc",
  "--text-primary: #111111",
  "--text-secondary: #222222",
  "--text-tertiary: #333333",
  "--text-error: #aa0000",
].join("; ") + ";"

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-713 — labelled steps (real browser)", () => {
  for (const [state, color, clip] of [
    ["done", "rgb(0, 0, 255)", "inset(0px round 9999px)"],
    ["current", "rgb(0, 0, 255)", "inset(0px 45% 0px 0px round 9999px)"],
    ["pending", "rgb(0, 0, 255)", "inset(0px 100% 0px 0px round 9999px)"],
    ["failed", "rgb(255, 0, 0)", "inset(0px round 9999px)"],
  ]) {
    it(`a ${state} step's fill is ${color}, clipped to ${clip}`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read("steps", FILL(state), "background-color", { scopeCss: SCOPE, pseudo: "::before" })).toBe(color)
      expect(await read("steps", FILL(state), "clip-path", { scopeCss: SCOPE, pseudo: "::before" })).toBe(clip)
      expect(await read("steps", FILL(state), "background-color", { scopeCss: SCOPE })).toBe("rgb(204, 204, 204)")
    }, 30_000)
  }

  for (const [fixture, height] of [["steps", "6px"], ["steps-md", "8px"]]) {
    it(`${fixture} segments keep their ${height} height over the label`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(fixture, FILL("pending"), "height")).toBe(height)
    }, 30_000)
  }

  it("the current fill reads --button-strong-fill", async (ctx) => {
    if (!ready()) return ctx.skip()
    const scopeCss = `${SCOPE} --button-strong-fill: #00ff00;`
    expect(await read("steps", FILL("current"), "background-color", { scopeCss, pseudo: "::before" })).toBe("rgb(0, 255, 0)")
  }, 30_000)

  for (const [state, color, weight] of [
    ["done", "rgb(34, 34, 34)", "400"],
    ["current", "rgb(17, 17, 17)", "700"],
    ["pending", "rgb(51, 51, 51)", "400"],
    ["failed", "rgb(170, 0, 0)", "700"],
  ]) {
    it(`a ${state} label is ${color} at weight ${weight}`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read("steps", LABEL(state), "color", { scopeCss: SCOPE })).toBe(color)
      expect(await read("steps", LABEL(state), "font-weight", { scopeCss: SCOPE })).toBe(weight)
    }, 30_000)
  }

  it("the failed warning icon is in the error ink", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read("steps", `${LABEL("failed")} svg`, "color", { scopeCss: SCOPE })).toBe("rgb(170, 0, 0)")
  }, 30_000)

  for (const [fixture, size, hook] of [
    ["steps", "12px", "--segmented-progress-sm-label-font-size"],
    ["steps-md", "14px", "--segmented-progress-md-label-font-size"],
  ]) {
    it(`${fixture} labels draw at ${size} and follow ${hook}`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(fixture, LABEL("pending"), "font-size")).toBe(size)
      expect(await read(fixture, LABEL("pending"), "font-size", { scopeCss: `${hook}: 11.5px;` })).toBe("11.5px")
    }, 30_000)
  }

  it("fills animate once with motion allowed, staggered by index", async (ctx) => {
    if (!ready()) return ctx.skip()
    const opts = { motion: "no-preference" as const, pseudo: "::before" }
    expect(await read("steps", FILL("done"), "animation-name", opts)).toMatch(/segmented-progress-fill/)
    expect(await read("steps", FILL("done"), "animation-iteration-count", opts)).toBe("1")
    expect(await read("steps", FILL("current"), "animation-delay", opts)).toBe("0.14s")
  }, 30_000)

  it("under reduced motion the fills draw filled with no animation", async (ctx) => {
    if (!ready()) return ctx.skip()
    const opts = { motion: "reduce" as const, pseudo: "::before" }
    expect(await read("steps", FILL("done"), "animation-name", opts)).toBe("none")
    expect(await read("steps", FILL("done"), "clip-path", opts)).toBe("inset(0px round 9999px)")
  }, 30_000)

  it("a bar without steps draws no fill layer", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read("default", "#root [data-slot=segmented-progress-segment]", "content", { pseudo: "::before" })).toBe("none")
  }, 30_000)
})
