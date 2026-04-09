/**
 * compute-primary-scales.ts
 *
 * Regenerates --color-primary-* scales in theme CSS files so that
 * --interactive-primary-bg (the brand color) always lands at step 500,
 * with all other steps smoothly interpolated in OKLCH.
 *
 * Usage:
 *   npx tsx scripts/compute-primary-scales.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { parse, oklch, formatHex, interpolate } from "culori"

// ─── Config ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const THEME_DIR = resolve(__dirname, "../packages/docs/app")

const THEMES: Array<{ file: string; brand: string; label: string }> = [
  {
    file: "entr-theme.css",
    brand: "#6beba5",
    label: "ENTR",
  },
  {
    file: "blacklight-brand-theme.css",
    brand: "#f46c00",
    label: "Blacklight Brand",
  },
  {
    file: "reference-app-theme.css",
    brand: "#397a96",
    label: "Reference App",
  },
  {
    file: "kaiah-theme.css",
    brand: "#3b2f1a",
    label: "Kaiah",
  },
  {
    file: "neutral-theme.css",
    brand: "#1798ad",
    label: "Neutral",
  },
  {
    file: "space-theme.css",
    brand: "#5b6fff",
    label: "Space",
  },
  {
    // Blackout is intentionally grayscale — no color accent.
    // Primary scale anchored at gray-500 for a neutral zinc-like gradient.
    file: "blackout-theme.css",
    brand: "#6b7280",
    label: "Blackout",
  },
  // NOTE: veronica-theme.css is intentionally excluded.
  // Veronica has no brand color — its primary scale is a hand-curated warm
  // peach palette and should not be overwritten by this script.
]

// Map of step name → t value in the [lightAnchor, brand, darkAnchor] interpolator.
// brand is at exactly t=0.5 since it's the midpoint control point.
const STEP_T: Record<string, number> = {
  "50":  0.03,
  "100": 0.10,
  "200": 0.19,
  "300": 0.29,
  "400": 0.40,
  "500": 0.50, // ← brand color
  "600": 0.60,
  "700": 0.70,
  "800": 0.80,
  "900": 0.89,
  "950": 0.96,
}

// ─── Scale generation ─────────────────────────────────────────────────────────

function computeScale(brandHex: string): Record<string, string> {
  const parsed = oklch(parse(brandHex))
  if (!parsed || parsed.l == null || parsed.c == null || parsed.h == null) {
    throw new Error(`Cannot parse brand color: ${brandHex}`)
  }

  const { l, c, h } = parsed

  // Anchors: near-white at the light end, near-black at the dark end,
  // both inheriting the brand hue so the scale feels cohesive.
  const lightAnchor = oklch({ mode: "oklch", l: 0.98, c: Math.min(c * 0.08, 0.02), h })
  const darkAnchor  = oklch({ mode: "oklch", l: 0.18, c: Math.min(c * 0.55, 0.12), h })

  // 3-point interpolator in OKLCH: stops at t=0, 0.5, 1.0
  const scale = interpolate([lightAnchor!, { mode: "oklch", l, c, h }, darkAnchor!], "oklch")

  return Object.fromEntries(
    Object.entries(STEP_T).map(([step, t]) => {
      // Step 500 is the brand color — return the original hex exactly, no roundtrip
      if (step === "500") return [step, brandHex]
      const color = scale(t)
      const hex = formatHex(color)
      if (!hex) throw new Error(`Failed to compute step ${step} at t=${t} for ${brandHex}`)
      return [step, hex]
    })
  )
}

// ─── CSS update ───────────────────────────────────────────────────────────────

function updateThemeFile(filePath: string, steps: Record<string, string>): void {
  let css = readFileSync(filePath, "utf-8")

  // Check whether any --color-primary-* tokens exist in this file
  const hasExisting = Object.keys(steps).some((step) =>
    css.includes(`--color-primary-${step}`)
  )

  if (hasExisting) {
    // Replace existing declarations in-place
    for (const [step, hex] of Object.entries(steps)) {
      const token = `--color-primary-${step}`
      css = css.replace(
        new RegExp(`(${token}\\s*:\\s*)([^;]+)(;)`, "g"),
        `$1${hex}$3`
      )
    }
  } else {
    // Insert a new block. Find the first opening brace of the theme class rule
    // and append the scale just before its closing brace.
    const block = [
      "",
      "  /* Primary color scale — OKLCH-interpolated, brand at 500 */",
      ...Object.entries(steps).map(
        ([step, hex]) => `  --color-primary-${step}: ${hex};`
      ),
    ].join("\n")

    // Find the first selector rule (skip @font-face, @import, etc.)
    // Look for the first line that starts with a class or element selector
    const selectorMatch = css.match(/\n([.#][\w-]+\s*\{)/)
    if (!selectorMatch || selectorMatch.index == null) {
      console.warn(`  ⚠ Could not find insertion point in ${filePath}`)
      return
    }
    // Find the closing brace of that first selector rule
    const selectorStart = selectorMatch.index
    const closeIdx = css.indexOf("\n}", selectorStart)
    if (closeIdx === -1) {
      console.warn(`  ⚠ Could not find closing brace in ${filePath}`)
      return
    }
    css = css.slice(0, closeIdx) + block + "\n" + css.slice(closeIdx)
  }

  writeFileSync(filePath, css, "utf-8")
}

// ─── Main ─────────────────────────────────────────────────────────────────────

for (const { file, brand, label } of THEMES) {
  const filePath = resolve(THEME_DIR, file)
  console.log(`\n${label} (${brand})`)

  let steps: Record<string, string>
  try {
    steps = computeScale(brand)
  } catch (e) {
    console.error(`  ✗ Failed to compute scale: ${(e as Error).message}`)
    continue
  }

  console.log("  Steps:")
  for (const [step, hex] of Object.entries(steps)) {
    const marker = step === "500" ? " ← brand" : ""
    console.log(`    ${step.padStart(3)}: ${hex}${marker}`)
  }

  try {
    updateThemeFile(filePath, steps)
    console.log(`  ✓ Updated ${file}`)
  } catch (e) {
    console.error(`  ✗ Failed to update file: ${(e as Error).message}`)
  }
}

console.log("\nDone.")
