import { describe, it, expect } from "vitest"
import { extractTokensFromCSS } from "../generate/extract-tokens.js"

describe("extractTokensFromCSS", () => {
  it("extracts simple var() references", () => {
    const css = `.btn { color: var(--text-primary); background: var(--surface-card); }`
    expect(extractTokensFromCSS(css)).toEqual([
      "--surface-card",
      "--text-primary",
    ])
  })

  it("extracts tokens from var() with fallback values", () => {
    const css = `.btn { color: var(--text-primary, #111827); }`
    expect(extractTokensFromCSS(css)).toEqual(["--text-primary"])
  })

  it("extracts tokens from nested var() fallbacks", () => {
    const css = `.ghost { background: var(--interactive-ghost-bg-hover, var(--surface-muted, #f3f4f6)); }`
    expect(extractTokensFromCSS(css)).toEqual([
      "--interactive-ghost-bg-hover",
      "--surface-muted",
    ])
  })

  it("deduplicates tokens", () => {
    const css = `
      .a { color: var(--text-primary); }
      .b { color: var(--text-primary); }
    `
    expect(extractTokensFromCSS(css)).toEqual(["--text-primary"])
  })

  it("returns sorted tokens", () => {
    const css = `.x { z: var(--z-token); a: var(--a-token); m: var(--m-token); }`
    expect(extractTokensFromCSS(css)).toEqual([
      "--a-token",
      "--m-token",
      "--z-token",
    ])
  })

  it("returns empty array for CSS without tokens", () => {
    const css = `.btn { color: red; background: blue; }`
    expect(extractTokensFromCSS(css)).toEqual([])
  })

  it("returns empty array for empty string", () => {
    expect(extractTokensFromCSS("")).toEqual([])
  })

  it("handles multiline transition shorthand with multiple tokens", () => {
    const css = `
      .base {
        transition: background-color var(--motion-duration-150, 150ms) var(--motion-easing-default, ease-in-out),
                    color var(--motion-duration-150, 150ms) var(--motion-easing-default, ease-in-out);
      }
    `
    expect(extractTokensFromCSS(css)).toEqual([
      "--motion-duration-150",
      "--motion-easing-default",
    ])
  })

  it("handles var() with whitespace after opening paren", () => {
    const css = `.btn { color: var( --text-primary ); }`
    expect(extractTokensFromCSS(css)).toEqual(["--text-primary"])
  })
})
