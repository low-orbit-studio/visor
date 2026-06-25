/**
 * AvatarStack ring role hook + editorial overflow density (VI-578)
 *
 * Absorbs the two consumer-side rules that PL-1638 placed in the org build's
 * prototype-overlay.css into canonical Visor:
 *   1. The disc ring becomes a per-surface role hook (`--avatar-stack-ring`),
 *      defaulting to `--surface-default` so existing consumers stay byte-identical.
 *   2. The "+N" overflow font is an editorial density treatment (11px), removing
 *      the consumer's `--font-size-sm: 11px` data-slot hack.
 *
 * jsdom does not apply CSS-module rules, so — like dropdown-menu-editorial-tokens —
 * these assertions read the stylesheet source and verify the rules are present and
 * the canonical default literals are preserved.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(
  resolve(__dirname, "..", "avatar-stack.module.css"),
  "utf-8",
)

describe("AvatarStack ring — per-surface role hook", () => {
  it("ring box-shadow reads through the --avatar-stack-ring role hook", () => {
    expect(css).toMatch(
      /\.avatar\s*\{[^}]*box-shadow:[^;]*var\(--avatar-stack-ring,/,
    )
  })

  it("default ring color stays --surface-default (byte-identical for existing consumers)", () => {
    expect(css).toContain(
      "var(--avatar-stack-ring, var(--surface-default, #ffffff))",
    )
  })

  it("ring still uses the medium stroke-width token", () => {
    expect(css).toMatch(
      /\.avatar\s*\{[^}]*box-shadow:\s*0 0 0 var\(--stroke-width-medium, 2px\)/,
    )
  })
})

describe("AvatarStack overflow — editorial density font", () => {
  it("editorial density pins the overflow disc font-size to 11px", () => {
    expect(css).toMatch(
      /\[data-density="editorial"\][^}]*\.overflowDisc[^}]*\{[^}]*font-size:\s*11px/,
    )
  })

  it("the overflow font rule is editorial-scoped (default density unchanged)", () => {
    // The scoped selector must be present...
    expect(css).toMatch(
      /:global\(\[data-density="editorial"\]\)\s*\.overflowDisc\s*\{/,
    )
    // ...and once the editorial block is stripped, no other `.overflowDisc`
    // font-size rule may remain that would alter default density.
    const withoutEditorial = css.replace(
      /:global\(\[data-density="editorial"\]\)\s*\.overflowDisc\s*\{[^}]*\}/g,
      "",
    )
    expect(withoutEditorial).not.toMatch(/\.overflowDisc\s*\{[^}]*font-size/)
  })
})
