/**
 * The avatar menu's glass blur survives a consumer CSS build (VI-802)
 *
 * Next.js consumers compile CSS modules with Lightning CSS, which keeps only the
 * last of two backdrop-filter lines with a var() value when the prefixed one comes
 * second (VI-788). This compiles the real stylesheet the way Next.js 16 does.
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
  filename: "profile-menu.module.css",
  code: readFileSync(resolve(__dirname, "..", "profile-menu.module.css")),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("ProfileMenu backdrop-filter after a Lightning CSS build", () => {
  it("keeps both the unprefixed and -webkit- glass blur", () => {
    expect(built).toContain(";backdrop-filter:var(--glass-on-blur,none)")
    expect(built).toContain("-webkit-backdrop-filter:var(--glass-on-blur,none)")
  })
})
