/**
 * @loworbitstudio/visor-tailwind-preset
 *
 * Tailwind CSS preset that exposes every Visor design token as a Tailwind
 * theme key, pointing at the matching CSS custom property declared by
 * `@loworbitstudio/visor-core` and the active Visor theme. Consumer apps
 * never re-declare hex values, spacing scales, or motion tokens — Visor
 * updates propagate via `npm update`.
 *
 * Default export — Tailwind 3 preset:
 *
 *   // tailwind.config.ts
 *   import visorPreset from "@loworbitstudio/visor-tailwind-preset"
 *   export default { presets: [visorPreset], content: [...] }
 *
 *   // CommonJS / Tailwind 3 idiomatic
 *   module.exports = {
 *     presets: [require("@loworbitstudio/visor-tailwind-preset")],
 *     content: [...],
 *   }
 *
 * Tailwind 4 `@theme` block:
 *
 *   // app/globals.css
 *   @import "tailwindcss";
 *   @import "@loworbitstudio/visor-tailwind-preset/v4.css";
 *
 * Token introspection:
 *
 *   import { visorTokenMaps, listExposedTokens }
 *     from "@loworbitstudio/visor-tailwind-preset/tokens"
 */

import visorTailwindV3Preset, {
  buildVisorTailwindV3Preset,
  type VisorTailwindV3Preset,
} from "./v3.js"

export {
  buildVisorTailwindV3Preset,
  type VisorTailwindV3Preset,
}
export { buildVisorTailwindV4Theme, visorTailwindV4Theme } from "./v4.js"
export {
  borderRadiusTokens,
  borderWidthTokens,
  boxShadowTokens,
  colorTokens,
  fontFamilyTokens,
  fontSizeTokens,
  fontWeightTokens,
  lineHeightTokens,
  listExposedTokens,
  opacityTokens,
  ringWidthTokens,
  spacingTokens,
  transitionDurationTokens,
  transitionTimingFunctionTokens,
  visorTokenMaps,
  zIndexTokens,
  type VisorTokenMap,
  type VisorTokenMaps,
} from "./tokens.js"

export default visorTailwindV3Preset
