// @vitest-environment node
/**
 * VI-693 — Switch's knob and hover colours, proven in a real browser.
 *
 * Each new key in the `switch` family is checked on the computed style of the
 * element it paints:
 *
 *  - **Unset equals what shipped.** `unset` is the value 1.34.0 computes on the
 *    neutral light theme. An unbound theme must still compute it.
 *  - **Set equals the key.** Binding the token on the theme scope moves the
 *    computed style to the bound value. The mutation controls live with the
 *    family's other hooks in type-tokens.test.ts.
 *
 * Then the reason the keys exist, end to end on the dark, borderless
 * blacklight-app theme: the theme YAML gains `components.switch` bindings, the
 * engine emits them, and the knob-on-track contrast clears WCAG 1.4.11's 3:1
 * where the unbound knob does not.
 *
 * Skips where Chromium is unavailable (playwright is an optional dep).
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { parse, stringify } from "yaml"
import { generateThemeData } from "../../../packages/theme-engine/src/pipeline"
import { docsAdapter } from "../../../packages/theme-engine/src/adapters/docs"
import { close, launch, open, ready, type PageLike } from "./render-page"

const ROOT = "#root [data-slot=switch]"
const THUMB = "#root [data-slot=switch-thumb]"

interface Case {
  token: string
  fixture: "default" | "checked"
  target: string
  hover?: boolean
  value: string
  expected: string
  /** What 1.34.0 computes on neutral light. */
  unset: string
}

const CASES: Case[] = [
  // neutral light: --surface-page is white, --border-strong is #b6b7bd.
  { token: "--switch-knob-bg", fixture: "default", target: THUMB, value: "#ffee00", expected: "rgb(255, 238, 0)", unset: "rgb(255, 255, 255)" },
  { token: "--switch-knob-bg-checked", fixture: "checked", target: THUMB, value: "#00eeff", expected: "rgb(0, 238, 255)", unset: "rgb(255, 255, 255)" },
  { token: "--switch-track-hover-bg", fixture: "default", target: ROOT, hover: true, value: "#33ccaa", expected: "rgb(51, 204, 170)", unset: "rgb(182, 183, 189)" },
  { token: "--switch-track-hover-bg-checked", fixture: "checked", target: ROOT, hover: true, value: "#aa33cc", expected: "rgb(170, 51, 204)", unset: "rgb(182, 183, 189)" },
]

const bg = (selector: string) =>
  `getComputedStyle(document.querySelector(${JSON.stringify(selector)})).backgroundColor`

async function read(
  c: Pick<Case, "fixture" | "target" | "hover">,
  opts: Parameters<typeof open>[2] = {},
): Promise<string> {
  const page = await open("switch", c.fixture, opts)
  if (c.hover) await page.hover(ROOT)
  const value = (await page.evaluate(bg(c.target))) as string
  await page.close()
  return value
}

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close)

describe("VI-693 — switch colour hooks (real browser)", () => {
  for (const c of CASES) {
    const label = `${c.token} → switch/${c.fixture}${c.hover ? " :hover" : ""}`

    it(`${label}: unset, it computes what 1.34.0 ships (${c.unset})`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(c)).toBe(c.unset)
    }, 30_000)

    it(`${label}: set, it computes the key`, async (ctx) => {
      if (!ready()) return ctx.skip()
      expect(await read(c, { scopeCss: `${c.token}: ${c.value};` })).toBe(c.expected)
    }, 30_000)
  }

  it("the checked knob does not follow knob-bg", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read({ fixture: "checked", target: THUMB }, { scopeCss: "--switch-knob-bg: #ffee00;" })).toBe("rgb(255, 255, 255)")
  }, 30_000)

  it("the unchecked hover does not follow track-hover-bg-checked, nor the reverse", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect(await read({ fixture: "default", target: ROOT, hover: true }, { scopeCss: "--switch-track-hover-bg-checked: #aa33cc;" })).toBe("rgb(182, 183, 189)")
    expect(await read({ fixture: "checked", target: ROOT, hover: true }, { scopeCss: "--switch-track-hover-bg: #33ccaa;" })).toBe("rgb(182, 183, 189)")
  }, 30_000)
})

// ── WCAG 1.4.11 on a dark, borderless theme, through the engine ─────────────

function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((n) => {
    const c = Number(n) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** blacklight-app's own YAML, with `components.switch` merged in. */
function blacklightCss(switchKeys: Record<string, unknown>): string {
  const doc = parse(readFileSync(join(process.cwd(), "custom-themes/blacklight-app.visor.yaml"), "utf-8"))
  doc.components = { ...doc.components, switch: switchKeys }
  return docsAdapter(generateThemeData(stringify(doc)), { includeFontImports: false })
}

// The track Blacklight's editor draws its switch on.
const TRACK = { "track-bg": { dark: "#383838" } }
const BOUND = {
  ...TRACK,
  "knob-bg": { dark: "#d4d4d4" },
  "track-hover-bg": { dark: "#4a4a4a" },
  "track-hover-bg-checked": { dark: "#2ce0e6" },
}

async function openDark(fixture: string, switchKeys: Record<string, unknown>): Promise<PageLike> {
  return open("switch", fixture, { theme: { css: blacklightCss(switchKeys), className: "blacklight-app-theme", mode: "dark" } })
}

describe("VI-693 — blacklight-app (dark, borderless), keys emitted by the engine", () => {
  it("unbound, the black knob on the #383838 track is under 3:1; knob-bg lifts it over", async (ctx) => {
    if (!ready()) return ctx.skip()
    const measure = async (keys: Record<string, unknown>) => {
      const page = await openDark("default", keys)
      const [knob, track] = (await page.evaluate(`[${bg(THUMB)}, ${bg(ROOT)}]`)) as string[]
      await page.close()
      return { knob, track, ratio: contrast(knob, track) }
    }
    const unbound = await measure(TRACK)
    const bound = await measure(BOUND)
    console.info(
      `[VI-693] blacklight-app dark, unchecked: unbound knob ${unbound.knob} on ${unbound.track} = ${unbound.ratio.toFixed(2)}:1; ` +
        `knob-bg ${bound.knob} on ${bound.track} = ${bound.ratio.toFixed(2)}:1`,
    )
    expect(unbound.track).toBe("rgb(56, 56, 56)")
    expect(unbound.knob).toBe("rgb(0, 0, 0)")
    expect(unbound.ratio).toBeLessThan(3)
    expect(bound.knob).toBe("rgb(212, 212, 212)")
    expect(bound.ratio).toBeGreaterThanOrEqual(3)
  }, 30_000)

  it("unbound, the hovered track vanishes (border-strong is transparent); track-hover-bg keeps it", async (ctx) => {
    if (!ready()) return ctx.skip()
    const hovered = async (fixture: string, keys: Record<string, unknown>) => {
      const page = await openDark(fixture, keys)
      await page.hover(ROOT)
      const value = (await page.evaluate(bg(ROOT))) as string
      await page.close()
      return value
    }
    expect(await hovered("default", TRACK)).toBe("rgba(0, 0, 0, 0)")
    expect(await hovered("checked", TRACK)).toBe("rgba(0, 0, 0, 0)")
    expect(await hovered("default", BOUND)).toBe("rgb(74, 74, 74)")
    expect(await hovered("checked", BOUND)).toBe("rgb(44, 224, 230)")
  }, 30_000)
})
