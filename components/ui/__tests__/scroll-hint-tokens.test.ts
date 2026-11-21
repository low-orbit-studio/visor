// @vitest-environment node
/**
 * VI-814 — ScrollHint and useKeepGoing, proven in a real browser.
 *
 *  - **Shows and hides with the scroll.** At the top of the fixture's scroll box the
 *    hint has `data-show` and the pill computes opacity 1; scrolled to the end it has
 *    neither.
 *  - **Keep Going finds and focuses.** `go()` with f7 pending scrolls f7 to about a
 *    fifth of the way down the box and focuses its input.
 *  - **Glass off by default.** With no switch the pill is a solid chip (opaque fill,
 *    a visible ring, no backdrop-filter) on two themes. Inside `data-glass="on"` it is
 *    the page colour at 70% with the glass control blur and no ring; a nested
 *    `data-glass="off"` turns it solid again.
 *  - **Bound tokens move the pixels.**
 *
 * Skips where Chromium is unavailable (playwright is an optional dep); the CI glass
 * step sets VISOR_REQUIRE_BROWSER so it cannot silently skip there.
 */

import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { resolveThemeCssFile } from "../../../packages/cli/src/commands/render"
import { close, launch, open, ready, type PageLike } from "./render-page"

const BOX = `document.querySelector("#root [data-slot=scroll-box]")`
const HINT = `document.querySelector("#root [data-slot=scroll-hint]")`

// Colours go through a canvas so color-mix() and rgb() compare as the same 8-bit pixels.
const READ = `(function () {
  var hint = ${HINT}; var pill = hint.querySelector("button"); var scope = document.getElementById("theme-scope");
  var cv = document.createElement("canvas"); cv.width = cv.height = 1; var x = cv.getContext("2d");
  var norm = function (c) { x.clearRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); var d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3]].join(","); };
  var probe = function (v) { var d = document.createElement("div"); d.style.color = v; pill.appendChild(d); var c = getComputedStyle(d).color; d.remove(); return norm(c); };
  var cs = getComputedStyle(pill);
  var ring = /rgba?\\([^)]*\\)|color\\([^)]*\\)|#[0-9a-f]+/i.exec(cs.boxShadow);
  return JSON.stringify({
    show: hint.hasAttribute("data-show"),
    opacity: cs.opacity,
    filter: cs.backdropFilter,
    bg: norm(cs.backgroundColor),
    ring: ring ? norm(ring[0]) : "none",
    color: norm(cs.color),
    card: probe("var(--surface-card)"),
    border: probe("var(--border-default)"),
    secondary: probe("var(--text-secondary)"),
    page70: probe("color-mix(in srgb, var(--surface-page) 70%, transparent)"),
    controlBlur: getComputedStyle(scope).getPropertyValue("--glass-on-control-blur").trim(),
  });
})()`

interface Read {
  show: boolean; opacity: string; filter: string; bg: string; ring: string; color: string
  card: string; border: string; secondary: string; page70: string; controlBlur: string
}

type Opts = NonNullable<Parameters<typeof open>[2]>
const THEMES: Record<string, Opts> = {
  "neutral light": {},
  "space dark": {
    theme: { css: readFileSync(resolveThemeCssFile(process.cwd(), "space")!, "utf-8"), className: "space-theme", mode: "dark" },
  },
}

const alpha = (rgba: string) => Number(rgba.split(",")[3])
const read = async (page: PageLike) => JSON.parse((await page.evaluate(READ)) as string) as Read
const scrollBoxTo = (page: PageLike, top: string) =>
  page.evaluate(`(function () { var b = ${BOX}; b.scrollTop = ${top}; b.dispatchEvent(new Event("scroll")); })()`)

beforeAll(async () => {
  await launch()
}, 60_000)

afterAll(close, 30_000)

