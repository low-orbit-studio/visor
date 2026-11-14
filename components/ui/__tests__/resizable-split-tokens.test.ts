// @vitest-environment node
/**
 * VI-778 — ResizableSplit's divider colours come from theme tokens, proven in a real browser.
 *
 * The divider's line is read at rest, under the pointer and mid-drag, under two
 * themes (neutral light, space dark):
 *
 *  - **Unbound, it follows the theme.** Each state computes the theme's own
 *    semantic token (`--border-default`, `--border-strong`,
 *    `--interactive-primary-bg`), read from the same page, and the two themes
 *    compute different colours. A literal would compute the same on both.
 *  - **Bound, it follows the key.** Binding the `resizable-split` tokens on the
 *    theme scope moves each state to its bound value.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { resolveThemeCssFile } from "../../../packages/cli/src/commands/render"
import { close, launch, open, ready } from "./render-page"

const DIVIDER = "#root [data-slot=resizable-split-divider]"
const LINE = `getComputedStyle(document.querySelector(${JSON.stringify(DIVIDER)}), "::before").backgroundColor`

type Opts = NonNullable<Parameters<typeof open>[2]>
const THEMES: Record<string, Opts> = {
  "neutral light": {},
  "space dark": {
    theme: { css: readFileSync(resolveThemeCssFile(process.cwd(), "space")!, "utf-8"), className: "space-theme", mode: "dark" },
  },
}

const probe = (name: string) =>
  `(function () { var p = document.createElement("i"); p.style.backgroundColor = "var(${name})"; document.getElementById("theme-scope").appendChild(p); var c = getComputedStyle(p).backgroundColor; p.remove(); return c; })()`

interface Reading { rest: string; hover: string; drag: string; semantic: { rest: string; hover: string; drag: string } }

/** The line's colour at rest, hovered and mid-drag, and the theme's semantic tokens on the same page. */
async function readLine(opts: Opts): Promise<Reading> {
  const page = await open("resizable-split", "default", opts)
  const semantic = {
    rest: (await page.evaluate(probe("--border-default"))) as string,
    hover: (await page.evaluate(probe("--border-strong"))) as string,
    drag: (await page.evaluate(probe("--interactive-primary-bg"))) as string,
  }
  const rest = (await page.evaluate(LINE)) as string
  await page.hover(DIVIDER)
  const hover = (await page.evaluate(LINE)) as string
  const { x, y } = (await page.evaluate(
    `(function () { var r = document.querySelector(${JSON.stringify(DIVIDER)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`,
  )) as { x: number; y: number }
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + 40, y)
  const drag = (await page.evaluate(LINE)) as string
  const dragging = await page.evaluate(`document.querySelector("#root [data-slot=resizable-split]").hasAttribute("data-dragging")`)
  await page.mouse.up()
  await page.close()
  expect(dragging).toBe(true)
  return { rest, hover, drag, semantic }
}

const readings: Record<string, Reading> = {}

beforeAll(async () => {
  if (!(await launch())) return
  for (const [name, opts] of Object.entries(THEMES)) readings[name] = await readLine(opts)
}, 60_000)

afterAll(close)

describe("VI-778 — resizable-split divider colours (real browser)", () => {
  for (const name of Object.keys(THEMES)) {
    it(`${name}: unbound, rest, hover and drag compute the theme's own tokens`, (ctx) => {
      if (!ready()) return ctx.skip()
      const r = readings[name]
      expect(r.rest).toBe(r.semantic.rest)
      expect(r.hover).toBe(r.semantic.hover)
      expect(r.drag).toBe(r.semantic.drag)
      // Three states the eye can tell apart.
      expect(new Set([r.rest, r.hover, r.drag]).size).toBe(3)
    })

    it(`${name}: bound, each state computes its key`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const bound = await readLine({
        ...THEMES[name],
        scopeCss: "--resizable-split-divider-color: #112233; --resizable-split-divider-hover-color: #33ccaa; --resizable-split-divider-active-color: #aa33cc;",
      })
      expect([bound.rest, bound.hover, bound.drag]).toEqual(["rgb(17, 34, 51)", "rgb(51, 204, 170)", "rgb(170, 51, 204)"])
    }, 30_000)
  }

  it("the two themes draw the divider differently", (ctx) => {
    if (!ready()) return ctx.skip()
    const [a, b] = Object.values(readings)
    expect([a.rest, a.hover, a.drag]).not.toEqual([b.rest, b.hover, b.drag])
    expect(a.rest).not.toBe(b.rest)
  })
})
