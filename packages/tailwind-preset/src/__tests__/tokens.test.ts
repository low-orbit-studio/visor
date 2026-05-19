/**
 * Token map tests.
 *
 * Asserts every Visor token mapping is non-empty, well-formed, and surfaces
 * the categories the ticket promised (colors / spacing / fontFamily / fontSize
 * / borderRadius / boxShadow / transitionDuration / transitionTimingFunction).
 */

import { describe, expect, it } from "vitest"

import {
  borderRadiusTokens,
  boxShadowTokens,
  colorTokens,
  expandFlatMap,
  expandNestedMap,
  fontFamilyTokens,
  fontSizeTokens,
  listExposedTokens,
  setDeep,
  spacingTokens,
  transitionDurationTokens,
  transitionTimingFunctionTokens,
  visorTokenMaps,
} from "../tokens.js"

describe("visorTokenMaps", () => {
  it("exposes every Tailwind theme key the ticket lists", () => {
    expect(Object.keys(visorTokenMaps).sort()).toEqual(
      [
        "borderRadius",
        "borderWidth",
        "boxShadow",
        "colors",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "opacity",
        "ringWidth",
        "spacing",
        "transitionDuration",
        "transitionTimingFunction",
        "zIndex",
      ].sort()
    )
  })

  it("uses non-empty maps", () => {
    for (const [key, map] of Object.entries(visorTokenMaps)) {
      expect(Object.keys(map).length, `${key} must not be empty`).toBeGreaterThan(0)
    }
  })

  it("never emits a token name that includes the -- prefix", () => {
    for (const [key, map] of Object.entries(visorTokenMaps)) {
      for (const [path, value] of Object.entries(map)) {
        expect(
          value.startsWith("--"),
          `${key}.${path} must store the token name without --`
        ).toBe(false)
      }
    }
  })

  it("covers the canonical color buckets — primitives, semantics, sidebar, chart", () => {
    const paths = Object.keys(colorTokens)
    expect(paths.some((p) => p.startsWith("color.primary."))).toBe(true)
    expect(paths.some((p) => p.startsWith("color.neutral."))).toBe(true)
    expect(paths.some((p) => p.startsWith("color.success."))).toBe(true)
    expect(paths.some((p) => p.startsWith("text."))).toBe(true)
    expect(paths.some((p) => p.startsWith("surface."))).toBe(true)
    expect(paths.some((p) => p.startsWith("border."))).toBe(true)
    expect(paths.some((p) => p.startsWith("interactive."))).toBe(true)
    expect(paths.some((p) => p.startsWith("chart."))).toBe(true)
    expect(paths.some((p) => p.startsWith("sidebar."))).toBe(true)
  })

  it("includes the canonical spacing scale slots", () => {
    expect(spacingTokens).toHaveProperty("0")
    expect(spacingTokens).toHaveProperty("4")
    expect(spacingTokens).toHaveProperty("24")
    expect(spacingTokens["4"]).toBe("spacing-4")
  })

  it("includes the canonical font-family slots requested by the ticket", () => {
    expect(fontFamilyTokens).toHaveProperty("sans")
    expect(fontFamilyTokens).toHaveProperty("display")
    expect(fontFamilyTokens).toHaveProperty("heading")
    expect(fontFamilyTokens).toHaveProperty("mono")
  })

  it("includes the canonical type scale slots", () => {
    expect(fontSizeTokens).toHaveProperty("xs")
    expect(fontSizeTokens).toHaveProperty("base")
    expect(fontSizeTokens).toHaveProperty("4xl")
  })

  it("includes the canonical radius slots requested by the ticket", () => {
    for (const slot of ["sm", "md", "lg", "xl", "pill"]) {
      expect(borderRadiusTokens).toHaveProperty(slot)
    }
  })

  it("includes the canonical shadow slots", () => {
    for (const slot of ["xs", "sm", "md", "lg", "xl"]) {
      expect(boxShadowTokens).toHaveProperty(slot)
    }
  })

  it("includes the canonical motion duration slots requested by the ticket", () => {
    for (const slot of ["fast", "normal", "slow"]) {
      expect(transitionDurationTokens).toHaveProperty(slot)
    }
  })

  it("includes the canonical motion easing slots", () => {
    for (const slot of ["DEFAULT", "enter", "exit", "spring"]) {
      expect(transitionTimingFunctionTokens).toHaveProperty(slot)
    }
  })
})

describe("setDeep / expandNestedMap / expandFlatMap", () => {
  it("expandNestedMap expands a dot-path map into a nested object with var() values", () => {
    const result = expandNestedMap({
      "color.primary.500": "color-primary-500",
      "color.primary.600": "color-primary-600",
    })
    expect(result).toEqual({
      color: {
        primary: {
          "500": "var(--color-primary-500)",
          "600": "var(--color-primary-600)",
        },
      },
    })
  })

  it("expandFlatMap preserves keys verbatim — `3.5` stays a leaf, not a nested object", () => {
    const result = expandFlatMap({
      "3": "spacing-3",
      "3.5": "spacing-3_5",
      "4": "spacing-4",
    })
    expect(result).toEqual({
      "3": "var(--spacing-3)",
      "3.5": "var(--spacing-3_5)",
      "4": "var(--spacing-4)",
    })
  })

  it("setDeep mutates the target with a nested chain", () => {
    const target: Record<string, unknown> = {}
    setDeep(target, "a.b.c", "val")
    expect(target).toEqual({ a: { b: { c: "val" } } })
  })

  it("setDeep handles single-segment paths", () => {
    const target: Record<string, unknown> = {}
    setDeep(target, "foo", "bar")
    expect(target).toEqual({ foo: "bar" })
  })
})

describe("listExposedTokens", () => {
  it("returns a sorted, de-duplicated list of every Visor variable name the preset wires up", () => {
    const tokens = listExposedTokens()
    expect(tokens.length).toBeGreaterThan(50)
    // Sorted
    expect([...tokens].sort()).toEqual(tokens)
    // De-duplicated
    expect(new Set(tokens).size).toBe(tokens.length)
    // Sample membership
    expect(tokens).toContain("color-primary-500")
    expect(tokens).toContain("text-primary")
    expect(tokens).toContain("surface-card")
    expect(tokens).toContain("border-default")
    expect(tokens).toContain("spacing-4")
    expect(tokens).toContain("radius-lg")
    expect(tokens).toContain("shadow-md")
    expect(tokens).toContain("motion-duration-normal")
  })
})
