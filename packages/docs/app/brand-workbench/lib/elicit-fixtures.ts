// Static content for the Brand Workbench core Elicit screen (VI-559).
//
// Source of truth: docs/design/brand-workbench/elicit-core.html (visual + interaction truth) and
// docs/brand/visor-brand-record.yaml (the dogfood Brand Record). This screen is a STATIC snapshot
// of the guided "Strategy" stage at the Essence step (step 3/10, 20%) — no AI, no state machine.
// The spine statuses, progress numbers, and stage map mirror the frozen spec/state-machine.ts
// (deriveStepStatuses("essence","guided"), STAGE_PROGRESS.strategy) without importing across the
// package boundary; the Tier-1 oracle verifies the logic, this file renders the known snapshot.

import type { SpineNodeStatus } from "../components/derivation-spine"

/** A single derivation-spine node. `id` matches a frozen SpineStepId (→ data-testid bw-spine-node-${id}). */
export interface SpineNode {
  id: string
  title: string
  sublabel: string
  status: SpineNodeStatus
}

/** A labelled group of spine nodes with its eyebrow completion count. */
export interface SpineGroup {
  label: string
  /** e.g. "1 / 4" */
  count: string
  /** When true the count pill flips to the done (primary) treatment. */
  countDone?: boolean
  nodes: SpineNode[]
}

// Strategy stage, Essence step. Statuses follow the locked design: completed steps are `complete`,
// the current step is `active`, the next-up locked steps in active groups show `locked` (lock glyph),
// and not-yet-started further groups show `upcoming` (plain) — faithful to elicit-core.html.
export const SPINE_GROUPS: SpineGroup[] = [
  {
    label: "Setup",
    count: "1 / 1",
    countDone: true,
    nodes: [{ id: "start", title: "Start", sublabel: "name · public", status: "complete" }],
  },
  {
    label: "Strategy",
    count: "1 / 4",
    nodes: [
      { id: "positioning", title: "Positioning", sublabel: "the onliness · set", status: "complete" },
      { id: "essence", title: "Essence", sublabel: "working on it now", status: "active" },
      { id: "personality", title: "Personality", sublabel: "brand-as-person", status: "locked" },
      { id: "pillars", title: "Pillars", sublabel: "token-linked", status: "locked" },
    ],
  },
  {
    label: "Verbal",
    count: "0 / 2",
    nodes: [
      { id: "voice", title: "Voice", sublabel: "fixed traits", status: "locked" },
      { id: "tone", title: "Tone", sublabel: "flexed by context", status: "locked" },
    ],
  },
  {
    label: "Visual",
    count: "0 / 1",
    nodes: [{ id: "visual", title: "Visual", sublabel: "color · type · marks", status: "upcoming" }],
  },
  {
    label: "Prove & Export",
    count: "0 / 2",
    nodes: [
      { id: "prove", title: "Prove", sublabel: "coherence checks", status: "upcoming" },
      { id: "export", title: "Export", sublabel: ".visor.yaml + manifest", status: "upcoming" },
    ],
  },
]

/** Spine progress summary card (journey.html CFG strategy → done 2, pct 20). */
export const SPINE_PROGRESS = {
  brand: "Visor",
  visibility: "public",
  done: 2,
  total: 10,
  pct: 20,
}

/** Conversation header: breadcrumb + step counter + segmented meter + honest ETA. */
export const ELICIT_HEAD = {
  section: "Strategy",
  step: "Essence",
  stepLabel: "Step 3 of 10",
  pct: "20%",
  segments: { total: 10, value: 2, current: 2 },
  eta: "About 8 minutes to a complete first draft — stop and pick up anytime, nothing's lost.",
}

/** Onliness mad-lib (StructuredPrompt) — all three slots filled in the snapshot. */
export const ONLINESS_TOOL = {
  header: "Onliness · the spearhead",
  slots: [
    "design system",
    "compiles a brand — visual and verbal — from one portable file",
    "humans and agents alike",
  ],
  hint: "Category · benefit · audience. We'll pressure-test it next.",
}

/** Suggestion chips above the composer (the first is the spark/accent chip). */
export const SUGGESTIONS = [
  { text: "Draft why each word fits", spark: true },
  { text: "I'll choose the words myself", spark: false },
  { text: "Show me other options", spark: false },
]

/** Composer model chip + privacy meta line. */
export const COMPOSER = {
  placeholder: "Message the strategist…",
  model: "Claude · key active",
  meta: [
    "Your key, your data — strategy never leaves this machine",
    "AI drafts & challenges, you decide",
    "no key? still fully manual",
  ],
}

/** Canvas — Positioning record card. */
export const POSITIONING_RECORD = {
  tags: ["design system", "verb: compile", "humans + agents"],
}

/** Canvas — Essence chips (the third is the deriving ghost). */
export const ESSENCE_CHIPS = ["coherent", "open"]
export const ESSENCE_GHOST = "yours?"

/** Canvas — Personality traits (each sharpened by its antonym); all deriving in this snapshot. */
export const PERSONALITY_TRAITS = [
  { trait: "precise", not: "not fussy" },
  { trait: "candid", not: "not cold" },
  { trait: "generous", not: "not indulgent" },
  { trait: "warm", not: "not saccharine" },
]

/** Canvas — Pillars: the first is set, the rest derive once essence locks. */
export const PILLAR_SET = {
  id: "coherence",
  statement: "Every layer derives from the one above it.",
  governs: ["--primary", "--surface-card", "--text-primary"],
}
export const PILLAR_DERIVING = "openness & ownership derive once essence locks…"

/** Canvas — Speaking specimen voice key (the brand voice rendered on real components). */
export const VOICE_KEY = "plainspoken · candid · generous · warm"

export const CANVAS_FOOTNOTE =
  "Switch theme or mode and every surface here re-resolves — nothing is pinned. The brand is compiled, not pasted."
