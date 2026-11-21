/**
 * The option row's glass blur survives a consumer CSS build (VI-806, after VI-788).
 * Lightning CSS keeps only the last of an unprefixed / -webkit- pair whose value holds a
 * var(), so the stylesheet writes the prefixed line first. This compiles it the way Next.js 16 does.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { transform } from "lightningcss"
import { describe, expect, it } from "vitest"

// Next.js 16's default browserslist: Chrome/Edge/Firefox 111, Safari 16.4.
const targets = { chrome: 111 << 16, edge: 111 << 16, firefox: 111 << 16, safari: (16 << 16) | (4 << 8) }

const built = transform({
  filename: "toggle-group.module.css",
  code: readFileSync(resolve(__dirname, "..", "toggle-group.module.css")),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("ToggleGroup option row backdrop-filter after a Lightning CSS build", () => {
  it("keeps both the unprefixed and -webkit- declarations of the glass layer's control blur", () => {
    expect(built).toContain(";backdrop-filter:var(--glass-on-control-blur,none)")
    expect(built).toContain("-webkit-backdrop-filter:var(--glass-on-control-blur,none)")
  })
})
