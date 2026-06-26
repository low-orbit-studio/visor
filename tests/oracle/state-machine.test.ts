// Derived from: spec/state-machine.ts (frozen pure logic) + spec/rules.md
//   — R-NEXTSTEP, R-SPINE-STATUS, R-CANVAS-ENTRY, R-ELICIT, R-KEYLESS.
// TIER 1 (runnable now): unit tests for every exported function in spec/state-machine.ts.
// Each case names the rules.md row (or the spec/state-machine.ts source) it encodes.

import { describe, it, expect } from "vitest"
import {
  stepOrder,
  nextStep,
  prevStep,
  deriveStepStatuses,
  canEnterCanvas,
  elicitReduce,
  initialWorkbenchState,
  DERIVATION_ORDER,
  AI_DEPENDENT_EVENTS,
  type SpineStepId,
  type NodeStatus,
  type WorkbenchMode,
  type ElicitState,
  type ElicitStateKind,
  type ElicitEvent,
} from "../../spec/state-machine"

// ─────────────────────────────────────────────────────────────────────────────
// stepOrder — source: spec/state-machine.ts DERIVATION_ORDER (1-based; canvas → 99 free-mode)
// ─────────────────────────────────────────────────────────────────────────────

describe("stepOrder (spec/state-machine.ts DERIVATION_ORDER; canvas=99)", () => {
  const ROWS: Array<[SpineStepId, number]> = [
    ["start", 1],
    ["positioning", 2],
    ["essence", 3],
    ["personality", 4],
    ["pillars", 5],
    ["voice", 6],
    ["tone", 7],
    ["visual", 8],
    ["prove", 9],
    ["export", 10],
    ["canvas", 99], // boundary: free-mode, excluded from the ordered chain
  ]
  it.each(ROWS)("stepOrder(%s) === %i", (step, order) => {
    expect(stepOrder(step)).toBe(order)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// nextStep — R-NEXTSTEP (every row of the ordered derivation chain)
// ─────────────────────────────────────────────────────────────────────────────

describe("nextStep — R-NEXTSTEP", () => {
  const ROWS: Array<[SpineStepId, SpineStepId | null]> = [
    ["start", "positioning"],
    ["positioning", "essence"],
    ["essence", "personality"],
    ["personality", "pillars"],
    ["pillars", "voice"],
    ["voice", "tone"],
    ["tone", "visual"],
    ["visual", "prove"],
    ["prove", "export"],
    ["export", null], // boundary: terminal of the guided chain
    ["canvas", null], // boundary: free-mode, not in the ordered chain
  ]
  it.each(ROWS)("nextStep(%s) === %s", (step, expected) => {
    expect(nextStep(step)).toBe(expected)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// prevStep — inverse of R-NEXTSTEP (source: DERIVATION_ORDER + prevStep docstring).
//   No dedicated rules.md table exists; expectations are the documented inverse of the chain.
// ─────────────────────────────────────────────────────────────────────────────

describe("prevStep (inverse of DERIVATION_ORDER; spec/state-machine.ts)", () => {
  const ROWS: Array<[SpineStepId, SpineStepId | null]> = [
    ["start", null], // boundary: no predecessor (floor of the chain)
    ["positioning", "start"],
    ["essence", "positioning"],
    ["personality", "essence"],
    ["pillars", "personality"],
    ["voice", "pillars"],
    ["tone", "voice"],
    ["visual", "tone"],
    ["prove", "visual"],
    ["export", "prove"],
    ["canvas", null], // boundary: free-mode, no predecessor
  ]
  it.each(ROWS)("prevStep(%s) === %s", (step, expected) => {
    expect(prevStep(step)).toBe(expected)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// deriveStepStatuses — R-SPINE-STATUS (the four table rows + boundary semantics)
// ─────────────────────────────────────────────────────────────────────────────

describe("deriveStepStatuses — R-SPINE-STATUS", () => {
  const ALL_KEYS: SpineStepId[] = [...DERIVATION_ORDER, "canvas"]

  it("R-SPINE-STATUS row: currentStep=positioning, mode=guided", () => {
    const got = deriveStepStatuses("positioning", "guided")
    expect(got).toEqual<Record<SpineStepId, NodeStatus>>({
      start: "done", // order < current → done
      positioning: "active", // order == current → active
      essence: "locked", // order > current → locked (forward-only)
      personality: "locked",
      pillars: "locked",
      voice: "locked",
      tone: "locked",
      visual: "locked",
      prove: "locked",
      export: "locked",
      canvas: "locked", // canvas node locked in guided
    })
  })

  it("R-SPINE-STATUS row: currentStep=start, mode=guided (no predecessor)", () => {
    const got = deriveStepStatuses("start", "guided")
    expect(got).toEqual<Record<SpineStepId, NodeStatus>>({
      start: "active", // == current
      positioning: "locked",
      essence: "locked",
      personality: "locked",
      pillars: "locked",
      voice: "locked",
      tone: "locked",
      visual: "locked",
      prove: "locked",
      export: "locked",
      canvas: "locked",
    })
  })

  it("R-SPINE-STATUS row: currentStep=export, mode=guided (no successor)", () => {
    const got = deriveStepStatuses("export", "guided")
    expect(got).toEqual<Record<SpineStepId, NodeStatus>>({
      start: "done",
      positioning: "done",
      essence: "done",
      personality: "done",
      pillars: "done",
      voice: "done",
      tone: "done",
      visual: "done",
      prove: "done",
      export: "active", // == current
      canvas: "locked",
    })
  })

  it.each<[SpineStepId]>([["canvas"], ["export"], ["positioning"]])(
    "R-SPINE-STATUS row: currentStep=%s, mode=canvas → all derivation done, canvas active",
    (currentStep) => {
      const got = deriveStepStatuses(currentStep, "canvas")
      for (const step of DERIVATION_ORDER) {
        expect(got[step]).toBe("done")
      }
      expect(got.canvas).toBe("active")
      // exhaustive: no stray keys
      expect(Object.keys(got).sort()).toEqual([...ALL_KEYS].sort())
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// canEnterCanvas — R-CANVAS-ENTRY (threshold = stepOrder("export"); guided only)
// ─────────────────────────────────────────────────────────────────────────────

describe("canEnterCanvas — R-CANVAS-ENTRY", () => {
  const ROWS: Array<[SpineStepId, WorkbenchMode, boolean]> = [
    ["prove", "guided", false], // below threshold (order 9 < 10)
    ["export", "guided", true], // boundary: order >= stepOrder("export")
    ["start", "guided", false], // far below threshold
    ["export", "canvas", false], // already in canvas mode
  ]
  it.each(ROWS)("canEnterCanvas(%s, %s) === %s", (step, mode, expected) => {
    expect(canEnterCanvas(step, mode)).toBe(expected)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// elicitReduce — R-ELICIT (valid rows) + spec/state-machine.ts ELICIT_TRANSITIONS extras
// ─────────────────────────────────────────────────────────────────────────────

describe("elicitReduce — R-ELICIT (valid transitions from the rules.md table)", () => {
  const ROWS: Array<[ElicitStateKind, ElicitEvent, ElicitStateKind]> = [
    ["empty", "assistant-asks", "awaiting-input"],
    ["awaiting-input", "user-sends", "assistant-streaming"],
    ["assistant-streaming", "ai-returns-tool", "tool-shown"],
    ["assistant-streaming", "ai-returns-challenge", "challenge-shown"],
    ["assistant-streaming", "ai-errors", "error"],
    ["assistant-streaming", "section-lock", "section-complete"],
    ["tool-shown", "user-submits-tool", "assistant-streaming"],
    ["challenge-shown", "challenge-keep", "section-complete"],
    ["challenge-shown", "challenge-rewrite", "awaiting-input"],
    ["validation-warning", "warning-apply-fix", "assistant-streaming"],
    ["error", "error-retry", "awaiting-input"],
  ]
  it.each(ROWS)("elicitReduce(%s, %s).kind === %s", (from, event, to) => {
    expect(elicitReduce({ kind: from } as ElicitState, event).kind).toBe(to)
  })
})

describe("elicitReduce — spec/state-machine.ts ELICIT_TRANSITIONS (rows beyond the rules.md table)", () => {
  const ROWS: Array<[ElicitStateKind, ElicitEvent, ElicitStateKind]> = [
    ["assistant-streaming", "ai-returns-text", "awaiting-input"],
    ["assistant-streaming", "ai-returns-warning", "validation-warning"],
    ["tool-shown", "ai-returns-challenge", "challenge-shown"],
    ["validation-warning", "warning-dismiss", "awaiting-input"],
  ]
  it.each(ROWS)("elicitReduce(%s, %s).kind === %s", (from, event, to) => {
    expect(elicitReduce({ kind: from } as ElicitState, event).kind).toBe(to)
  })
})

describe("elicitReduce — R-ELICIT boundary: invalid (kind,event) is a no-op, never throws", () => {
  const INVALID: Array<[ElicitStateKind, ElicitEvent]> = [
    ["empty", "user-sends"], // rules.md explicit invalid row
    ["awaiting-input", "ai-errors"],
    ["assistant-streaming", "user-sends"],
    ["tool-shown", "user-sends"],
    ["challenge-shown", "user-sends"],
    ["validation-warning", "user-sends"],
    ["error", "user-sends"],
  ]
  it.each(INVALID)("elicitReduce(%s, %s) returns the same state object (no-op)", (from, event) => {
    const state: ElicitState = { kind: from } as ElicitState
    let result: ElicitState | undefined
    expect(() => {
      result = elicitReduce(state, event)
    }).not.toThrow()
    expect(result!.kind).toBe(from)
    // reducer returns the identical reference on a no-op (spec/state-machine.ts elicitReduce)
    expect(result).toBe(state)
  })
})

describe("elicitReduce — R-ELICIT boundary: section-complete is terminal for the step (any event → no-op)", () => {
  const ALL_EVENTS: ElicitEvent[] = [
    "assistant-asks",
    "user-sends",
    "ai-returns-text",
    "ai-returns-tool",
    "ai-returns-challenge",
    "ai-returns-warning",
    "ai-errors",
    "user-submits-tool",
    "challenge-keep",
    "challenge-rewrite",
    "warning-dismiss",
    "warning-apply-fix",
    "error-retry",
    "section-lock",
  ]
  it.each(ALL_EVENTS)("elicitReduce(section-complete, %s).kind === section-complete", (event) => {
    const state: ElicitState = { kind: "section-complete" }
    expect(elicitReduce(state, event).kind).toBe("section-complete")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// R-KEYLESS — AI gating by key status (spec/state-machine.ts AI_DEPENDENT_EVENTS)
// ─────────────────────────────────────────────────────────────────────────────

describe("AI_DEPENDENT_EVENTS — R-KEYLESS (keyless suppresses AI events; manual lock still fires)", () => {
  it("contains exactly the six AI-dependent events", () => {
    expect([...AI_DEPENDENT_EVENTS].sort()).toEqual(
      [
        "assistant-asks",
        "ai-returns-text",
        "ai-returns-tool",
        "ai-returns-challenge",
        "ai-returns-warning",
        "ai-errors",
      ].sort(),
    )
  })

  it("does NOT include section-lock (manual lock fires in keyless mode)", () => {
    expect(AI_DEPENDENT_EVENTS).not.toContain<ElicitEvent>("section-lock")
  })

  it("does NOT include the user-driven events (composer/tool usable while keyless)", () => {
    expect(AI_DEPENDENT_EVENTS).not.toContain<ElicitEvent>("user-sends")
    expect(AI_DEPENDENT_EVENTS).not.toContain<ElicitEvent>("user-submits-tool")
  })

  it("the manual lock path assistant-streaming + section-lock → section-complete exists (keyless terminal)", () => {
    // The only manual, non-AI route to a locked section in the frozen table.
    expect(elicitReduce({ kind: "assistant-streaming" }, "section-lock").kind).toBe(
      "section-complete",
    )
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// initialWorkbenchState — spec/state-machine.ts (guided / start / keyless / empty / canvas pending)
// ─────────────────────────────────────────────────────────────────────────────

describe("initialWorkbenchState", () => {
  it("starts guided, on `start`, keyless, with an empty elicit thread", () => {
    const s = initialWorkbenchState()
    expect(s.mode).toBe<WorkbenchMode>("guided")
    expect(s.currentStep).toBe<SpineStepId>("start")
    expect(s.key).toBe("keyless")
    expect(s.elicit).toEqual<ElicitState>({ kind: "empty" })
  })

  it("seeds steps via deriveStepStatuses('start','guided') — start active, all else locked", () => {
    const s = initialWorkbenchState()
    expect(s.steps).toEqual(deriveStepStatuses("start", "guided"))
    expect(s.steps.start).toBe("active")
    expect(s.steps.canvas).toBe("locked")
  })

  it("canvas sections are every step except `start`/`canvas`, all `pending`", () => {
    const s = initialWorkbenchState()
    expect(Object.keys(s.canvas).sort()).toEqual(
      ["positioning", "essence", "personality", "pillars", "voice", "tone", "visual", "prove", "export"].sort(),
    )
    for (const v of Object.values(s.canvas)) {
      expect(v).toBe("pending")
    }
    expect((s.canvas as Record<string, unknown>).start).toBeUndefined()
    expect((s.canvas as Record<string, unknown>).canvas).toBeUndefined()
  })
})
