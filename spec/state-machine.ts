// FROZEN — Brand Workbench spec-freeze (VI-592, golden-path Phase 1).
// Source of truth: docs/design/brand-workbench/journey.html (spine + stages + CFG state, L322–650)
// and elicit-core.html (Elicit center-panel states + canvas states).
// Do NOT edit during build — a change here is a scope change → escalate → re-run Phase 1.
//
// Five coupled machines:
//   1. Spine progression  — ordered derivation steps + per-node status (done/active/pending/locked)
//   2. Workbench mode     — guided ⇄ canvas
//   3. Elicit interaction — the conversational center panel (discriminated union + transition table)
//   4. Canvas section     — right-panel "live brand system" per-section status
//   5. BYOK key           — keyless (full manual) vs key-active (AI turbo)
// Self-contained: no imports, so `tsc --noEmit spec/state-machine.ts` compiles in isolation.

// ─────────────────────────────────────────────────────────────────────────────
// 1. Spine progression
// ─────────────────────────────────────────────────────────────────────────────

/** Every spine node id. `canvas` is free-mode (journey.html data-order="99"), not in the ordered chain. */
export type SpineStepId =
  | "start"
  | "positioning"
  | "essence"
  | "personality"
  | "pillars"
  | "voice"
  | "tone"
  | "visual"
  | "prove"
  | "export"
  | "canvas"

/** The 10 ordered derivation steps (journey.html data-order 1–10). `canvas` is excluded — it is free-mode. */
export const DERIVATION_ORDER: readonly Exclude<SpineStepId, "canvas">[] = [
  "start",
  "positioning",
  "essence",
  "personality",
  "pillars",
  "voice",
  "tone",
  "visual",
  "prove",
  "export",
] as const

/** Section views (journey.html data-st / html[data-stage]). Strategy holds 4 steps, Verbal holds 2. */
export type SectionViewId =
  | "start"
  | "strategy"
  | "verbal"
  | "visual"
  | "prove"
  | "export"
  | "canvas"

/** Maps each spine step to the section view that renders it. */
export const STEP_TO_VIEW: Record<SpineStepId, SectionViewId> = {
  start: "start",
  positioning: "strategy",
  essence: "strategy",
  personality: "strategy",
  pillars: "strategy",
  voice: "verbal",
  tone: "verbal",
  visual: "visual",
  prove: "prove",
  export: "export",
  canvas: "canvas",
}

/** Conversational (split-screen) steps — the only steps that drive the Elicit machine. */
export const CONVERSATIONAL_STEPS: readonly SpineStepId[] = [
  "positioning",
  "essence",
  "personality",
  "pillars",
  "voice",
  "tone",
] as const

/** 1-based order; `canvas` returns 99 (free-mode), matching journey.html CFG. */
export function stepOrder(step: SpineStepId): number {
  const i = DERIVATION_ORDER.indexOf(step as Exclude<SpineStepId, "canvas">)
  return i === -1 ? 99 : i + 1
}

/** Next ordered step, or null at `export` (terminal of the guided chain). `canvas` has no successor. */
export function nextStep(step: SpineStepId): SpineStepId | null {
  if (step === "canvas") return null
  const i = DERIVATION_ORDER.indexOf(step)
  return i >= 0 && i < DERIVATION_ORDER.length - 1 ? DERIVATION_ORDER[i + 1] : null
}

