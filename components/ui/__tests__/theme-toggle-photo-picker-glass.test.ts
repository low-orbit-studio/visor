// @vitest-environment node
/**
 * VI-816 — ThemeToggle and PhotoPicker read the glass layer and the theme.
 *
 * Source: each module's blur sits behind `var(--glass-on-control-blur, none)`, so glass is
 * off by default, the prefixed line comes first (VI-788), and no glass literal is written
 * outside a var() fallback.
 * Browser: with no switch the toggle is solid (theme surface, border, ink, no blur); inside
 * `data-glass="on"` it takes the glass layer's control fill, ring, ink and blur. The chosen
 * thumbnail's ring is the theme's key colour (`--interactive-primary-bg`) in both.
 *
 * The browser half skips where Chromium or esbuild is unavailable.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { close, launch, open, ready } from "./render-page"

const UI = join(process.cwd(), "components/ui")
const TOGGLE_CSS = readFileSync(join(UI, "theme-toggle/theme-toggle.module.css"), "utf8")
const PICKER_CSS = readFileSync(join(UI, "photo-picker/photo-picker.module.css"), "utf8")
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "")

describe("ThemeToggle and PhotoPicker glass (source)", () => {
  it("ThemeToggle blurs only through the glass switch, prefixed line first", () => {
    const css = strip(TOGGLE_CSS)
    const lines = css.split("\n").map((l) => l.trim()).filter((l) => /backdrop-filter:/.test(l))
    expect(lines).toEqual([
      "-webkit-backdrop-filter: var(--glass-on-control-blur, none);",
      "backdrop-filter: var(--glass-on-control-blur, none);",
    ])
  })

  it("ThemeToggle reads the glass control fill, hover fill, ring and ink before the theme's own", () => {
    const css = strip(TOGGLE_CSS)
    expect(css).toContain("var(--theme-toggle-bg, var(--glass-on-control-fill, var(--surface-subtle")
    expect(css).toContain("var(--theme-toggle-bg-hover, var(--glass-on-control-hover-fill, var(--surface-muted")
    expect(css).toContain("var(--theme-toggle-ring, var(--glass-on-control-ring, var(--border-default")
    expect(css).toContain("var(--theme-toggle-color, var(--glass-on-control-ink, var(--text-primary")
    // Round even where the theme draws squircles.
    expect(css).toContain("--corner-shape: round;")
  })

  it("no glass literal outside a var() fallback, and PhotoPicker draws no blur of its own", () => {
    for (const css of [strip(TOGGLE_CSS), strip(PICKER_CSS)]) {
      expect(css).not.toMatch(/(?<!var\(--[\w-]+, )blur\(/)
      expect(css).not.toMatch(/rgba?\(\s*255/)
    }
    expect(strip(PICKER_CSS)).not.toContain("backdrop-filter")
  })

  it("both read the theme's motion: the enter curve, and the enter duration for the wave", () => {
    expect(TOGGLE_CSS).toContain("var(--theme-toggle-ease, var(--motion-easing-enter,")
    expect(PICKER_CSS).toContain("var(--photo-picker-ease, var(--motion-easing-enter,")
    expect(PICKER_CSS).toContain("var(--motion-duration-enter, var(--motion-duration-800, 800ms))")
  })
})

// Colours are read through a canvas so color-mix() and rgb() compare as the same 8-bit pixels.
const READ_TOGGLE = `(function () {
  var el = document.querySelector("#root [data-slot=theme-toggle]");
  var cv = document.createElement("canvas"); cv.width = cv.height = 1; var x = cv.getContext("2d");
  var norm = function (c) { x.clearRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1); return [].join.call(x.getImageData(0, 0, 1, 1).data, ","); };
  var probe = function (v) { var d = document.createElement("div"); d.style.color = v; el.parentElement.appendChild(d); var c = getComputedStyle(d).color; d.remove(); return norm(c); };
  var cs = getComputedStyle(el);
  return JSON.stringify({
    filter: cs.backdropFilter, bg: norm(cs.backgroundColor), ink: norm(cs.color), shadow: cs.boxShadow,
    surface: probe("var(--surface-subtle)"), text: probe("var(--text-primary)"),
    controlFill: probe("var(--glass-on-control-fill)"), controlInk: probe("var(--glass-on-control-ink)"),
    controlBlur: getComputedStyle(el).getPropertyValue("--glass-on-control-blur").trim(),
  });
})()`

const READ_PICKER = `(function () {
  var el = document.querySelector("#root [data-slot=photo-picker] [aria-pressed=true]");
  var d = document.createElement("div"); d.style.color = "var(--interactive-primary-bg)"; el.appendChild(d);
  var key = getComputedStyle(d).color; d.remove();
  return JSON.stringify({ shadow: getComputedStyle(el).boxShadow, key: key, filter: getComputedStyle(el.parentElement).backdropFilter });
})()`

type Toggle = {
  filter: string; bg: string; ink: string; shadow: string
  surface: string; text: string; controlFill: string; controlInk: string; controlBlur: string
}

async function read<T>(component: string, fixture: string, expr: string): Promise<T> {
  const page = await open(component, fixture)
  const out = JSON.parse((await page.evaluate(expr)) as string) as T
  await page.close()
  return out
}

beforeAll(async () => { await launch() }, 60_000)
afterAll(close, 30_000)

describe("ThemeToggle and PhotoPicker glass (real browser)", () => {
  it.runIf(process.env.VISOR_REQUIRE_BROWSER)("runs in Chromium", () => {
    expect(ready(), "playwright's chromium or esbuild is not installed").toBe(true)
  })

  it("ThemeToggle with glass off: theme surface and ink, no blur", async (ctx) => {
    if (!ready()) return ctx.skip()
    const r = await read<Toggle>("theme-toggle", "default", READ_TOGGLE)
    expect(r.filter).toBe("none")
    expect(r.bg).toBe(r.surface)
    expect(r.ink).toBe(r.text)
  })

  it("ThemeToggle with glass on: the glass layer's control fill, ink and blur", async (ctx) => {
    if (!ready()) return ctx.skip()
    const r = await read<Toggle>("theme-toggle", "glass", READ_TOGGLE)
    expect(r.controlBlur).toContain("blur(")
    expect(r.filter).toBe(r.controlBlur)
    expect(r.bg).toBe(r.controlFill)
    expect(r.bg).not.toBe(r.surface)
    expect(r.ink).toBe(r.controlInk)
  })

  it("PhotoPicker's chosen ring is the key colour, with glass off and on, and the grid never blurs", async (ctx) => {
    if (!ready()) return ctx.skip()
    for (const fixture of ["default", "glass"]) {
      const r = await read<{ shadow: string; key: string; filter: string }>("photo-picker", fixture, READ_PICKER)
      expect(r.shadow, fixture).toContain(r.key)
      expect(r.filter, fixture).toBe("none")
    }
  })
})
