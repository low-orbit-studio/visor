/**
 * Visor Tailwind 4 `@theme` export.
 *
 * Tailwind 4 moved configuration into a CSS-first `@theme { ... }` directive
 * and dropped the JavaScript preset surface for the new engine. This module
 * emits the same Visor token mapping as the v3 preset, but as a CSS string
 * that consumers paste / `@import` into their global stylesheet.
 *
 * Usage:
 *
 *   // app/globals.css
 *   @import "tailwindcss";
 *   @import "@loworbitstudio/visor-tailwind-preset/v4.css";
 *
 * Or programmatically:
 *
 *   import { visorTailwindV4Theme } from "@loworbitstudio/visor-tailwind-preset/v4"
 *   // visorTailwindV4Theme is a CSS string starting with `@theme { ... }`.
 */

import {
  borderRadiusTokens,
  borderWidthTokens,
  boxShadowTokens,
  colorTokens,
  fontFamilyTokens,
  fontSizeTokens,
  fontWeightTokens,
  lineHeightTokens,
  opacityTokens,
  ringWidthTokens,
  spacingTokens,
  transitionDurationTokens,
  transitionTimingFunctionTokens,
  zIndexTokens,
  type VisorTokenMap,
} from "./tokens.js"

/**
 * Convert a Tailwind theme path like `"color.primary.500"` into the
 * Tailwind 4 CSS variable name `"--color-primary-500"` that lives inside
 * `@theme`. Tailwind 4 turns these into utility classes automatically.
 *
 * Tailwind 4's convention is:
 *   --color-{name}          → bg-{name}, text-{name}, border-{name}
 *   --spacing-{name}        → p-{name}, gap-{name}, etc.
 *   --font-{name}           → font-{name}
 *   --text-{name}           → text-{name} (font-size)
 *   --font-weight-{name}    → font-{name}
 *   --leading-{name}        → leading-{name}
 *   --radius-{name}         → rounded-{name}
 *   --shadow-{name}         → shadow-{name}
 *   --opacity-{name}        → opacity-{name}
 *   --z-{name}              → z-{name}
 *   --duration-{name}       → duration-{name}
 *   --ease-{name}           → ease-{name}
 *   --border-{name}         → border-{name} (width)
 *   --ring-{name}           → ring-{name}
 */
function v4Name(namespace: string, path: string): string {
  // Tailwind 4 uses `-` as separator; flatten `a.b.c` to `a-b-c`.
  const flat = path.replace(/\./g, "-")
  return `--${namespace}-${flat}`
}

function emitBlock(namespace: string, map: VisorTokenMap): string[] {
  const lines: string[] = []
  for (const [path, varName] of Object.entries(map)) {
    const declared = v4Name(namespace, path)
    lines.push(`  ${declared}: var(--${varName});`)
  }
  return lines
}

/**
 * Color tokens are special-cased because our flat keys already encode the
 * Tailwind 4 namespace in their first segment (`color.primary.500`,
 * `text.primary`, `surface.card`). We don't want to double-prefix
 * (`--color-color-primary-500`); instead, drop the leading `color.` from
 * primitive ramps and leave semantic groups (`text.*`, `surface.*`, etc.)
 * to register their own top-level Tailwind 4 namespace via `--color-text-primary`
 * / `--color-surface-card`. That matches Tailwind 4's convention where
 * `bg-{name}` works for any `--color-{name}` entry.
 */
function emitColorBlock(map: VisorTokenMap): string[] {
  const lines: string[] = []
  for (const [path, varName] of Object.entries(map)) {
    // Strip a leading `color.` so primitive ramps land at `--color-primary-500`
    // (not `--color-color-primary-500`). Semantic groups (`text.*`,
    // `surface.*`, etc.) don't carry the prefix so they pass through unchanged.
    const stripped = path.startsWith("color.")
      ? path.slice("color.".length)
      : path
    const flat = stripped.replace(/\./g, "-")
    lines.push(`  --color-${flat}: var(--${varName});`)
  }
  return lines
}

/**
 * Build the Tailwind 4 `@theme` CSS block from the Visor token maps.
 */
export function buildVisorTailwindV4Theme(): string {
  const lines: string[] = []
  lines.push("/* @loworbitstudio/visor-tailwind-preset — Tailwind 4 @theme */")
  lines.push("@theme {")

  lines.push("  /* Colors */")
  lines.push(...emitColorBlock(colorTokens))

  lines.push("")
  lines.push("  /* Spacing */")
  lines.push(...emitBlock("spacing", spacingTokens))

  lines.push("")
  lines.push("  /* Font families */")
  lines.push(...emitBlock("font", fontFamilyTokens))

  lines.push("")
  lines.push("  /* Font sizes */")
  lines.push(...emitBlock("text", fontSizeTokens))

  lines.push("")
  lines.push("  /* Font weights */")
  lines.push(...emitBlock("font-weight", fontWeightTokens))

  lines.push("")
  lines.push("  /* Line heights */")
  lines.push(...emitBlock("leading", lineHeightTokens))

  lines.push("")
  lines.push("  /* Border radius */")
  lines.push(...emitBlock("radius", borderRadiusTokens))

  lines.push("")
  lines.push("  /* Border widths */")
  lines.push(...emitBlock("border", borderWidthTokens))

  lines.push("")
  lines.push("  /* Shadows */")
  lines.push(...emitBlock("shadow", boxShadowTokens))

  lines.push("")
  lines.push("  /* Opacity */")
  lines.push(...emitBlock("opacity", opacityTokens))

  lines.push("")
  lines.push("  /* Z-index */")
  lines.push(...emitBlock("z", zIndexTokens))

  lines.push("")
  lines.push("  /* Transition duration */")
  lines.push(...emitBlock("duration", transitionDurationTokens))

  lines.push("")
  lines.push("  /* Transition timing function */")
  lines.push(...emitBlock("ease", transitionTimingFunctionTokens))

  lines.push("")
  lines.push("  /* Ring width */")
  lines.push(...emitBlock("ring", ringWidthTokens))

  lines.push("}")
  return lines.join("\n") + "\n"
}

/**
 * The Tailwind 4 `@theme { ... }` CSS block as a string.
 */
export const visorTailwindV4Theme: string = buildVisorTailwindV4Theme()

export default visorTailwindV4Theme
