/**
 * Dialog backdrop-filter hooks survive a consumer CSS build (VI-788)
 *
 * Next.js consumers compile CSS modules with Lightning CSS. Given an unprefixed
 * `backdrop-filter` followed by `-webkit-backdrop-filter` with a var() value, it
 * keeps only the last line, so Chromium (unprefixed-only) lost the blur hooks.
 * This compiles the real stylesheet the way Next.js 16 does and checks both lines.
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
  filename: "dialog.module.css",
  code: readFileSync(resolve(__dirname, "..", "dialog.module.css")),
  minify: true,
  cssModules: true,
  targets,
}).code.toString()

describe("Dialog backdrop-filter after a Lightning CSS build", () => {
  it.each([
    ["overlay", "blur(var(--dialog-overlay-blur,4px))"],
    ["editorial overlay", "blur(var(--dialog-overlay-blur,2px))"],
    ["content", "var(--dialog-backdrop-filter,none)"],
  ])("%s keeps both the unprefixed and -webkit- declarations", (_, value) => {
    expect(built).toContain(`;backdrop-filter:${value}`)
    expect(built).toContain(`-webkit-backdrop-filter:${value}`)
  })
})
