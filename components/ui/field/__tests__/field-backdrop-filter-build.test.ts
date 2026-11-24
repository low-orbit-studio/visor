/**
 * FieldControl's glass blur survives a consumer CSS build (VI-805, after VI-788)
 *
 * Next.js consumers compile CSS modules with Lightning CSS, which keeps only the
 * last of an unprefixed and a -webkit- `backdrop-filter` pair written in the
 * wrong order. This compiles the real stylesheet the way Next.js 16 does and
 * checks both lines survive.
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

const built = transform({
  filename: "field.module.css",
  code: readFileSync(resolve(__dirname, "..", "field.module.css")),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("FieldControl backdrop-filter after a Lightning CSS build", () => {
  it("keeps both the unprefixed and -webkit- declarations", () => {
    const value = "var(--glass-on-control-blur,none)"
    expect(built).toContain(`;backdrop-filter:${value}`)
    expect(built).toContain(`-webkit-backdrop-filter:${value}`)
  })
})
