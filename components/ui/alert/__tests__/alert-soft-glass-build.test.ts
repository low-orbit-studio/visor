/**
 * Soft Alert on glass survives a consumer CSS build (VI-799)
 *
 * Next.js consumers compile CSS modules with Lightning CSS, which keeps only
 * the last of a `-webkit-backdrop-filter` / `backdrop-filter` pair when the
 * value holds a var() (VI-788). This compiles the real stylesheet the way
 * Next.js 16 does and checks both lines, and that the outline is a full ring:
 * no one-sided border or stripe anywhere in the stylesheet.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { transform } from "lightningcss"
import { describe, it, expect } from "vitest"

// Next.js 16's default browserslist: Chrome/Edge/Firefox 111, Safari 16.4.
const targets = {
  chrome: 111 << 16,
  edge: 111 << 16,
  firefox: 111 << 16,
  safari: (16 << 16) | (4 << 8),
}

const source = readFileSync(resolve(__dirname, "..", "alert.module.css"), "utf-8")

const built = transform({
  filename: "alert.module.css",
  code: Buffer.from(source),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("Soft Alert glass after a Lightning CSS build", () => {
  it("keeps both the unprefixed and -webkit- backdrop-filter declarations", () => {
    expect(built).toContain(";backdrop-filter:var(--glass-on-control-blur,none)")
    expect(built).toContain("-webkit-backdrop-filter:var(--glass-on-control-blur,none)")
  })

  it("draws the glass outline as a full inset ring, none off the switch", () => {
    expect(built).toMatch(/--_glass-ring:inset 0 0 0 var\(--stroke-width-thin,1px\)/)
    expect(built).toContain("box-shadow:var(--_glass-ring,none)")
  })

  it("has no one-sided border anywhere in the stylesheet", () => {
    const css = source.replace(/\/\*[\s\S]*?\*\//g, "")
    expect(css).not.toMatch(/border-(left|right|top|bottom|inline|block)(-start|-end)?(-width|-color|-style)?\s*:/)
  })
})
