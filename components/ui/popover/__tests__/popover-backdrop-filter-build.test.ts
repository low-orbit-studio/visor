/**
 * Popover's glass blur survives a consumer CSS build (VI-808)
 *
 * Next.js consumers compile CSS modules with Lightning CSS, which keeps only the
 * last of two backdrop-filter lines with a var() value when the prefixed one comes
 * second (VI-788). This compiles the real stylesheet the way Next.js 16 does and
 * checks both lines, and that the stay-mounted wrapper rule keeps its :has().
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
  filename: "popover.module.css",
  code: readFileSync(resolve(__dirname, "..", "popover.module.css")),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("Popover backdrop-filter after a Lightning CSS build", () => {
  it("keeps both the unprefixed and -webkit- glass blur", () => {
    expect(built).toContain(";backdrop-filter:var(--glass-on-blur,none)")
    expect(built).toContain("-webkit-backdrop-filter:var(--glass-on-blur,none)")
  })

  it("keeps the display: contents rule on Radix's wrapper around stay-mounted content", () => {
    expect(built).toMatch(/\[data-radix-popper-content-wrapper\]:has\(>\s?\.[\w-]*stayMounted[\w-]*\)\{display:contents\}/)
  })
})
