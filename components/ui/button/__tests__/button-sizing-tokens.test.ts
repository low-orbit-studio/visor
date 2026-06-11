/**
 * Button density axis (CSS-only, zero-regression)
 *
 * Canonical defaults are inlined as plain values. Under data-density="editorial"
 * (set on any ancestor), the editorial density axis bakes in the blessed admin
 * values — md buttons at 2.125rem height with line-height:normal, sm buttons at
 * 0.8125rem font-size.
 *
 * Default (no data-density) rendering is byte-identical to the prior fallback
 * behavior (zero-regression).
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(
  resolve(__dirname, "..", "button.module.css"),
  "utf-8"
)

describe("Button density axis (CSS-only, zero-regression)", () => {
  describe(".sizeMd canonical defaults", () => {
    it("height is inlined as canonical 2.5rem (no hook indirection)", () => {
      expect(css).toContain("height: 2.5rem;")
    })

    it("line-height is inlined as canonical 1 (no hook indirection)", () => {
      expect(css).toContain("line-height: 1;")
    })
  })

  describe(".sizeSm canonical defaults", () => {
    it("font-size is inlined as canonical var(--font-size-xs, 0.75rem) (no hook indirection)", () => {
      expect(css).toContain("font-size: var(--font-size-xs, 0.75rem);")
    })
  })

  describe("editorial density rules", () => {
    it("editorial sizeMd sets height: 2.125rem", () => {
      expect(css).toContain(
        ':global([data-density="editorial"]) .sizeMd'
      )
      expect(css).toContain("height: 2.125rem;")
    })

    it("editorial sizeMd sets line-height: normal", () => {
      expect(css).toContain("line-height: normal;")
    })

    it("editorial sizeSm sets font-size: 0.8125rem", () => {
      expect(css).toContain(
        ':global([data-density="editorial"]) .sizeSm'
      )
      expect(css).toContain("font-size: 0.8125rem;")
    })
  })
})
