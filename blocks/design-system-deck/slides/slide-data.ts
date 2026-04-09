/**
 * Design System Deck — Curated Slide Data
 *
 * Slide-specific data subsets derived from specimen-data.ts.
 * These are intentionally curated for presentation — not exhaustive.
 * For the full token inventory, see the Design System Specimen block.
 */

import {
  SEMANTIC_COLORS,
  TYPE_SPECIMENS,
  CONTRAST_PAIRS,
} from "../../design-system-specimen/specimen-data"

export type {
  SemanticColorData,
  TypeSpecimenData,
  ContrastPairData,
} from "../../design-system-specimen/specimen-data"

// ─── Color: Semantic Tokens (curated subset) ────────────────────────────────

const SLIDE_SEMANTIC_TOKENS = [
  "--text-primary",
  "--text-secondary",
  "--text-tertiary",
  "--text-link",
  "--surface-page",
  "--surface-card",
  "--surface-subtle",
  "--surface-overlay",
  "--border-default",
  "--border-muted",
  "--border-focus",
]

export const SLIDE_SEMANTIC_COLORS = SEMANTIC_COLORS.filter((c) =>
  SLIDE_SEMANTIC_TOKENS.includes(c.token)
)

// ─── Typography: Display Scale ──────────────────────────────────────────────

export const SLIDE_TYPE_DISPLAY = TYPE_SPECIMENS.slice(0, 4)

// ─── Typography: Body & Utility Scale ───────────────────────────────────────

const SLIDE_BODY_SAMPLE_TEXT: Record<string, string> = {
  lg: "Large body text for emphasis and introductions",
  base: "Default body text for reading — the workhorse of the system",
  sm: "Small text for labels, captions, and supporting information",
  xs: "Fine print, metadata, and legal text",
}

export const SLIDE_TYPE_BODY = TYPE_SPECIMENS.slice(4).map((spec) => ({
  ...spec,
  sampleText: SLIDE_BODY_SAMPLE_TEXT[spec.label] ?? spec.sampleText,
}))

// ─── Accessibility: Key Pairs (curated subset) ──────────────────────────────

const SLIDE_CONTRAST_TOKENS = new Set([
  "--text-primary/--surface-page",
  "--text-secondary/--surface-page",
  "--text-tertiary/--surface-page",
  "--text-link/--surface-page",
  "--text-inverse/--surface-overlay",
  "--text-error/--surface-page",
])

export const SLIDE_CONTRAST_PAIRS = CONTRAST_PAIRS.filter((p) =>
  SLIDE_CONTRAST_TOKENS.has(`${p.fgToken}/${p.bgToken}`)
)
