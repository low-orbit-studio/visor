/**
 * Visor Tailwind 3 preset.
 *
 * Usage in a consumer `tailwind.config.ts`:
 *
 *   import type { Config } from "tailwindcss"
 *   import visorPreset from "@loworbitstudio/visor-tailwind-preset"
 *
 *   const config: Config = {
 *     presets: [visorPreset],
 *     content: ["./app/**\/*.{ts,tsx}"],
 *   }
 *   export default config
 *
 * Every Tailwind class generated from these keys resolves to a Visor CSS
 * variable. Per-theme overrides (Char/Bone/Ember, Veronica warmth, etc.)
 * flow through the CSS variable layer at runtime, so this preset stays
 * fully theme-agnostic.
 */

import { expandFlatMap, expandNestedMap, visorTokenMaps } from "./tokens.js"

/**
 * Loose Tailwind 3 `Config` shape. We avoid importing `tailwindcss` as a
 * value dependency so the preset can ship without a hard Tailwind peer
 * — consumers bring their own Tailwind version.
 */
export interface VisorTailwindV3Preset {
  theme: {
    extend: Record<string, unknown>
  }
}

/**
 * Build the Tailwind 3 preset object.
 *
 * Exposed as a factory so tests and consumers who need to introspect the
 * generated theme tree can call it directly; the default export wraps a
 * cached invocation for the typical `presets: [require(...)]` path.
 */
export function buildVisorTailwindV3Preset(): VisorTailwindV3Preset {
  return {
    theme: {
      extend: {
        // colors is the only token map with multi-segment nested paths
        // (`color.primary.500`, `surface.elev-0`), so it gets the nested
        // expander; everything else is a flat scale keyed by Tailwind slot.
        colors: expandNestedMap(visorTokenMaps.colors),
        spacing: expandFlatMap(visorTokenMaps.spacing),
        fontFamily: expandFlatMap(visorTokenMaps.fontFamily),
        fontSize: expandFlatMap(visorTokenMaps.fontSize),
        fontWeight: expandFlatMap(visorTokenMaps.fontWeight),
        lineHeight: expandFlatMap(visorTokenMaps.lineHeight),
        borderRadius: expandFlatMap(visorTokenMaps.borderRadius),
        borderWidth: expandFlatMap(visorTokenMaps.borderWidth),
        boxShadow: expandFlatMap(visorTokenMaps.boxShadow),
        opacity: expandFlatMap(visorTokenMaps.opacity),
        zIndex: expandFlatMap(visorTokenMaps.zIndex),
        transitionDuration: expandFlatMap(visorTokenMaps.transitionDuration),
        transitionTimingFunction: expandFlatMap(
          visorTokenMaps.transitionTimingFunction
        ),
        ringWidth: expandFlatMap(visorTokenMaps.ringWidth),
      },
    },
  }
}

const visorTailwindV3Preset: VisorTailwindV3Preset = buildVisorTailwindV3Preset()

export default visorTailwindV3Preset
