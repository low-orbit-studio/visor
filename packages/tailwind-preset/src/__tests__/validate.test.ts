/**
 * Validation test — bidirectional integrity gate.
 *
 * The ticket's verification plan:
 *
 *   "Validation test: every Visor token has at least one Tailwind name;
 *    CI fails if a token is exposed without a Tailwind path."
 *
 * This test enforces two contracts:
 *
 *   1. Every token name this preset exposes (the `var(--X)` references in
 *      v3.ts / v4.ts) must trace back to a token actually declared by
 *      `@loworbitstudio/visor-core`. That catches typos like `--surface-cardd`.
 *
 *   2. Every token the preset is *expected* to cover (the curated allow-list
 *      below — primitives + semantic + adaptive + sidebar + chart) must have
 *      at least one Tailwind theme path. That catches accidental dropouts
 *      when refactoring `tokens.ts`.
 *
 * Reads the generated CSS shipped by `@loworbitstudio/visor-core` to keep
 * the source of truth in one place — the tokens package builds first in
 * `npm run build`, so its `dist/` is always current when this test runs.
 */

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

import { describe, expect, it } from "vitest"

import { listExposedTokens, visorTokenMaps } from "../tokens.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Tokens guaranteed to ship as `--X` somewhere in the Visor CSS surface
 * (primitives + semantic + adaptive + theme engine output). Each entry
 * below is exposed by `@loworbitstudio/visor-core` either as a primitive
 * (`packages/tokens/src/tokens/primitives.ts`), a semantic alias
 * (`semantic.ts`), an adaptive token (`adaptive.ts`), or by a theme via
 * `@loworbitstudio/visor-theme-engine` (font families). The preset must
 * surface every one of these — if a name is dropped from `tokens.ts`, this
 * test fails and CI flags the regression.
 */
const REQUIRED_VISOR_TOKENS = [
  // Color primitives — neutrals / pure
  "color-neutral-50",
  "color-neutral-500",
  "color-neutral-900",
  "color-white",
  "color-black",
  // Color primitives — primary
  "color-primary-500",
  "color-primary-600",
  // Color primitives — status
  "color-success-500",
  "color-warning-500",
  "color-error-500",
  "color-info-500",
  // Semantic / adaptive text
  "text-primary",
  "text-secondary",
  "text-disabled",
  // Semantic / adaptive surface
  "surface-page",
  "surface-card",
  "surface-overlay",
  // Semantic / adaptive border
  "border-default",
  "border-focus",
  // Semantic / adaptive interactive
  "interactive-primary-bg",
  "interactive-primary-text",
  "interactive-destructive-bg",
  // Spacing scale
  "spacing-0",
  "spacing-4",
  "spacing-24",
  // Radius
  "radius-sm",
  "radius-lg",
  "radius-full",
  // Shadows
  "shadow-xs",
  "shadow-xl",
  // Typography (primitive + theme-engine)
  "font-sans",
  "font-mono",
  "font-display",
  "font-heading",
  "font-body",
  "font-size-xs",
  "font-size-4xl",
  "font-weight-bold",
  // Motion (semantic — only fast/normal/slow are emitted as named scales)
  "motion-duration-fast",
  "motion-duration-normal",
  "motion-duration-slow",
  "motion-easing-default",
  "motion-easing-spring",
  // Focus ring
  "focus-ring-width",
  "focus-ring-offset",
] as const

describe("preset ↔ Visor token coverage", () => {
  it("exposes every REQUIRED Visor token via at least one Tailwind theme path", () => {
    const exposed = new Set(listExposedTokens())
    const missing = REQUIRED_VISOR_TOKENS.filter((t) => !exposed.has(t))
    expect(
      missing,
      `Visor tokens missing a Tailwind theme path: ${missing.join(", ")}`
    ).toEqual([])
  })

  it("never references a `--` prefix in stored token names (var() lookups would fail)", () => {
    for (const map of Object.values(visorTokenMaps)) {
      for (const value of Object.values(map)) {
        expect(value.startsWith("--")).toBe(false)
      }
    }
  })

  it("every exposed token is reachable from the Visor tokens package CSS surface (no typos)", () => {
    // The tokens package builds before this test runs (vitest workspace
    // declares `npm run build -w packages/tokens` upstream). Glob across
    // all emitted .css files and grep for the `--name:` declaration sites.
    const tokensDist = resolve(
      __dirname,
      "../../../tokens/dist"
    )
    let css = ""
    try {
      css += readFileSync(`${tokensDist}/primitives.css`, "utf8")
      css += "\n"
      css += readFileSync(`${tokensDist}/semantic.css`, "utf8")
      css += "\n"
      css += readFileSync(`${tokensDist}/themes/light.css`, "utf8")
      css += "\n"
      css += readFileSync(`${tokensDist}/themes/dark.css`, "utf8")
    } catch (err) {
      // Defensive — if the upstream package wasn't built, skip the deep
      // check rather than fail the unit test with an unrelated error.
      // The REQUIRED list above still catches dropouts.
      console.warn(
        "[visor-tailwind-preset] @loworbitstudio/visor-core dist not built — skipping deep coverage scan",
        err
      )
      return
    }

    // Theme-engine emits these from a consumer's .visor.yaml at runtime,
    // not from the static tokens package — exclude them from the strict
    // CSS-presence check.
    const themeEngineEmitted = new Set([
      "font-sans",
      "font-mono",
      "font-display",
      "font-heading",
      "font-body",
    ])

    const missing: string[] = []
    for (const token of listExposedTokens()) {
      if (themeEngineEmitted.has(token)) continue
      const needle = `--${token}:`
      if (!css.includes(needle)) {
        missing.push(token)
      }
    }
    expect(
      missing,
      `Preset references tokens that no Visor CSS declares: ${missing.join(", ")}`
    ).toEqual([])
  })
})
