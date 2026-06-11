/**
 * DropdownMenu density axis (data-density="editorial")
 *
 * Verifies that dropdown-menu.module.css carries the first-class density rules
 * that bake in the editorial admin treatment. The old --dropdown-* hook layer
 * (PL-1626) has been retired; values are now expressed as
 * :global([data-density="editorial"]) .localClass { ... } rules, switched by
 * placing data-density="editorial" on any ancestor element.
 *
 * Default (no data-density attr) rendering must be byte-identical to the
 * pre-refactor canonical fallbacks — verified implicitly by the canonical
 * literals present in the default rules.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { describe, it, expect } from "vitest"

const css = readFileSync(
  resolve(__dirname, "..", "dropdown-menu.module.css"),
  "utf-8"
)

describe("DropdownMenu density axis — editorial rules present", () => {
  describe("content / subContent — editorial block", () => {
    it("editorial content has gap: 1px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.content[^}]*\{[^}]*gap:\s*1px/
      )
    })

    it("editorial content has border-radius: var(--radius-md)", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.content[^}]*\{[^}]*border-radius:\s*var\(--radius-md\)/
      )
    })

    it("editorial content background uses --surface-elev with color-mix fallback", () => {
      expect(css).toContain("var(--surface-elev, color-mix(in srgb, var(--surface-card), var(--surface-muted, var(--surface-card))))")
    })

    it("editorial content has padding: 6px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.content[^}]*\{[^}]*padding:\s*6px/
      )
    })

    it("editorial content box-shadow has inset hairline ring", () => {
      expect(css).toContain(
        "inset 0 0 0 1px var(--hairline, var(--border-subtle, transparent))"
      )
    })
  })

  describe("item — editorial block", () => {
    it("editorial item has font-size: 13px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item[^}]*\{[^}]*font-size:\s*13px/
      )
    })

    it("editorial item has padding: 8px 10px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item[^}]*\{[^}]*padding:\s*8px 10px/
      )
    })

    it("editorial item has gap: var(--spacing-3)", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item[^}]*\{[^}]*gap:\s*var\(--spacing-3\)/
      )
    })

    it("editorial item has border-radius: var(--radius-sm)", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item[^}]*\{[^}]*border-radius:\s*var\(--radius-sm\)/
      )
    })

    it("editorial item hover uses --surface-subtle", () => {
      expect(css).toContain("background-color: var(--surface-subtle);")
    })
  })

  describe("leading icon — editorial block", () => {
    it("editorial .item > svg has color: var(--text-tertiary)", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item > svg[^}]*\{[^}]*color:\s*var\(--text-tertiary\)/
      )
    })

    it("editorial .item > svg has width: 16px and height: 16px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item > svg[^}]*\{[^}]*width:\s*16px/
      )
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.item > svg[^}]*\{[^}]*height:\s*16px/
      )
    })
  })

  describe("destructive item — editorial block", () => {
    it("editorial destructive hover uses color-mix 14% destructive", () => {
      expect(css).toContain(
        "color-mix(in srgb, var(--destructive) 14%, transparent)"
      )
    })
  })

  describe("label — editorial block", () => {
    it("editorial label has font-size: 11px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.label[^}]*\{[^}]*font-size:\s*11px/
      )
    })

    it("editorial label has text-transform: uppercase", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.label[^}]*\{[^}]*text-transform:\s*uppercase/
      )
    })

    it("editorial label has letter-spacing: 0.08em", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.label[^}]*\{[^}]*letter-spacing:\s*0\.08em/
      )
    })

    it("editorial label has color: var(--text-tertiary)", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.label[^}]*\{[^}]*color:\s*var\(--text-tertiary\)/
      )
    })

    it("editorial label has padding: 6px 10px 2px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.label[^}]*\{[^}]*padding:\s*6px 10px 2px/
      )
    })
  })

  describe("shortcut — editorial block", () => {
    it("editorial shortcut has font-size: 11px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.shortcut[^}]*\{[^}]*font-size:\s*11px/
      )
    })

    it("editorial shortcut has color: var(--text-muted)", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.shortcut[^}]*\{[^}]*color:\s*var\(--text-muted\)/
      )
    })

    it("editorial shortcut has letter-spacing: 0.04em", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.shortcut[^}]*\{[^}]*letter-spacing:\s*0\.04em/
      )
    })
  })

  describe("separator — editorial block", () => {
    it("editorial separator uses --hairline for background", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.separator[^}]*\{[^}]*background-color:\s*var\(--hairline/
      )
    })

    it("editorial separator has margin: 4px 2px", () => {
      expect(css).toMatch(
        /\[data-density="editorial"\][^}]*\.separator[^}]*\{[^}]*margin:\s*4px 2px/
      )
    })
  })

  describe("default (canonical) rules still present — zero regression", () => {
    it("default content has gap: 0px", () => {
      expect(css).toContain("gap: 0px;")
    })

    it("default content background uses surface-popover chain", () => {
      expect(css).toContain(
        "background-color: var(--surface-popover, var(--surface-card, #ffffff));"
      )
    })

    it("default content has padding: var(--spacing-1, 0.25rem)", () => {
      expect(css).toContain("padding: var(--spacing-1, 0.25rem);")
    })

    it("default item has font-size: var(--font-size-sm, 0.875rem)", () => {
      expect(css).toContain("font-size: var(--font-size-sm, 0.875rem);")
    })

    it("default item has padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem)", () => {
      expect(css).toContain(
        "padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);"
      )
    })

    it("default hover bg uses surface-interactive-hover chain", () => {
      expect(css).toContain(
        "background-color: var(--surface-interactive-hover, #f3f4f6);"
      )
    })

    it("default label color uses text-secondary chain", () => {
      expect(css).toContain("color: var(--text-secondary, #6b7280);")
    })

    it("default separator color uses border-default chain", () => {
      expect(css).toContain(
        "background-color: var(--border-default, #e5e7eb);"
      )
    })
  })
})
