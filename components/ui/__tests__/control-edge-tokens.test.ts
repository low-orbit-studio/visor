/**
 * VI-655 — the CI-portable half of the one-switch edge contract.
 *
 * control-edge-switch.test.ts proves the behaviour in a real browser (and
 * self-skips where Chromium is not installed, which includes the CI shards).
 * This suite pins the two source-level rules that behaviour rests on, and runs
 * everywhere:
 *
 *  1. No governed component draws anything visible with `border`. A border may
 *     only hold box geometry: `0`, `none`, or `transparent`.
 *  2. Every governed component reads the switch, `--control-edge-width`.
 */

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const REPO_ROOT = process.cwd()

const GOVERNED = [
  "input", "textarea", "select", "checkbox", "switch",
  "tag-input", "chip", "file-upload", "empty-state", "button",
]

function readCss(component: string): string {
  return readFileSync(join(REPO_ROOT, "components/ui", component, `${component}.module.css`), "utf-8")
}

/**
 * Every `border` / `border-<side>` / `border-color` / `border-<side>-color`
 * declaration whose value could paint something. `border-radius`,
 * `border-width` and `border-style` cannot, on their own, paint.
 */
export function visibleBorderDeclarations(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const found: string[] = []
  const decl = /(?:^|[{;\s])(border(?:-(?:top|right|bottom|left))?(?:-color)?)\s*:\s*([^;}]+)/g
  for (const match of withoutComments.matchAll(decl)) {
    const [, property, raw] = match
    const value = raw.trim()
    const geometryOnly = value === "0" || value === "none" || /\btransparent\b/.test(value)
    if (!geometryOnly) found.push(`${property}: ${value}`)
  }
  return found
}

describe("VI-655 — no governed component draws anything visible with border", () => {
  for (const component of GOVERNED) {
    it(`${component} keeps every border transparent, 0 or none`, () => {
      expect(visibleBorderDeclarations(readCss(component))).toEqual([])
    })

    it(`${component} reads the switch, --control-edge-width`, () => {
      expect(readCss(component)).toContain("var(--control-edge-width")
    })
  }

  it("mutation control — a visible border IS caught", () => {
    expect(visibleBorderDeclarations(".a { border: 1px solid var(--border-default, #e5e7eb); }")).toEqual([
      "border: 1px solid var(--border-default, #e5e7eb)",
    ])
    expect(visibleBorderDeclarations(".a:hover { border-color: var(--border-strong); }")).toHaveLength(1)
    expect(visibleBorderDeclarations(".a { border-bottom: 2px dashed red }")).toHaveLength(1)
  })

  it("does not flag geometry-only borders, radius or comments", () => {
    expect(
      visibleBorderDeclarations(
        "/* border: 1px solid red; */ .a { border: 1px solid transparent; border-radius: 4px; border: 0; border: none; }",
      ),
    ).toEqual([])
  })
})
