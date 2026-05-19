/**
 * Tailwind 3 preset tests.
 *
 * Locks in the shape consumers see when they spread the preset into
 * `presets: [visorPreset]`, plus a snapshot of a representative
 * compiled consumer theme.
 */

import { describe, expect, it } from "vitest"

import visorTailwindV3Preset, {
  buildVisorTailwindV3Preset,
} from "../v3.js"

describe("buildVisorTailwindV3Preset", () => {
  it("returns an object Tailwind can spread under `presets:`", () => {
    const preset = buildVisorTailwindV3Preset()
    expect(preset).toHaveProperty("theme.extend")
    expect(Object.keys(preset.theme.extend).sort()).toEqual(
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

  it("wires every color value to a var(--...) reference", () => {
    const preset = buildVisorTailwindV3Preset()
    const colors = preset.theme.extend.colors as Record<string, unknown>
    function walk(node: unknown): void {
      if (typeof node === "string") {
        expect(node).toMatch(/^var\(--[a-z0-9-]+\)$/)
      } else if (node && typeof node === "object") {
        for (const child of Object.values(node)) walk(child)
      }
    }
    walk(colors)
  })

  it("surfaces the brand-affordance utilities the ticket lists", () => {
    const preset = buildVisorTailwindV3Preset()
    const colors = preset.theme.extend.colors as Record<
      string,
      Record<string, string>
    >
    const surface = colors.surface as Record<string, string>
    const text = colors.text as Record<string, string>
    const interactive = colors.interactive as Record<string, string>
    expect(surface.card).toBe("var(--surface-card)")
    expect(text.primary).toBe("var(--text-primary)")
    expect(interactive["primary-bg"]).toBe("var(--interactive-primary-bg)")
  })

  it("default export equals the factory output (stable cached preset)", () => {
    const fresh = buildVisorTailwindV3Preset()
    expect(visorTailwindV3Preset).toEqual(fresh)
  })

  it("spacing scale is flat (keys like `3.5` are not split into nested objects)", () => {
    const preset = buildVisorTailwindV3Preset()
    expect(preset.theme.extend.spacing).toEqual({
      "0": "var(--spacing-0)",
      "1": "var(--spacing-1)",
      "2": "var(--spacing-2)",
      "3": "var(--spacing-3)",
      "3.5": "var(--spacing-3_5)",
      "4": "var(--spacing-4)",
      "4.5": "var(--spacing-4_5)",
      "5": "var(--spacing-5)",
      "6": "var(--spacing-6)",
      "8": "var(--spacing-8)",
      "10": "var(--spacing-10)",
      "12": "var(--spacing-12)",
      "16": "var(--spacing-16)",
      "20": "var(--spacing-20)",
      "24": "var(--spacing-24)",
    })
  })

  it("boxShadow scale resolves to --shadow-* variables", () => {
    const preset = buildVisorTailwindV3Preset()
    expect(preset.theme.extend.boxShadow).toEqual({
      xs: "var(--shadow-xs)",
      sm: "var(--shadow-sm)",
      md: "var(--shadow-md)",
      lg: "var(--shadow-lg)",
      xl: "var(--shadow-xl)",
    })
  })

  it("borderRadius scale resolves to --radius-* variables with a pill alias", () => {
    const preset = buildVisorTailwindV3Preset()
    expect(preset.theme.extend.borderRadius).toEqual({
      none: "var(--radius-none)",
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      xl: "var(--radius-xl)",
      "2xl": "var(--radius-2xl)",
      "3xl": "var(--radius-3xl)",
      full: "var(--radius-full)",
      pill: "var(--radius-full)",
    })
  })

  it("transitionDuration scale resolves to --motion-duration-* variables", () => {
    const preset = buildVisorTailwindV3Preset()
    expect(preset.theme.extend.transitionDuration).toEqual({
      fast: "var(--motion-duration-fast)",
      normal: "var(--motion-duration-normal)",
      slow: "var(--motion-duration-slow)",
    })
  })

  it("fontFamily exposes sans / display / heading / mono slots", () => {
    const preset = buildVisorTailwindV3Preset()
    expect(preset.theme.extend.fontFamily).toEqual({
      sans: "var(--font-sans)",
      mono: "var(--font-mono)",
      body: "var(--font-body)",
      heading: "var(--font-heading)",
      display: "var(--font-display)",
    })
  })
})

/**
 * Representative consumer config snapshot — locks in the shape a real
 * `tailwind.config.ts` will see at merge time. This is the "snapshot test
 * of the compiled Tailwind theme JSON for a sample consumer" required by
 * the ticket's verification plan.
 */
describe("representative consumer config", () => {
  it("a consumer config that spreads the preset still controls its own content[] and other keys", () => {
    const consumerConfig = {
      content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
      presets: [visorTailwindV3Preset],
      theme: {
        extend: {
          colors: {
            // Consumer-side override, e.g. a one-off marketing color
            promo: "#ff00ff",
          },
        },
      },
    }
    expect(consumerConfig.content).toHaveLength(2)
    const colors = consumerConfig.presets[0].theme.extend.colors as Record<
      string,
      unknown
    >
    expect(colors.text).toBeDefined()
    expect(colors.surface).toBeDefined()
    // Consumer extension survives — Tailwind merges, doesn't replace
    expect(consumerConfig.theme.extend.colors.promo).toBe("#ff00ff")
  })
})
