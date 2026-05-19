/**
 * Tailwind 4 @theme tests.
 *
 * The v4 sibling export is just a CSS string — verify its structure and
 * that it references the same Visor variables as the v3 preset.
 */

import { describe, expect, it } from "vitest"

import { buildVisorTailwindV4Theme, visorTailwindV4Theme } from "../v4.js"
import { listExposedTokens } from "../tokens.js"

describe("buildVisorTailwindV4Theme", () => {
  it("starts with a comment and opens an @theme block", () => {
    const css = buildVisorTailwindV4Theme()
    expect(css).toMatch(/@theme \{/)
    expect(css.trimEnd().endsWith("}")).toBe(true)
  })

  it("default export is the build output", () => {
    expect(visorTailwindV4Theme).toBe(buildVisorTailwindV4Theme())
  })

  it("emits a Tailwind 4-prefixed declaration for every Visor token the v3 preset exposes", () => {
    const css = buildVisorTailwindV4Theme()
    for (const token of listExposedTokens()) {
      // Every Visor variable should appear inside a var() lookup.
      expect(
        css.includes(`var(--${token})`),
        `v4 @theme should reference Visor token --${token}`
      ).toBe(true)
    }
  })

  it("declares the canonical Tailwind 4 namespaces (--color-*, --spacing-*, --text-*, --shadow-*, --radius-*, --duration-*, --ease-*)", () => {
    const css = buildVisorTailwindV4Theme()
    expect(css).toContain("--color-")
    expect(css).toContain("--spacing-")
    expect(css).toContain("--text-")
    expect(css).toContain("--shadow-")
    expect(css).toContain("--radius-")
    expect(css).toContain("--duration-")
    expect(css).toContain("--ease-")
    expect(css).toContain("--font-")
  })

  it("Tailwind 4 spacing keys preserve `3.5` and `4.5` literally — never split", () => {
    const css = buildVisorTailwindV4Theme()
    // `.` becomes `-` in v4 namespace lookups; verify the encoded forms exist
    // (e.g. `--spacing-3-5: var(--spacing-3_5);`)
    expect(css).toContain("--spacing-3-5: var(--spacing-3_5);")
    expect(css).toContain("--spacing-4-5: var(--spacing-4_5);")
  })

  it("color tokens are not double-prefixed — `--color-primary-500`, not `--color-color-primary-500`", () => {
    const css = buildVisorTailwindV4Theme()
    expect(css).toContain("--color-primary-500: var(--color-primary-500);")
    expect(css).toContain("--color-neutral-900: var(--color-neutral-900);")
    expect(css).not.toContain("--color-color-")
  })

  it("semantic color tokens land under --color-* so Tailwind 4 emits `bg-text-primary`, `bg-surface-card`", () => {
    const css = buildVisorTailwindV4Theme()
    expect(css).toContain("--color-text-primary: var(--text-primary);")
    expect(css).toContain("--color-surface-card: var(--surface-card);")
    expect(css).toContain("--color-border-default: var(--border-default);")
    expect(css).toContain(
      "--color-interactive-primary-bg: var(--interactive-primary-bg);"
    )
  })
})
