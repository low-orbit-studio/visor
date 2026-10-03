// @vitest-environment node
/**
 * VI-680 — the one switch for hairlines, as a source sweep.
 *
 * Every hairline (a rule, divider or ring coloured by `--hairline` /
 * `--hairline-strong`) must read its weight from `--hairline-width`, so a
 * single `--hairline-width: 0` turns them all off. This is the hairline mirror
 * of control-edge-tokens.test.ts: it runs everywhere (no browser) and fails the
 * moment a consumer hard-codes a width again.
 *
 * Colour-only declarations (`border-color`, `outline-color`,
 * `background-color`) draw no weight, so they are out of scope — and so are
 * the form-control edges, which the independent VI-655 switch governs.
 */

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"

const REPO_ROOT = process.cwd()
const ROOTS = ["components", "blocks"]

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "__tests__") continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (name.endsWith(".module.css")) out.push(full)
  }
  return out
}

/** Remove every `var(--hairline-width, …)` expression, balancing parentheses. */
function stripHairlineWidth(value: string): string {
  const marker = "var(--hairline-width"
  let out = value
  for (let at = out.indexOf(marker); at !== -1; at = out.indexOf(marker)) {
    let depth = 0
    let end = at
    for (; end < out.length; end++) {
      if (out[end] === "(") depth++
      else if (out[end] === ")" && --depth === 0) break
    }
    out = out.slice(0, at) + out.slice(end + 1)
  }
  return out
}

/** Properties that carry a weight: borders, rings and the `--*-border*` hooks. */
const WEIGHT_PROPERTY = /^(border(-(top|right|bottom|left))?|border-image|box-shadow|outline|--[a-z0-9-]*border[a-z0-9-]*)$/

/** A visible `border` — the one thing a hairline may not be painted with. */
const BORDER_PROPERTY = /^(border(-(top|right|bottom|left))?|--[a-z0-9-]*border[a-z0-9-]*)$/

/**
 * `border-image` and `outline` do not apply to a collapsed-border table cell, so
 * these two stay real borders (VI-680). Table's cell rule shares its edge with
 * the row rule, so removing it moves nothing; MatrixTable's tightens by 1px.
 */
const COLLAPSED_TABLES = new Set([
  "components/ui/table/table.module.css",
  "components/ui/matrix-table/matrix-table.module.css",
])

/**
 * Every weight-carrying declaration that paints with a hairline colour but does
 * not read `--hairline-width`, or still carries a literal width beside it.
 */
export function hairlineWidthViolations(css: string, opts: { allowBorder?: boolean } = {}): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const found: string[] = []
  for (const match of withoutComments.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)/g)) {
    const [, property, raw] = match
    const value = raw.replace(/\s+/g, " ").trim()
    if (!WEIGHT_PROPERTY.test(property)) continue
    if (!/var\(\s*--hairline(?:-strong)?\b(?!-width)/.test(value)) continue
    // VI-680: a hairline is never painted with `border` — the border keeps its
    // width and the paint is an outline, border-image or inset shadow, so
    // --hairline-width: 0 moves nothing.
    if (!opts.allowBorder && BORDER_PROPERTY.test(property)) {
      found.push(`${property}: ${value} (painted with border)`)
      continue
    }
    const rest = stripHairlineWidth(value)
    if (rest === value) found.push(`${property}: ${value} (no --hairline-width)`)
    else if (/\b\d*\.?\d+px\b/.test(rest) || /--stroke-width-/.test(rest)) {
      found.push(`${property}: ${value} (literal width)`)
    }
  }
  return found
}

const FILES = ROOTS.flatMap((root) => walk(join(REPO_ROOT, root)))

describe("VI-680 — every hairline consumer reads --hairline-width", () => {
  it("finds the consumers it is meant to sweep", () => {
    const readers = FILES.filter((f) => readFileSync(f, "utf-8").includes("var(--hairline-width"))
    expect(readers.length).toBeGreaterThanOrEqual(18)
  })

  for (const file of FILES) {
    const css = readFileSync(file, "utf-8")
    if (!/var\(\s*--hairline/.test(css)) continue
    it(`${relative(REPO_ROOT, file)} holds no literal hairline width`, () => {
      const rel = relative(REPO_ROOT, file)
      expect(hairlineWidthViolations(css, { allowBorder: COLLAPSED_TABLES.has(rel) })).toEqual([])
    })
  }

  it("the editorial dropdown separator keeps its 1px box and paints the line at --hairline-width", () => {
    const css = readFileSync(join(REPO_ROOT, "components/ui/dropdown-menu/dropdown-menu.module.css"), "utf-8")
    expect(css).toMatch(/\[data-density="editorial"\]\) \.separator \{[^}]*box-shadow: inset 0 0 0 var\(--hairline-width, 1px\)/)
  })

  it("mutation control — a consumer left on a literal width IS caught", () => {
    const ok = ".a { border-bottom: 1px solid transparent; border-image: linear-gradient(var(--hairline), var(--hairline)) 1 / 0 0 var(--hairline-width, 1px) 0; outline: var(--hairline-width, 1px) solid var(--hairline); }"
    expect(hairlineWidthViolations(ok)).toEqual([])

    const painted = ".a { border-bottom: var(--hairline-width, 1px) solid var(--hairline, #e5e7eb); }"
    expect(hairlineWidthViolations(painted)).toHaveLength(1)
    expect(hairlineWidthViolations(painted, { allowBorder: true })).toEqual([])

    const literal = ".a { border-bottom: 1px solid var(--hairline, #e5e7eb); }"
    expect(hairlineWidthViolations(literal)).toHaveLength(1)

    const stroke = ".a { outline: var(--stroke-width-thin, 1px) solid\n    var(--hairline, #e5e7eb); }"
    expect(hairlineWidthViolations(stroke)).toHaveLength(1)

    const ring = ".a { box-shadow: inset 0 0 0 1px var(--hairline, transparent), var(--shadow-lg); }"
    expect(hairlineWidthViolations(ring)).toHaveLength(1)

    const hook = ".a { --x-border: 1px solid var(--hairline-strong, #ddd); }"
    expect(hairlineWidthViolations(hook, { allowBorder: true })).toHaveLength(1)
  })

  it("does not flag colour-only declarations or comments", () => {
    const css = `/* border: 1px solid var(--hairline); */
      .a { border-color: var(--hairline, #e5e7eb); outline-color: var(--hairline-strong, #ddd);
           background-color: var(--hairline, transparent); border: 1px solid var(--border-default); }`
    expect(hairlineWidthViolations(css)).toEqual([])
  })
})
