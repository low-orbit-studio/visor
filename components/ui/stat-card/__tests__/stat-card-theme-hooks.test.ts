/**
 * VI-782: StatCard theme hooks. Each hook falls back to the value that shipped
 * before it, so a theme that binds nothing renders exactly as it did.
 * The computed proof in Chromium is `npm run parity:component-tokens`.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(resolve(__dirname, "..", "stat-card.module.css"), "utf-8")

/** The declarations of one top-level rule, e.g. `.base`. */
function rule(selector: string): string {
  const match = css.match(new RegExp(`^\\${selector} \\{([^}]*)\\}`, "m"))
  if (!match) throw new Error(`no ${selector} rule`)
  return match[1]
}

describe("StatCard theme hooks", () => {
  it.each([
    [".base", "padding: var(--stat-card-padding, var(--spacing-5, 1.25rem));"],
    [".base", "border: var(--stat-card-border, 1px solid var(--border-default, #e5e7eb));"],
    [".base", "border-radius: var(--stat-card-radius, var(--radius-lg, 0.75rem));"],
    [".base", "box-shadow: var(--stat-card-shadow, var(--shadow-xs, 0 1px 2px 0 rgb(0 0 0 / 0.05)));"],
    [".footer", "border-top: var(--stat-card-footer-border, 1px solid var(--border-default, #e5e7eb));"],
    [".footer", "font-size: var(--stat-card-footer-font-size, var(--font-size-sm, 0.875rem));"],
    [".footer", "font-weight: var(--stat-card-footer-font-weight, inherit);"],
    [".footer", "line-height: var(--stat-card-footer-line-height, var(--line-height-normal, 1.5));"],
    [".footer", "color: var(--stat-card-footer-color, var(--text-secondary, #6b7280));"],
    [".value", "font-family: var(--stat-card-value-font-family, var(--font-family-heading, inherit));"],
    [".value", "font-size: var(--stat-card-value-font-size, var(--font-size-3xl, 1.875rem));"],
    [".value", "font-weight: var(--stat-card-value-font-weight, var(--font-weight-semibold, 600));"],
    [".value", "line-height: var(--stat-card-value-line-height, var(--line-height-tight, 1.1));"],
    [".value", "letter-spacing: var(--stat-card-value-letter-spacing, var(--letter-spacing-tight, -0.02em));"],
    [".label", "font-size: var(--stat-card-label-font-size, var(--font-size-xs, 0.75rem));"],
    [".label", "font-weight: var(--stat-card-label-font-weight, var(--font-weight-semibold, 600));"],
    [".label", "line-height: var(--stat-card-label-line-height, var(--line-height-tight, 1.25));"],
    [".label", "letter-spacing: var(--stat-card-label-letter-spacing, var(--letter-spacing-wide, 0.05em));"],
    [".label", "color: var(--stat-card-label-color, var(--text-tertiary, #6b7280));"],
  ])("%s reads %s", (selector, decl) => {
    expect(rule(selector)).toContain(decl)
  })

  it("uses longhands, never a font shorthand, so an unbound label and footer keep inheriting their family", () => {
    for (const selector of [".label", ".value", ".footer"]) {
      expect(rule(selector)).not.toMatch(/^\s*font:/m)
    }
  })

  it("leaves the size, variant and value treatments their own rules", () => {
    expect(rule(".sizeSm")).toContain("padding: var(--spacing-4, 1rem);")
    expect(rule(".variantHighlight")).toContain("box-shadow:")
    expect(css).toMatch(/\.value\[data-value-as="hero"\] \{[^}]*font-size: var\(--stat-card-value-size-hero/)
  })
})
