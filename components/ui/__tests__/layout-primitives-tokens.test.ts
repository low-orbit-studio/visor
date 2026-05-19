/**
 * VI-427: Layout Primitives Token Coverage Test
 *
 * Verifies that the five layout primitives (Box, Stack, Inline, Grid,
 * Container) reference Visor CSS custom properties for every spacing,
 * surface, radius, border, and stroke-width value — no hard-coded literals.
 *
 * Hard-coded literals are allowed only in the var() fallback position
 * (the second argument), per the project's token-rules.md.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const COMPONENTS_DIR = resolve(__dirname, "..")

function readCSS(component: string): string {
  return readFileSync(
    resolve(COMPONENTS_DIR, component, `${component}.module.css`),
    "utf-8"
  )
}

const LAYOUT_PRIMITIVES = ["box", "stack", "inline", "grid", "container"] as const

describe("VI-427 layout primitives — token coverage", () => {
  it.each(LAYOUT_PRIMITIVES)(
    "%s references Visor design tokens via var(--*) at least once",
    (name) => {
      const css = readCSS(name)
      // Every primitive must reference at least one Visor token.
      expect(css).toMatch(/var\(--/)
    }
  )

  it.each(LAYOUT_PRIMITIVES)(
    "%s does not hard-code spacing pixels outside of var() fallbacks or container max-widths",
    (name) => {
      const css = readCSS(name)
      // Strip var(...) fallback regions and CSS comments.
      const stripped = css
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/var\([^)]*\)/g, "")

      // Container intentionally encodes max-width literals (640/768/1024/1280)
      // because they are layout breakpoints, not design tokens. Allow those.
      const lines = stripped.split("\n")
      for (const line of lines) {
        if (line.includes("max-width") || line.includes("container-max-width")) continue
        // No bare pixel values for padding/margin/gap/border-width
        const offending = /(padding|margin|gap|border-width)\s*:\s*\d+px/.test(
          line
        )
        expect(offending, `Hard-coded pixel value in ${name}:\n${line}`).toBe(
          false
        )
      }
    }
  )

  it("Box references --spacing-* via the SPACING_MAP", () => {
    const tsx = readFileSync(
      resolve(COMPONENTS_DIR, "box", "box.tsx"),
      "utf-8"
    )
    expect(tsx).toContain("var(--spacing-1")
    expect(tsx).toContain("var(--spacing-4")
    expect(tsx).toContain("var(--spacing-16")
    expect(tsx).toContain("var(--radius-")
  })

  it("Box surface bg resolves to a --surface-* variable", () => {
    const tsx = readFileSync(
      resolve(COMPONENTS_DIR, "box", "box.tsx"),
      "utf-8"
    )
    expect(tsx).toContain("var(--surface-")
  })

  it("Box border resolves to a --border-* variable", () => {
    const tsx = readFileSync(
      resolve(COMPONENTS_DIR, "box", "box.tsx"),
      "utf-8"
    )
    expect(tsx).toContain("var(--border-")
  })

  it("Stack/Inline/Grid all expose responsive gap via per-breakpoint vars", () => {
    for (const name of ["stack", "inline", "grid"] as const) {
      const css = readCSS(name)
      expect(css).toContain(`--${name}-gap`)
      expect(css).toMatch(new RegExp(`--${name}-gap-sm`))
      expect(css).toMatch(new RegExp(`--${name}-gap-md`))
      expect(css).toMatch(new RegExp(`--${name}-gap-lg`))
      expect(css).toMatch(new RegExp(`--${name}-gap-xl`))
    }
  })

  it("Grid exposes responsive columns via per-breakpoint vars", () => {
    const css = readCSS("grid")
    expect(css).toContain("--grid-cols")
    expect(css).toContain("--grid-cols-sm")
    expect(css).toContain("--grid-cols-md")
    expect(css).toContain("--grid-cols-lg")
    expect(css).toContain("--grid-cols-xl")
  })

  it("Container declares all five size variants", () => {
    const css = readCSS("container")
    expect(css).toContain(".sizeSm")
    expect(css).toContain(".sizeMd")
    expect(css).toContain(".sizeLg")
    expect(css).toContain(".sizeXl")
    expect(css).toContain(".sizeFull")
  })
})