/** Previous ordered step, or null at `start`. `canvas` has no predecessor. */
export function prevStep(step: SpineStepId): SpineStepId | null {
  if (step === "canvas") return null
  const i = DERIVATION_ORDER.indexOf(step)
  return i > 0 ? DERIVATION_ORDER[i - 1] : null
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Workbench mode + node status
// ─────────────────────────────────────────────────────────────────────────────

export type WorkbenchMode = "guided" | "canvas"

/**
 * Spine node status (journey.html .node.done/.active/.pending + VI-550 stepper `locked`).
 *  - done   : a past, locked step (green check)
 *  - active : the current step (pulse)
 *  - pending: a future step reachable once predecessors complete
 *  - locked : a future step not yet reachable (lock glyph); guided mode is forward-only
 */
export type NodeStatus = "done" | "active" | "pending" | "locked"

/**
 * Derive every node's status from the current step + mode.
 *  - guided: order < current → done; === current → active; > current → locked; canvas → locked.
 *  - canvas: every derivation step → done; canvas → active (free-edit; journey.html CFG canvas pct:100).
 */
export function deriveStepStatuses(
  currentStep: SpineStepId,
  mode: WorkbenchMode,
): Record<SpineStepId, NodeStatus> {
  const out = {} as Record<SpineStepId, NodeStatus>
  const cur = stepOrder(currentStep)
  for (const step of DERIVATION_ORDER) {
    if (mode === "canvas") out[step] = "done"
    else if (stepOrder(step) < cur) out[step] = "done"
    else if (stepOrder(step) === cur) out[step] = "active"
    else out[step] = "locked"
  }
  out.canvas = mode === "canvas" ? "active" : "locked"
  return out
}

/**
 * Mode transition guard. Canvas is reachable only once the guided chain reaches `export`
 * (journey.html: Canvas entered from the mode card after Export; all nodes then .done).
 */
export function canEnterCanvas(currentStep: SpineStepId, mode: WorkbenchMode): boolean {
  return mode === "guided" && stepOrder(currentStep) >= stepOrder("export")
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Elicit interaction machine (center panel)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Center-panel conversational state. Suggestion chips are an adornment of `awaiting-input`,
 * not a top-level state. `assistant-streaming` is the loading state (spinner + node pulse +
 * canvas .st.live). Source: elicit-core.html turn/tool/challenge/setrow structure.
 */
export type ElicitState =
  | { kind: "empty" } // first-run; no turns yet
  | { kind: "awaiting-input" } // assistant posed a question; composer active (may show suggestion chips)
  | { kind: "assistant-streaming" } // AI drafting a reply (Spinner / pulse / canvas deriving)
  | { kind: "tool-shown" } // inline mad-lib (StructuredPrompt) presented
  | { kind: "challenge-shown" } // adversarial ChallengeCard; human holds the gate
  | { kind: "validation-warning" } // off-voice / coherence advisory; non-blocking
  | { kind: "error" } // recoverable failure (e.g. provider error)
  | { kind: "section-complete" } // setrow confirmation; downstream derives; terminal for the step

export type ElicitStateKind = ElicitState["kind"]

/** The gate the human holds on a challenge (elicit-core.html .cbtn.keep / .cbtn.alt). */
export type ChallengeResolution = "keep" | "rewrite"

/** Named events that drive the Elicit machine. */
export type ElicitEvent =
  | "assistant-asks" // AI opens with a question
  | "user-sends" // user submits a chat message
  | "ai-returns-text" // AI replies with plain text
  | "ai-returns-tool" // AI returns a structured mad-lib
  | "ai-returns-challenge" // AI returns an adversarial challenge
  | "ai-returns-warning" // AI flags an off-voice / coherence issue
  | "ai-errors" // provider/network failure
  | "user-submits-tool" // user fills + submits the mad-lib slots
  | "challenge-keep" // user accepts the challenged version ("Use X")
  | "challenge-rewrite" // user opts to rewrite ("I'll rewrite it")
  | "warning-dismiss" // user proceeds past the advisory
  | "warning-apply-fix" // user applies the suggested fix
  | "error-retry" // user retries after an error
  | "section-lock" // the section is confirmed/locked

/**
 * Complete transition table. (from-kind → event → to-kind). Any (kind,event) not listed is
 * a no-op (invalid transition). `section-complete` is terminal for the step; the spine then
 * advances via nextStep().
 */
export const ELICIT_TRANSITIONS: Record<
  ElicitStateKind,
  Partial<Record<ElicitEvent, ElicitStateKind>>
> = {
  empty: { "assistant-asks": "awaiting-input" },
  "awaiting-input": { "user-sends": "assistant-streaming" },
  "assistant-streaming": {
    "ai-returns-text": "awaiting-input",
    "ai-returns-tool": "tool-shown",
    "ai-returns-challenge": "challenge-shown",
    "ai-returns-warning": "validation-warning",
    "ai-errors": "error",
    "section-lock": "section-complete",
  },
  "tool-shown": {
    "user-submits-tool": "assistant-streaming",
    "ai-returns-challenge": "challenge-shown",
  },
  "challenge-shown": {
    "challenge-keep": "section-complete",
    "challenge-rewrite": "awaiting-input",
  },
  "validation-warning": {
    "warning-dismiss": "awaiting-input",
    "warning-apply-fix": "assistant-streaming",
  },
  error: { "error-retry": "awaiting-input" },
  "section-complete": {},
}

/** Pure reducer over the transition table. Returns the same state on an invalid transition. */
export function elicitReduce(state: ElicitState, event: ElicitEvent): ElicitState {
  const next = ELICIT_TRANSITIONS[state.kind][event]
  return next ? { kind: next } : state
}

/**
 * AI-dependent events. In `keyless` mode these never fire — the user reaches `section-complete`
 * manually (StructuredPrompt edited directly + manual lock). BUILD-HANDOFF: "no key? still fully manual."
 */
export const AI_DEPENDENT_EVENTS: readonly ElicitEvent[] = [
  "assistant-asks",
  "ai-returns-text",
  "ai-returns-tool",
  "ai-returns-challenge",
  "ai-returns-warning",
  "ai-errors",
]

// ─────────────────────────────────────────────────────────────────────────────
// 4. Canvas section status (right panel)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-section status of the "live brand system" canvas (elicit-core.html .sect/.st + .derive states).
 *  - pending : not yet reached
 *  - deriving: ghost state, awaiting a parent section to lock (.echip.ghost / .pill-card.derive)
 *  - drafting: actively being authored (.st.live "drafting…")
 *  - set     : complete (.st "set", green check)
 *  - live    : "Speaking" — renders real components in the brand voice (.speak specimens)
 */
export type CanvasSectionStatus = "pending" | "deriving" | "drafting" | "set" | "live"

// ─────────────────────────────────────────────────────────────────────────────
// 5. BYOK key status + Prove checks
// ─────────────────────────────────────────────────────────────────────────────

/** keyless = full manual tool; key-active = AI turbo (BUILD-HANDOFF, journey.html .pill.key). */
export type KeyStatus = "keyless" | "key-active"

/** Prove-stage coherence check result (journey.html .check.pass/.warn/.fail). Fail is NON-blocking ("nothing here blocks you"). */
export type CheckStatus = "pass" | "warn" | "fail"

// ─────────────────────────────────────────────────────────────────────────────
// Aggregate workbench state
// ─────────────────────────────────────────────────────────────────────────────

/** Sections that own a canvas tile (every step except `start` and `canvas`). */
export type CanvasSectionId = Exclude<SpineStepId, "start" | "canvas">

/**
 * Global progress per section view (journey.html CFG L613–621). `done` = spine steps complete,
 * `pct` = global bar width. Frozen as data (R-PROGRESS) so the build cannot drift the numbers.
 * (Resolves blind-oracle gap G-C: R-PROGRESS previously had no frozen pure source.)
 */
export const STAGE_PROGRESS: Record<SectionViewId, { done: number; pct: number }> = {
  start: { done: 0, pct: 5 },
  strategy: { done: 2, pct: 20 },
  verbal: { done: 6, pct: 60 },
  visual: { done: 7, pct: 75 },
  prove: { done: 8, pct: 88 },
  export: { done: 10, pct: 100 },
  canvas: { done: 10, pct: 100 },
}

/**
 * A section's canvas tile reaches `set` only after every listed upstream section locks
 * (R-DERIVATION-DEPENDENCY; journey.html "derives once essence locks…"). Frozen as the dependency
 * GRAPH; the live re-resolution reducer is VI-561 (canvas). Sections absent here have no upstream dep.
 * (Resolves blind-oracle gap G-D: the dependency graph was prose-only.)
 */
export const DERIVATION_DEPENDENCIES: Partial<Record<CanvasSectionId, CanvasSectionId[]>> = {
  essence: ["positioning"],
  personality: ["essence"],
  pillars: ["essence"],
  voice: ["personality"],
  tone: ["voice"],
}

/** The full observable workbench state. */
export interface WorkbenchState {
  mode: WorkbenchMode
  currentStep: SpineStepId
  steps: Record<SpineStepId, NodeStatus>
  key: KeyStatus
  /** Center-panel state; only meaningful while currentStep is in CONVERSATIONAL_STEPS. */
  elicit: ElicitState
  /** Right-panel canvas status per section. */
  canvas: Record<CanvasSectionId, CanvasSectionStatus>
}

/** Initial state: guided mode, on `start`, keyless until a key is provided, canvas empty. */
export function initialWorkbenchState(): WorkbenchState {
  const canvas = {} as Record<CanvasSectionId, CanvasSectionStatus>
  for (const step of DERIVATION_ORDER) {
    if (step === "start") continue
    canvas[step as CanvasSectionId] = "pending"
  }
  return {
    mode: "guided",
    currentStep: "start",
    steps: deriveStepStatuses("start", "guided"),
    key: "keyless",
    elicit: { kind: "empty" },
    canvas,
  }
}
