// FROZEN — Brand Workbench spec-freeze (VI-592, golden-path Phase 1).
// Source of truth: docs/brand/visor-brand-record.yaml (data) + docs/brand/visor-brand-strategy.md (human canonical).
// Locked design: docs/design/brand-workbench/{journey.html, elicit-core.html}, BUILD-HANDOFF.md.
// Do NOT edit during build — a change here is a scope change → escalate → re-run Phase 1.
//
// This file freezes the BrandRecord domain model (the data the Workbench elicits and edits).
// Workbench UI state lives in spec/state-machine.ts. Integration shapes live in spec/contracts.ts.

/** Visibility of an exported brand system. Defaults to "public" for open-source brands. */
export type Visibility = "public" | "private"

/**
 * The five fixed UI-state tone contexts. These keys are CLOSED — not runtime-discovered.
 * Source: visor-brand-record.yaml `tone:` (error, success, empty, loading, validation-warning).
 */
export type ToneContext =
  | "error"
  | "success"
  | "empty"
  | "loading"
  | "validation-warning"

/** Positioning — the onliness claim, its category, and the differentiation wedge. */
export interface Positioning {
  /** The Neumeier "onliness" statement — the single load-bearing differentiator. */
  onliness: string
  /** The category the brand competes in. */
  category: string
  /** What the brand does that no competitor does. */
  differentiation: string
}

/** A personality trait, sharpened by the antonym it is NOT. */
export interface PersonalityTrait {
  /** e.g. "precise" */
  trait: string
  /** the disambiguating opposite, e.g. "not fussy" */
  not: string
}

/**
 * Brand archetype (Pearson & Mark). Primary is required; secondary/tertiary optional.
 * Source: visor-brand-record.yaml `archetype:`.
 */
export interface Archetype {
  primary: string
  secondary?: string
  tertiary?: string
}

/**
 * What a pillar governs. Each list is OPTIONAL per pillar. A `surfaces` ref is a
 * meta-surface (manifest | cli | component-metadata) — a pillar may govern tokens,
 * components, and/or surfaces. Source: visor-brand-record.yaml `pillars[].governs`.
 */
export interface PillarGoverns {
  /** token refs, e.g. "--primary", "--surface-card" */
  tokens?: string[]
  /** component refs, e.g. "Button", "Card" */
  components?: string[]
  /** meta-surface refs, e.g. "manifest", "cli" */
  surfaces?: string[]
}

/** A brand pillar — a thematic through-line linked to the tokens/components it governs. */
export interface Pillar {
  /** stable id / short name, e.g. "coherence" */
  id: string
  /** the pillar statement */
  statement: string
  /** what this pillar governs (any combination of tokens/components/surfaces) */
  governs: PillarGoverns
  /** reasons-to-believe / evidence backing the pillar */
  proof: string[]
}

/** A single voice trait with its do/dont guidance and a worked example. */
export interface VoiceTrait {
  /** e.g. "plainspoken" */
  name: string
  do: string
  dont: string
  example: string
}

/** Voice — the fixed set of voice traits derived from personality. */
export interface Voice {
  traits: VoiceTrait[]
}

/** A single tone specimen: how the brand sounds in one UI context. */
export interface ToneSpecimen {
  /** the felt quality, e.g. "calm, specific, never blaming" */
  feeling: string
  /** a worked copy example for this context */
  example: string
}

/**
 * Tone, keyed by the five fixed UI-state contexts. Every ToneContext key is present.
 * This is the "verbal twin of light/dark mode" (journey.html Tone stage).
 */
export type Tone = Record<ToneContext, ToneSpecimen>

/** A lexicon use/avoid pair. */
export interface LexiconEntry {
  use: string
  avoid: string
}

/** The umbrella message that sits above the pillars. */
export interface Messaging {
  roof: string
}

/** Reusable "about us" copy in two lengths. */
export interface Boilerplate {
  short: string
  long: string
}

/** A color pairing rule (use X with Y, governed by `rule`). */
export interface ColorPairing {
  use: string
  with: string
  rule: string
}

export interface ColorUsage {
  pairings: ColorPairing[]
}

/** A required contrast ratio for a named context. */
export interface ContrastTarget {
  /** e.g. "body text on surface-card" */
  context: string
  /** e.g. "4.5:1" (string to preserve ratio notation) */
  ratio: string
}

/** Accessibility commitment — standard + per-context contrast targets + intent statement. */
export interface Accessibility {
  /** e.g. "WCAG 2.1 AA" */
  standard: string
  contrast: ContrastTarget[]
  intent: string
}

/**
 * The complete Brand Record — the single object a `.visor.yaml` `brand-strategy` block
 * serializes. There is exactly ONE BrandRecord per file (never an array).
 *
 * Field order tracks the derivation spine (positioning → essence → … → export).
 * `essence` and `taglines` are ordered arrays — order is significant for messaging/export.
 */
export interface BrandRecord {
  positioning: Positioning
  /** 2–3 core words; ORDER significant. e.g. ["coherent", "open", "yours"] */
  essence: string[]
  personality: PersonalityTrait[]
  archetype: Archetype
  pillars: Pillar[]
  voice: Voice
  tone: Tone
  lexicon: LexiconEntry[]
  messaging: Messaging
  /** 1+ taglines; ORDER significant. */
  taglines: string[]
  boilerplate: Boilerplate
  colorUsage: ColorUsage
  accessibility: Accessibility
  /** subset of section names marking the immutable strategic core (Aaker). */
  core: string[]
  visibility: Visibility
}

/**
 * A partial BrandRecord as it exists mid-derivation: every section is optional until its
 * spine step locks it. The Workbench accumulates a DraftBrandRecord and only a fully
 * populated one passes export. (Build-time: enforced by spec/rules.md R-EXPORT rows.)
 */
export type DraftBrandRecord = Partial<BrandRecord>
