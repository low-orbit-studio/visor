// @vitest-environment node
/**
 * VI-803 — SegmentedControl's well and the glass layer, proven in a real browser.
 *
 * Glass off (no switch): the well renders no backdrop-filter and draws exactly
 * what it drew before VI-803 (the 12% ink well, the primary pill).
 * Glass on (`data-glass="on"` on an ancestor): the well blurs with the glass
 * layer's control blur and, unbound, takes its control fill. A theme's own
 * `track-bg` still wins under glass, which is how the honcho-backstage theme
 * keeps the kit's field-fill well in every look.
 *
 * Skips where Chromium or esbuild is unavailable.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { close, launch, open, ready } from "./render-page"

const ROOT = `document.querySelector("#root [data-slot=segmented-control]")`
// Colours are read through a canvas so color-mix() and rgb() compare as the same 8-bit pixels.
const READ = `(function () {
  var root = ${ROOT}; var pill = root.querySelector(":scope > [aria-hidden=true]");
  var cv = document.createElement("canvas"); cv.width = cv.height = 1; var x = cv.getContext("2d");
  var norm = function (c) { x.clearRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); var d = x.getImageData(0, 0, 1, 1).data; return d[0] + "," + d[1] + "," + d[2] + "," + d[3]; };
  var probe = function (v) { var d = document.createElement("div"); d.style.color = v; root.appendChild(d); var c = getComputedStyle(d).color; d.remove(); return norm(c); };
  var rs = getComputedStyle(root);
  var blurred = [root].concat([].slice.call(root.querySelectorAll("*"))).filter(function (el) { return el !== root && getComputedStyle(el).backdropFilter !== "none"; }).length;
  return JSON.stringify({
    filter: rs.backdropFilter, bg: norm(rs.backgroundColor), pill: norm(getComputedStyle(pill).backgroundColor),
    blurredInside: blurred,
    well: probe("color-mix(in srgb, var(--text-primary) 12%, var(--surface-page))"),
    primary: probe("var(--interactive-primary-bg)"),
    controlFill: probe("var(--glass-on-control-fill)"),
    controlBlur: rs.getPropertyValue("--glass-on-control-blur").trim(),
  });
})()`

type Read = {
  filter: string; bg: string; pill: string; blurredInside: number
  well: string; primary: string; controlFill: string; controlBlur: string
}

async function read(opts: { glass?: "on" | "off"; scopeCss?: string } = {}): Promise<Read> {
  const page = await open("segmented-control", "default", { scopeCss: opts.scopeCss })
  if (opts.glass) await page.evaluate(`document.getElementById("theme-scope").setAttribute("data-glass", "${opts.glass}")`)
  await page.waitForFunction(`${ROOT}.querySelector(":scope > [aria-hidden=true]").style.opacity === "1"`, undefined, { timeout: 5000 })
  const out = JSON.parse((await page.evaluate(READ)) as string) as Read
  await page.close()
  return out
}

// The honcho-backstage binding (dark tone), the way the theme emits it.
const KIT = `--segmented-control-track-bg: rgba(255, 255, 255, 0.09);
  --segmented-control-indicator-bg: rgba(255, 255, 255, 0.2); --segmented-control-indicator-edge: transparent;`

beforeAll(async () => { await launch() }, 60_000)
afterAll(close, 30_000)

describe("SegmentedControl well and glass (real browser)", () => {
  // Build & Test shards have no Chromium and self-skip; the CI glass step sets
  // VISOR_REQUIRE_BROWSER, so the proof cannot silently skip there.
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(ready(), "playwright's chromium or esbuild is not installed").toBe(true)
  })

  it("glass off: no blur, and the well and pill are the shipped look", async (ctx) => {
    if (!ready()) return ctx.skip()
    for (const glass of [undefined, "off"] as const) {
      const r = await read({ glass })
      expect(r.filter, String(glass)).toBe("none")
      expect(r.blurredInside).toBe(0)
      expect(r.bg).toBe(r.well)
      expect(r.pill).toBe(r.primary)
    }
  })

  it("glass on: the well blurs with the glass layer's control blur and takes its control fill", async (ctx) => {
    if (!ready()) return ctx.skip()
    const r = await read({ glass: "on" })
    expect(r.controlBlur).toContain("blur(")
    expect(r.filter).toBe(r.controlBlur)
    expect(r.bg).toBe(r.controlFill)
    // Only the well blurs: the pill and the labels carry no filter of their own.
    expect(r.blurredInside).toBe(0)
  })

  it("a theme's track-bg wins under glass; the blur stays", async (ctx) => {
    if (!ready()) return ctx.skip()
    const on = await read({ glass: "on", scopeCss: KIT })
    expect(on.filter).toBe(on.controlBlur)
    expect(on.bg).not.toBe(on.controlFill)
    const off = await read({ scopeCss: KIT })
    expect(off.filter).toBe("none")
    // Off and on draw the same well colour: glass adds only the blur.
    expect(off.bg).toBe(on.bg)
    expect(off.pill).toBe(on.pill)
  })
})
