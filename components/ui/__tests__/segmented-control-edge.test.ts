// @vitest-environment node
/**
 * VI-615 — the SegmentedControl's selected-state edge, proven in a real browser.
 *
 * The active pill carries a 1px inset ring at --control-state-edge-width (the
 * width focus and invalid use), coloured --segmented-control-indicator-edge
 * (default --text-primary), so the selected state keeps a 3:1 boundary of its
 * own (WCAG 2.2 1.4.11). It survives `--control-edge-width: 0`, shifts nothing,
 * and `transparent` turns it off. The mutation control removes the edge and
 * proves the measurement sees it go.
 *
 * Skips where Chromium or esbuild is unavailable.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { close, launch, open, ready } from "./render-page"

const PILL = `document.querySelector("#root [data-slot=segmented-control] > [aria-hidden=true]")`
const READ = `(function () {
  var pill = ${PILL}; var root = document.querySelector("#root [data-slot=segmented-control]");
  var cs = getComputedStyle(pill); var shadow = cs.boxShadow;
  var m = shadow.match(/(rgba?\\([^)]*\\))\\s+0px 0px 0px (\\d+(?:\\.\\d+)?)px inset/);
  var r = pill.getBoundingClientRect(), t = root.getBoundingClientRect();
  var probe = function (v) { var d = document.createElement("div"); d.style.color = v; document.getElementById("root").appendChild(d); var c = getComputedStyle(d).color; d.remove(); return c; };
  var cv = document.createElement("canvas"); cv.width = cv.height = 1; var x = cv.getContext("2d");
  var norm = function (c) { x.clearRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); var d = x.getImageData(0, 0, 1, 1).data; return "rgba(" + d[0] + ", " + d[1] + ", " + d[2] + ", " + (d[3] / 255) + ")"; };
  return JSON.stringify({ shadow: shadow, color: m ? norm(m[1]) : null, width: m ? parseFloat(m[2]) : 0, pill: [r.x, r.y, r.width, r.height], root: [t.x, t.y, t.width, t.height], ink: norm(probe("var(--text-primary)")), fill: norm(cs.backgroundColor), rootBg: norm(getComputedStyle(root).backgroundColor) });
})()`

type Edge = { shadow: string; color: string | null; width: number; pill: number[]; root: number[]; ink: string; fill: string; rootBg: string }

async function read(opts: { scopeCss?: string; extraCss?: string } = {}): Promise<Edge> {
  const page = await open("segmented-control", "default", opts)
  await page.waitForFunction(`${PILL}.style.opacity === "1"`, undefined, { timeout: 5000 })
  const out = JSON.parse((await page.evaluate(READ)) as string) as Edge
  await page.close()
  return out
}

const channels = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
const lum = (c: number[]) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const ratio = (a: number[], b: number[]) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

beforeAll(async () => { await launch() }, 60_000)
afterAll(close)

describe("SegmentedControl state edge (real browser)", () => {
  it("draws a 1px inset edge on the active pill, in --text-primary", async (ctx) => {
    if (!ready()) return ctx.skip()
    const e = await read()
    expect(e.width).toBe(1)
    expect(e.shadow).toContain("inset")
    expect(e.color).toBe(e.ink)
  })

  it("sits at --control-state-edge-width", async (ctx) => {
    if (!ready()) return ctx.skip()
    expect((await read({ scopeCss: "--control-state-edge-width: 3px;" })).width).toBe(3)
  })

  it("survives the edge switch (--control-edge-width: 0 and 0px)", async (ctx) => {
    if (!ready()) return ctx.skip()
    for (const zero of ["0", "0px"]) expect((await read({ scopeCss: `--control-edge-width: ${zero};` })).width, zero).toBe(1)
  })

  it("is turned off by binding the colour to transparent", async (ctx) => {
    if (!ready()) return ctx.skip()
    const e = await read({ scopeCss: "--segmented-control-indicator-edge: transparent;" })
    expect(e.color).toBe("rgba(0, 0, 0, 0)")
  })

  it("shifts nothing: pill and track boxes are identical with and without the edge", async (ctx) => {
    if (!ready()) return ctx.skip()
    const on = await read()
    const off = await read({ scopeCss: "--segmented-control-indicator-edge: transparent;" })
    expect(on.pill).toEqual(off.pill)
    expect(on.root).toEqual(off.root)
  })

  it("reaches 3:1 against the pill and the well (neutral light), and says what the fill alone gives", async (ctx) => {
    if (!ready()) return ctx.skip()
    const e = await read()
    const edge = channels(e.ink), fill = channels(e.fill), well = channels(e.rootBg)
    expect(ratio(edge, fill)).toBeGreaterThanOrEqual(3)
    expect(ratio(edge, well)).toBeGreaterThanOrEqual(3)
    // The fill alone is under 3:1 against the well here: that is why the edge exists.
    expect(ratio(fill, well)).toBeLessThan(3)
  })

  it("mutation control: with the edge removed, the measurement reads no edge", async (ctx) => {
    if (!ready()) return ctx.skip()
    const e = await read({ extraCss: `[data-slot=segmented-control] > [aria-hidden=true]{box-shadow:none!important}` })
    expect(e.width).toBe(0)
    expect(e.color).toBeNull()
  })
})

describe("SegmentedControl type and radius tokens (real browser)", () => {
  const TYPE = `JSON.stringify((function () {
    var root = document.querySelector("#root [data-slot=segmented-control]");
    var on = root.querySelector("[data-state=on]"), off = root.querySelector("[data-state=off]");
    return { track: getComputedStyle(root).borderTopLeftRadius, segment: getComputedStyle(on).borderTopLeftRadius, activeWeight: getComputedStyle(on).fontWeight, inactiveWeight: getComputedStyle(off).fontWeight, inactiveColor: getComputedStyle(off).color };
  })())`
  const run = async (scopeCss = "") => {
    const page = await open("segmented-control", "default", { scopeCss })
    const out = JSON.parse((await page.evaluate(TYPE)) as string) as Record<string, string>
    await page.close()
    return out
  }

  it("unbound: track keeps its ToggleGroup radius, medium weight on both labels, text-primary inactive ink", async (ctx) => {
    if (!ready()) return ctx.skip()
    const e = await run()
    expect(e.track).toBe("8px") // md: --radius-lg
    expect(e.activeWeight).toBe(e.inactiveWeight)
    expect(e.inactiveColor).toBe("rgb(26, 26, 31)")
  })

  it("--segmented-control-radius sets the track radius and leaves the segments", async (ctx) => {
    if (!ready()) return ctx.skip()
    const base = await run()
    const e = await run("--segmented-control-radius: 5px;")
    expect(e.track).toBe("5px")
    expect(e.segment).toBe(base.segment)
  })

  it("--segmented-control-active-weight and -inactive-text bind the label type", async (ctx) => {
    if (!ready()) return ctx.skip()
    const e = await run("--segmented-control-active-weight: 700; --segmented-control-inactive-text: rgb(1, 2, 3);")
    expect(e.activeWeight).toBe("700")
    expect(e.inactiveWeight).not.toBe("700")
    expect(e.inactiveColor).toBe("rgb(1, 2, 3)")
  })
})

describe("SegmentedControl reserves each label's width (real browser)", () => {
  // Item boxes, the track and the pill, in order, after selecting each segment in turn.
  const SWEEP = `(async function () {
    var items = [].slice.call(document.querySelectorAll("#root [data-slot=toggle-group-item]"));
    var root = document.querySelector("#root [data-slot=segmented-control]");
    var pill = root.querySelector(":scope > [aria-hidden=true]");
    var wait = function () { return new Promise(function (r) { setTimeout(r, 60); }); };
    var out = [];
    for (var i = 0; i < items.length; i++) {
      items[i].click(); await wait();
      var boxes = items.map(function (el) { var r = el.getBoundingClientRect(); return [r.x, r.width]; });
      var t = root.getBoundingClientRect();
      out.push({ on: i, boxes: boxes, track: [t.x, t.width], active: items[i].getAttribute("data-state") });
    }
    return JSON.stringify(out);
  })()`
  type Sweep = { on: number; boxes: number[][]; track: number[]; active: string }[]
  const sweep = async (extraCss = ""): Promise<Sweep> => {
    const page = await open("segmented-control", "default", { scopeCss: "--segmented-control-active-weight: 600;", extraCss })
    await page.waitForFunction(`${PILL}.style.opacity === "1"`, undefined, { timeout: 5000 })
    const out = JSON.parse((await page.evaluate(SWEEP)) as string) as Sweep
    await page.close()
    return out
  }
  const same = (s: Sweep) => s.every((r) => JSON.stringify(r.boxes) === JSON.stringify(s[0].boxes) && JSON.stringify(r.track) === JSON.stringify(s[0].track))

  it("with active-weight 600 bound, every segment's box and x position are identical whichever segment is on", async (ctx) => {
    if (!ready()) return ctx.skip()
    const s = await sweep()
    expect(s.map((r) => r.active)).toEqual(["on", "on", "on"])
    expect(same(s), JSON.stringify(s)).toBe(true)
  })

  it("mutation control: without the reservation the segments shift and the measurement sees it", async (ctx) => {
    if (!ready()) return ctx.skip()
    const s = await sweep(`[data-slot=toggle-group-item] [aria-hidden=true]{display:none!important}`)
    expect(same(s)).toBe(false)
  })
})
