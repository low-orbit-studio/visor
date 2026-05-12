import { render, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import {
  DesignSystemSpecimen,
  type DesignSystemSpecimenThemeEntry,
} from "../design-system-specimen"
import {
  deriveFontFamiliesFromTypography,
  labelForWeight,
  WEIGHT_LABELS,
  FONT_FAMILIES,
  type ThemeTypographyManifest,
} from "../specimen-data"

/**
 * VI-356 — Font Families specimen rows must come from the active theme's
 * loaded weights, not the hardcoded 4+3 grid. These tests cover the pure
 * derivation helper and the prop wiring on DesignSystemSpecimen end to end.
 */
describe("labelForWeight (VI-356, D2)", () => {
  it("uses canonical CSS labels for the 100-900 ladder", () => {
    expect(WEIGHT_LABELS).toEqual({
      100: "Thin",
      200: "Extra Light",
      300: "Light",
      400: "Regular",
      500: "Medium",
      600: "Semibold",
      700: "Bold",
      800: "Extra Bold",
      900: "Black",
    })
  })

  it("returns 'Regular' for 400 (not 'Book') and 'Extra Bold' for 800 (not 'Super')", () => {
    expect(labelForWeight(400)).toBe("Regular")
    expect(labelForWeight(800)).toBe("Extra Bold")
  })

  it("falls back to 'W{weight}' for non-standard weights", () => {
    expect(labelForWeight(450)).toBe("W450")
    expect(labelForWeight(950)).toBe("W950")
  })
})

describe("deriveFontFamiliesFromTypography (VI-356)", () => {
  it("returns defaults when manifest is undefined", () => {
    expect(deriveFontFamiliesFromTypography(undefined, FONT_FAMILIES)).toBe(FONT_FAMILIES)
  })

  it("derives Blacklight's five-weight grid from a body slot", () => {
    const manifest: ThemeTypographyManifest = {
      display: { family: "PP Model Plastic", weights: [300, 400, 500, 700, 800] },
      body: { family: "PP Model Mono", weights: [300, 400, 500, 700, 800] },
    }
    const result = deriveFontFamiliesFromTypography(manifest, FONT_FAMILIES)
    expect(result).toHaveLength(2)

    const heading = result.find((f) => f.token === "--font-heading")
    expect(heading?.familyName).toBe("PP Model Mono")
    expect(heading?.weights.map((w) => w.value)).toEqual([300, 400, 500, 700, 800])
    expect(heading?.weights.map((w) => w.label)).toEqual([
      "Light",
      "Regular",
      "Medium",
      "Bold",
      "Extra Bold",
    ])
  })

  it("derives a two-weight grid for themes that load only two weights", () => {
    const manifest: ThemeTypographyManifest = {
      body: { family: "Acme Sans", weights: [400, 700] },
      mono: { family: "Acme Mono", weights: [400, 700] },
    }
    const result = deriveFontFamiliesFromTypography(manifest, FONT_FAMILIES)
    const heading = result.find((f) => f.token === "--font-heading")
    const mono = result.find((f) => f.token === "--font-mono")
    expect(heading?.weights).toEqual([
      { label: "Regular", value: 400 },
      { label: "Bold", value: 700 },
    ])
    expect(mono?.weights).toEqual([
      { label: "Regular", value: 400 },
      { label: "Bold", value: 700 },
    ])
  })

  it("falls back to default heading row when no slot has body/display/heading data", () => {
    const manifest: ThemeTypographyManifest = {
      mono: { family: "Acme Mono", weights: [400, 700] },
    }
    const result = deriveFontFamiliesFromTypography(manifest, FONT_FAMILIES)
    const heading = result.find((f) => f.token === "--font-heading")
    // No heading/body/display in the manifest — heading falls back to defaults,
    // mono comes from the manifest.
    expect(heading?.weights).toEqual(
      FONT_FAMILIES.find((f) => f.token === "--font-heading")!.weights,
    )
    const mono = result.find((f) => f.token === "--font-mono")
    expect(mono?.familyName).toBe("Acme Mono")
  })

  it("prefers body over display when both are present (matches engine: body drives --font-heading)", () => {
    const manifest: ThemeTypographyManifest = {
      display: { family: "Display Face", weights: [400, 800] },
      body: { family: "Body Face", weights: [300, 700] },
    }
    const result = deriveFontFamiliesFromTypography(manifest, FONT_FAMILIES)
    const heading = result.find((f) => f.token === "--font-heading")
    expect(heading?.familyName).toBe("Body Face")
    expect(heading?.weights.map((w) => w.value)).toEqual([300, 700])
  })
})

/**
 * Returns the numeric weight values rendered inside FontShowcase cards
 * specifically — keyed off `[data-slot="font-showcase"]` so test queries
 * don't collide with color-swatch labels (50/100/200/…) elsewhere on the
 * page.
 */
function readFontShowcaseWeights(container: HTMLElement): string[] {
  const cards = container.querySelectorAll<HTMLElement>('[data-slot="font-showcase"]')
  const out: string[] = []
  cards.forEach((card) => {
    // Last <code> on each weight row carries the numeric weight (e.g. 400).
    // .weightRow > .weightMeta > code — selecting all `code` is robust to
    // CSS-module hashing because the only `code` elements inside the card
    // are the family-name token (skipped via attribute) and the per-weight
    // numerics.
    const headerToken = card.querySelector<HTMLElement>("code")
    card.querySelectorAll<HTMLElement>("code").forEach((c) => {
      if (c === headerToken) return // skip the "--font-heading" token line
      out.push(c.textContent ?? "")
    })
  })
  return out
}

describe("DesignSystemSpecimen — themeManifest wiring (VI-356)", () => {
  beforeEach(() => {
    document.body.className = ""
  })

  afterEach(() => {
    document.body.className = ""
  })

  it("renders default 4+3 weight rows when no themeManifest is provided", () => {
    const { container } = render(<DesignSystemSpecimen />)
    expect(readFontShowcaseWeights(container)).toEqual([
      "400", "500", "600", "700", // heading defaults
      "400", "500", "700", // mono defaults
    ])
  })

  it("renders Blacklight's 5 distinct weight rows per family when its slug is active", () => {
    document.body.className = "blacklight-theme"
    const manifest: DesignSystemSpecimenThemeEntry[] = [
      {
        slug: "blacklight",
        typography: {
          display: { family: "PP Model Plastic", weights: [300, 400, 500, 700, 800] },
          body: { family: "PP Model Mono", weights: [300, 400, 500, 700, 800] },
        },
      },
    ]
    const { container } = render(<DesignSystemSpecimen themeManifest={manifest} />)
    const weights = readFontShowcaseWeights(container)
    // Two families × five weights = ten rows
    expect(weights).toHaveLength(10)
    expect(weights.slice(0, 5)).toEqual(["300", "400", "500", "700", "800"])
  })

  it("falls back to defaults when the active theme slug isn't in the manifest", () => {
    document.body.className = "neutral-theme"
    const manifest: DesignSystemSpecimenThemeEntry[] = [
      { slug: "blacklight", typography: { body: { family: "X", weights: [400] } } },
    ]
    const { container } = render(<DesignSystemSpecimen themeManifest={manifest} />)
    expect(readFontShowcaseWeights(container)).toHaveLength(7) // 4 + 3 defaults
  })

  it("re-renders when the active theme changes via visor-theme-change event", async () => {
    document.body.className = "neutral-theme"
    const manifest: DesignSystemSpecimenThemeEntry[] = [
      {
        slug: "blacklight",
        typography: { body: { family: "X", weights: [300, 700, 800] } },
      },
    ]
    const { container } = render(<DesignSystemSpecimen themeManifest={manifest} />)
    expect(readFontShowcaseWeights(container)).toHaveLength(7) // defaults

    await act(async () => {
      document.body.className = "blacklight-theme"
      document.dispatchEvent(new CustomEvent("visor-theme-change"))
    })

    const after = readFontShowcaseWeights(container)
    // body slot fills both heading and mono fallbacks → 3 × 2 = 6
    expect(after).toHaveLength(6)
    expect(after.slice(0, 3)).toEqual(["300", "700", "800"])
  })

  it("explicit fontFamilies prop overrides themeManifest resolution", () => {
    document.body.className = "blacklight-theme"
    const manifest: DesignSystemSpecimenThemeEntry[] = [
      { slug: "blacklight", typography: { body: { family: "X", weights: [100, 200, 900] } } },
    ]
    const { container } = render(
      <DesignSystemSpecimen
        themeManifest={manifest}
        fontFamilies={[
          { token: "--font-heading", role: "Heading", weights: [{ label: "Regular", value: 400 }] },
        ]}
      />,
    )
    expect(readFontShowcaseWeights(container)).toEqual(["400"])
  })
})
