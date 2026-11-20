/**
 * The glass recipe's backdrop-filter survives a consumer CSS build (VI-795, after VI-788).
 * Lightning CSS keeps only the last of an unprefixed / -webkit- pair whose value holds a
 * var(), so the recipe writes the prefixed line first. This compiles it the way Next.js 16 does.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { transform } from "lightningcss"
import { describe, expect, it } from "vitest"

// Next.js 16's default browserslist: Chrome/Edge/Firefox 111, Safari 16.4.
const targets = { chrome: 111 << 16, edge: 111 << 16, firefox: 111 << 16, safari: (16 << 16) | (4 << 8) }

const built = transform({
  filename: "glass-specimen.module.css",
  code: readFileSync(resolve(__dirname, "..", "glass-specimen.module.css")),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("glass recipe backdrop-filter after a Lightning CSS build", () => {
  it.each([
    ["glass layer", "var(--glass-on-blur,none)"],
    ["control", "var(--glass-on-control-blur,none)"],
  ])("%s keeps both the unprefixed and -webkit- declarations", (_, value) => {
    expect(built).toContain(`;backdrop-filter:${value}`)
    expect(built).toContain(`-webkit-backdrop-filter:${value}`)
  })
})
