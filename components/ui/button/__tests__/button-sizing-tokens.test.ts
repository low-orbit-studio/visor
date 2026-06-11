/**
 * Button per-size sizing hooks (CSS-only, additive, zero-regression)
 *
 * Reconciles canonical Button sizing against the blessed admin reference build.
 * The blessed build runs md buttons at a 34px (2.125rem) fixed height with
 * line-height:normal and sm buttons at a 13px (0.8125rem) font-size. To let a
 * consumer overlay re-drive those metrics without forking this stylesheet, the
 * divergent values are wired through CSS hooks. Each hook FALLS BACK to the
 * value canonical rendered before this pass, so an unset hook is byte-identical
 * to the prior behavior (zero-regression).
 *
 * Pattern follows dropdown-menu-editorial-tokens.test.ts: readFileSync the CSS
 * and assert the exact hook strings.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(
  resolve(__dirname, "..", "button.module.css"),
  "utf-8"
)

describe("Button per-size sizing hooks (CSS-only, additive, zero-regression)", () => {
  describe(".sizeMd hooks", () => {
    it("height wraps --button-height-md, defaulting to canonical 2.5rem", () => {
      expect(css).toContain("height: var(--button-height-md, 2.5rem);")
    })

    it("line-height wraps --button-line-height-md, defaulting to canonical 1", () => {
      expect(css).toContain("line-height: var(--button-line-height-md, 1);")
    })
  })

  describe(".sizeSm hooks", () => {
    it("font-size wraps --button-font-size-sm, defaulting to var(--font-size-xs, 0.75rem)", () => {
      expect(css).toContain(
        "font-size: var(--button-font-size-sm, var(--font-size-xs, 0.75rem));"
      )
    })
  })
})
