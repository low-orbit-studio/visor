/**
 * VI-783: OTPInput size hooks. Each hook falls back to the value that shipped
 * before it, so an unbound theme renders exactly as it did.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(
  resolve(__dirname, "..", "otp-input.module.css"),
  "utf-8"
)

describe("OTPInput size hooks", () => {
  it.each([
    "width: var(--otp-cell-width, 2.5rem);",
    "height: var(--otp-cell-height, 2.75rem);",
    "font-size: var(--otp-cell-font-size, var(--font-size-lg, 1.125rem));",
    "border-radius: var(--otp-cell-radius, var(--radius-md, 0.375rem));",
    "gap: var(--otp-gap, var(--spacing-2, 0.5rem));",
  ])("binds %s with the shipped fallback", (decl) => {
    expect(css).toContain(decl)
  })

  it("lets cells stretch: the row fills its wrapper and a cell can shrink below its intrinsic width", () => {
    expect(css).toMatch(/\.row \{[^}]*min-width: 100%;/)
    expect(css).toMatch(/\.cell \{[^}]*min-width: 0;/)
  })
})