describe("VI-814 — ScrollHint (real browser)", () => {
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(ready()).toBe(true)
  })

  it("shows at the top and hides at the end of the scroll", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("scroll-hint", "default")
    await page.waitForFunction(`${HINT}.hasAttribute("data-show")`, undefined, { timeout: 5000 })
    const top = await read(page)
    expect(top.show).toBe(true)
    expect(top.opacity).toBe("1")
    await scrollBoxTo(page, `${BOX}.scrollHeight`)
    await page.waitForFunction(`!${HINT}.hasAttribute("data-show")`, undefined, { timeout: 5000 })
    const end = await read(page)
    expect(end.show).toBe(false)
    expect(end.opacity).toBe("0")
    await scrollBoxTo(page, "0")
    await page.waitForFunction(`${HINT}.hasAttribute("data-show")`, undefined, { timeout: 5000 })
    await page.close()
  }, 30_000)

  it("go() scrolls the pending field a fifth of the way down and focuses its input", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("scroll-hint", "default")
    // Reduced motion makes the scroll land at once instead of smoothing.
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.waitForFunction(`window.__keepGoing && window.__keepGoing.below`, undefined, { timeout: 5000 })
    const moved = await page.evaluate(`window.__keepGoing.go()`)
    const after = JSON.parse((await page.evaluate(`(function () {
      var b = ${BOX}; var f = b.querySelector('[data-field="f7"]');
      return JSON.stringify({
        focused: document.activeElement === f.querySelector("input"),
        scrollTop: b.scrollTop,
        offset: f.getBoundingClientRect().top - b.getBoundingClientRect().top,
        fifth: b.clientHeight * 0.2,
      });
    })()`)) as string) as { focused: boolean; scrollTop: number; offset: number; fifth: number }
    await page.close()
    expect(moved).toBe(true)
    expect(after.focused).toBe(true)
    expect(after.scrollTop).toBeGreaterThan(0)
    expect(Math.abs(after.offset - after.fifth)).toBeLessThanOrEqual(2)
  }, 30_000)

  for (const [name, opts] of Object.entries(THEMES)) {
    it(`${name}: glass off, a solid chip from the theme with no blur`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open("scroll-hint", "default", opts)
      const r = await read(page)
      await page.close()
      expect(r.filter).toBe("none")
      expect(alpha(r.bg)).toBe(255)
      expect(r.bg).toBe(r.card)
      expect(r.ring).toBe(r.border)
      expect(r.color).toBe(r.secondary)
    }, 30_000)

    it(`${name}: glass on, the page colour at 70% with the control blur and no ring`, async (ctx) => {
      if (!ready()) return ctx.skip()
      const page = await open("scroll-hint", "default", opts)
      await page.evaluate(`document.getElementById("theme-scope").setAttribute("data-glass", "on")`)
      const on = await read(page)
      // A nested off switch turns the pill solid again.
      await page.evaluate(`${BOX}.setAttribute("data-glass", "off")`)
      const off = await read(page)
      await page.close()
      expect(on.filter).toContain("blur(")
      expect(on.filter).toBe(on.controlBlur)
      expect(on.bg).toBe(on.page70)
      expect(Math.abs(alpha(on.bg) - 0.7 * 255)).toBeLessThanOrEqual(1)
      expect(alpha(on.ring)).toBe(0)
      expect(off.filter).toBe("none")
      expect(off.bg).toBe(off.card)
    }, 30_000)
  }

  it("bound tokens move the pixels, glass off and on", async (ctx) => {
    if (!ready()) return ctx.skip()
    const page = await open("scroll-hint", "default", {
      scopeCss: "--scroll-hint-bg: #112233; --scroll-hint-border: #33ccaa; --scroll-hint-color: #aa33cc; --scroll-hint-glass-bg: #faf0e6;",
    })
    const off = await read(page)
    await page.evaluate(`document.getElementById("theme-scope").setAttribute("data-glass", "on")`)
    const on = await read(page)
    await page.close()
    expect([off.bg, off.ring, off.color]).toEqual(["17,34,51,255", "51,204,170,255", "170,51,204,255"])
    expect(on.bg).toBe("250,240,230,255")
  }, 30_000)
})
