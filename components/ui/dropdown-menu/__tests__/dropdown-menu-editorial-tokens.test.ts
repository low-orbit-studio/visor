/**
 * PL-1626: DropdownMenu editorial token hooks (CSS-only, additive, zero-regression)
 *
 * Verifies the full --dropdown-* editorial hook layer ported from the blessed
 * admin reference build is present in dropdown-menu.module.css. Every hook FALLS
 * BACK to the literal value the component rendered before the editorial pass, so
 * default rendering of any existing consumer is byte-identical until a prototype
 * tokens.css sets the editorial value centrally.
 *
 * Pattern follows table.test.tsx's "editorial token hooks" block: readFileSync
 * the CSS and assert the exact hook strings.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(
  resolve(__dirname, "..", "dropdown-menu.module.css"),
  "utf-8"
)

describe("DropdownMenu editorial token hooks (CSS-only, additive, zero-regression)", () => {
  describe("content / subContent hooks", () => {
    it("gap wraps --dropdown-content-gap, defaulting to 0px", () => {
      expect(css).toContain("gap: var(--dropdown-content-gap, 0px);")
    })

    it("radius wraps --dropdown-content-radius, defaulting to var(--radius-lg, 0.5rem)", () => {
      expect(css).toContain(
        "border-radius: var(--dropdown-content-radius, var(--radius-lg, 0.5rem));"
      )
    })

    it("background wraps --dropdown-content-bg, defaulting to the popover/card chain", () => {
      expect(css).toContain(
        "background-color: var(--dropdown-content-bg, var(--surface-popover, var(--surface-card, #ffffff)));"
      )
    })

    it("padding wraps --dropdown-content-padding, defaulting to var(--spacing-1, 0.25rem)", () => {
      expect(css).toContain(
        "padding: var(--dropdown-content-padding, var(--spacing-1, 0.25rem));"
      )
    })

    it("box-shadow exposes --dropdown-content-ring and --dropdown-content-shadow", () => {
      expect(css).toContain("var(--dropdown-content-ring, 0 0 #0000)")
      expect(css).toContain("var(--dropdown-content-shadow, var(--shadow-lg))")
    })
  })

  describe("item hooks", () => {
    it("gap wraps --dropdown-item-gap, defaulting to the original calc()", () => {
      expect(css).toContain(
        "gap: var(--dropdown-item-gap, calc(var(--spacing-2, 0.5rem) + var(--spacing-1, 0.25rem) / 2));"
      )
    })

    it("radius wraps --dropdown-item-radius, defaulting to var(--radius-md, 0.375rem)", () => {
      expect(css).toContain(
        "border-radius: var(--dropdown-item-radius, var(--radius-md, 0.375rem));"
      )
    })

    it("padding wraps --dropdown-item-padding, defaulting to the original spacing", () => {
      expect(css).toContain(
        "padding: var(--dropdown-item-padding, var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem));"
      )
    })

    it("font-size wraps --dropdown-item-font-size, defaulting to var(--font-size-sm, 0.875rem)", () => {
      expect(css).toContain(
        "font-size: var(--dropdown-item-font-size, var(--font-size-sm, 0.875rem));"
      )
    })

    it("hover background wraps --dropdown-item-hover-bg, defaulting to var(--surface-interactive-hover, #f3f4f6)", () => {
      expect(css).toContain(
        "background-color: var(--dropdown-item-hover-bg, var(--surface-interactive-hover, #f3f4f6));"
      )
    })
  })

  describe("leading-icon hooks", () => {
    it(".item > svg color wraps --dropdown-item-icon-color, defaulting to currentColor", () => {
      expect(css).toMatch(/\.item > svg \{[\s\S]*?color: var\(--dropdown-item-icon-color, currentColor\);/)
    })

    it(".item > svg size wraps --dropdown-item-icon-size, defaulting to 1em", () => {
      expect(css).toContain("width: var(--dropdown-item-icon-size, 1em);")
      expect(css).toContain("height: var(--dropdown-item-icon-size, 1em);")
    })

    it(".subTrigger > svg leading-icon rule is present and tokenized", () => {
      expect(css).toMatch(
        /\.subTrigger > svg:not\(\.subTriggerIcon\) \{[\s\S]*?color: var\(--dropdown-item-icon-color, currentColor\);/
      )
    })
  })

  describe("destructive-item hooks", () => {
    it(".itemDestructive > svg icon color wraps --dropdown-item-destructive-icon-color", () => {
      expect(css).toContain(
        "color: var(--dropdown-item-destructive-icon-color, var(--text-error, var(--destructive, #ef4444)));"
      )
    })

    it("destructive hover background wraps --dropdown-item-destructive-hover-bg", () => {
      expect(css).toContain(
        "background-color: var(--dropdown-item-destructive-hover-bg, var(--surface-error-subtle, rgba(239, 68, 68, 0.1)));"
      )
    })
  })

  describe("label hooks (editorial section heading)", () => {
    it("padding wraps --dropdown-label-padding", () => {
      expect(css).toContain("padding: var(--dropdown-label-padding,")
    })

    it("font-size wraps --dropdown-label-font-size, defaulting to var(--font-size-xs, 0.75rem)", () => {
      expect(css).toContain(
        "font-size: var(--dropdown-label-font-size, var(--font-size-xs, 0.75rem));"
      )
    })

    it("font-weight wraps --dropdown-label-font-weight, defaulting to inherit", () => {
      expect(css).toContain("font-weight: var(--dropdown-label-font-weight, inherit);")
    })

    it("letter-spacing wraps --dropdown-label-letter-spacing, defaulting to normal", () => {
      expect(css).toContain(
        "letter-spacing: var(--dropdown-label-letter-spacing, normal);"
      )
    })

    it("text-transform wraps --dropdown-label-text-transform, defaulting to none", () => {
      expect(css).toContain(
        "text-transform: var(--dropdown-label-text-transform, none);"
      )
    })

    it("color wraps --dropdown-label-color, defaulting to var(--text-secondary, #6b7280)", () => {
      expect(css).toContain(
        "color: var(--dropdown-label-color, var(--text-secondary, #6b7280));"
      )
    })
  })

  describe("shortcut hooks", () => {
    it("font-size wraps --dropdown-shortcut-font-size, defaulting to var(--font-size-xs, 0.75rem)", () => {
      expect(css).toContain(
        "font-size: var(--dropdown-shortcut-font-size, var(--font-size-xs, 0.75rem));"
      )
    })

    it("letter-spacing wraps --dropdown-shortcut-letter-spacing, defaulting to 0.1em", () => {
      expect(css).toContain(
        "letter-spacing: var(--dropdown-shortcut-letter-spacing, 0.1em);"
      )
    })

    it("color wraps --dropdown-shortcut-color, defaulting to var(--text-secondary, #6b7280)", () => {
      expect(css).toContain(
        "color: var(--dropdown-shortcut-color, var(--text-secondary, #6b7280));"
      )
    })

    it(".subTriggerIcon color wraps --dropdown-shortcut-color, defaulting to currentColor", () => {
      expect(css).toContain("color: var(--dropdown-shortcut-color, currentColor);")
    })
  })

  describe("separator hooks", () => {
    it("margin wraps --dropdown-separator-margin", () => {
      expect(css).toContain("margin: var(--dropdown-separator-margin,")
    })

    it("color wraps --dropdown-separator-color, defaulting to var(--border-default, #e5e7eb)", () => {
      expect(css).toContain(
        "background-color: var(--dropdown-separator-color, var(--border-default, #e5e7eb));"
      )
    })
  })
})
