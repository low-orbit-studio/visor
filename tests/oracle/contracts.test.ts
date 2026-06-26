// Derived from: spec/contracts.ts (frozen Zod schemas) + spec/types.ts + spec/rules.md
//   — R-TONE-KEYS, R-ESSENCE-CARDINALITY, FailureEnum membership, discriminatedUnion zElicitResponse.
// TIER 1 (runnable now): contract conformance for the frozen integration shapes.

import { describe, it, expect } from "vitest"
import {
  zBrandRecord,
  zDraftBrandRecord,
  zToneContext,
  zElicitRequest,
  zElicitResponse,
  zAiFailure,
  zPersistenceFailure,
  zExportFailure,
  zExportRequest,
  zWriteRecordRequest,
  zReadRecordResult,
} from "../../spec/contracts"
import type { BrandRecord } from "../../spec/types"

// ─────────────────────────────────────────────────────────────────────────────
// A complete, valid BrandRecord fixture (mirrors spec/types.ts BrandRecord)
// ─────────────────────────────────────────────────────────────────────────────

const validBrandRecord: BrandRecord = {
  positioning: {
    onliness: "the only design system that is verbal-twin theme-aware",
    category: "design systems",
    differentiation: "tone is a first-class, per-UI-state contract",
  },
  essence: ["coherent", "open", "yours"], // 3 words → within 2–3
  personality: [{ trait: "precise", not: "fussy" }],
  archetype: { primary: "Creator" },
  pillars: [
    {
      id: "coherence",
      statement: "every surface speaks one system",
      governs: { tokens: ["--primary"], components: ["Button"] },
      proof: ["shared token package"],
    },
  ],
  voice: { traits: [{ name: "plainspoken", do: "say it plainly", dont: "hedge", example: "Export failed. Retry." }] },
  tone: {
    error: { feeling: "calm, specific, never blaming", example: "That URL didn't parse." },
    success: { feeling: "quietly affirming", example: "Saved." },
    empty: { feeling: "inviting", example: "Nothing here yet." },
    loading: { feeling: "patient", example: "Deriving…" },
    "validation-warning": { feeling: "advisory, not blocking", example: "This reads off-voice." },
  },
  lexicon: [{ use: "brand system", avoid: "brand guidelines" }],
  messaging: { roof: "Own your brand, coherently." },
  taglines: ["Coherent. Open. Yours."],
  boilerplate: { short: "A theme-aware design system.", long: "A theme-aware design system you own." },
  colorUsage: { pairings: [{ use: "--primary", with: "--surface-card", rule: "4.5:1 minimum" }] },
  accessibility: {
    standard: "WCAG 2.1 AA",
    contrast: [{ context: "body text on surface-card", ratio: "4.5:1" }],
    intent: "legible for everyone",
  },
  core: ["positioning", "essence"],
  visibility: "public",
}

const clone = (): BrandRecord => structuredClone(validBrandRecord)

// ─────────────────────────────────────────────────────────────────────────────
// zBrandRecord — valid shapes parse; invalid shapes reject
// ─────────────────────────────────────────────────────────────────────────────

describe("zBrandRecord — valid/invalid shapes", () => {
  it("a complete record parses", () => {
    expect(zBrandRecord.safeParse(validBrandRecord).success).toBe(true)
  })

  it("rejects a record missing a required section (positioning)", () => {
    const bad = clone() as Partial<BrandRecord>
    delete bad.positioning
    expect(zBrandRecord.safeParse(bad).success).toBe(false)
  })

  it("rejects a wrong-typed field (visibility not in enum)", () => {
    const bad = { ...clone(), visibility: "secret" }
    expect(zBrandRecord.safeParse(bad).success).toBe(false)
  })

  it("rejects a malformed nested shape (pillar.proof must be string[])", () => {
    const bad = clone()
    ;(bad.pillars[0] as unknown as { proof: unknown }).proof = "not-an-array"
    expect(zBrandRecord.safeParse(bad).success).toBe(false)
  })
})

describe("zDraftBrandRecord — partial mid-derivation record", () => {
  it("an empty draft {} parses (every section optional)", () => {
    expect(zDraftBrandRecord.safeParse({}).success).toBe(true)
  })

  it("a partial draft (positioning only) parses", () => {
    expect(zDraftBrandRecord.safeParse({ positioning: validBrandRecord.positioning }).success).toBe(true)
  })

  it("still rejects a present-but-malformed section (essence below min)", () => {
    expect(zDraftBrandRecord.safeParse({ essence: ["solo"] }).success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// R-TONE-KEYS — closed tone-key set (zToneContext enum + zBrandRecord.tone record)
// ─────────────────────────────────────────────────────────────────────────────

describe("R-TONE-KEYS — closed five-context tone set", () => {
  const FIVE = ["error", "success", "empty", "loading", "validation-warning"] as const

  it("zToneContext enum accepts exactly the five fixed contexts", () => {
    for (const k of FIVE) expect(zToneContext.safeParse(k).success).toBe(true)
    expect(zToneContext.safeParse("info").success).toBe(false) // not a member
  })

  it("all five contexts present → valid", () => {
    expect(zBrandRecord.safeParse(validBrandRecord).success).toBe(true)
  })

  it("missing any one of the five → invalid", () => {
    // NOTE: relies on z.record(zToneContext, …) enforcing exhaustive enum keys (see SPEC GAP / report).
    const bad = clone()
    delete (bad.tone as Record<string, unknown>).loading
    expect(zBrandRecord.safeParse(bad).success).toBe(false)
  })

  it("any extra key beyond the five → invalid (closed set)", () => {
    const bad = clone()
    ;(bad.tone as Record<string, unknown>).info = { feeling: "x", example: "y" }
    expect(zBrandRecord.safeParse(bad).success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// R-ESSENCE-CARDINALITY — essence is 2–3 words (min(2).max(3))
// ─────────────────────────────────────────────────────────────────────────────

describe("R-ESSENCE-CARDINALITY — essence length 2–3", () => {
  const ROWS: Array<[number, string[], boolean]> = [
    [1, ["a"], false], // below min
    [2, ["a", "b"], true],
    [3, ["a", "b", "c"], true],
    [4, ["a", "b", "c", "d"], false], // above max
  ]
  it.each(ROWS)("essence length %i → valid=%s", (_len, essence, valid) => {
    const rec = { ...clone(), essence }
    expect(zBrandRecord.safeParse(rec).success).toBe(valid)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// FailureEnum membership — zAiFailure / zPersistenceFailure / zExportFailure
// ─────────────────────────────────────────────────────────────────────────────

describe("FailureEnum membership", () => {
  it("zAiFailure accepts its seven members and rejects unknown", () => {
    for (const m of [
      "invalid-key",
      "provider-auth-failed",
      "rate-limited",
      "network-error",
      "timeout",
      "content-filtered",
      "unknown",
    ]) {
      expect(zAiFailure.safeParse(m).success).toBe(true)
    }
    expect(zAiFailure.safeParse("teapot").success).toBe(false)
  })

  it("zPersistenceFailure accepts its five members and rejects unknown", () => {
    for (const m of [
      "file-not-found",
      "parse-error",
      "schema-invalid",
      "write-failed",
      "permission-denied",
    ]) {
      expect(zPersistenceFailure.safeParse(m).success).toBe(true)
    }
    expect(zPersistenceFailure.safeParse("disk-full").success).toBe(false)
  })

  it("zExportFailure accepts its three members and rejects unknown", () => {
    for (const m of ["incomplete-record", "serialize-error", "coherence-blocked"]) {
      expect(zExportFailure.safeParse(m).success).toBe(true)
    }
    expect(zExportFailure.safeParse("blocked").success).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// zElicitResponse — discriminatedUnion accepts each kind, rejects unknown kinds
// ─────────────────────────────────────────────────────────────────────────────

describe("zElicitResponse — discriminated union over `kind`", () => {
  it("accepts kind=text", () => {
    expect(zElicitResponse.safeParse({ kind: "text", content: "hello" }).success).toBe(true)
  })

  it("accepts kind=tool (slots may carry null values)", () => {
    expect(
      zElicitResponse.safeParse({
        kind: "tool",
        title: "Onliness mad-lib",
        template: "We are the only ___ that ___.",
        slots: [
          { id: "category", value: null },
          { id: "wedge", value: "ship tone as a contract" },
        ],
      }).success,
    ).toBe(true)
  })

  it("accepts kind=challenge", () => {
    expect(
      zElicitResponse.safeParse({
        kind: "challenge",
        framing: "that's not only — push harder",
        body: "Three competitors say the same thing.",
        keepLabel: "Use this",
        rewriteLabel: "I'll rewrite it",
      }).success,
    ).toBe(true)
  })

  it("accepts kind=warning", () => {
    expect(
      zElicitResponse.safeParse({ kind: "warning", message: "reads off-voice", fixAvailable: true }).success,
    ).toBe(true)
  })

  it("accepts kind=section-complete (patch is a draft record)", () => {
    expect(zElicitResponse.safeParse({ kind: "section-complete", patch: {} }).success).toBe(true)
    expect(
      zElicitResponse.safeParse({ kind: "section-complete", patch: { essence: ["a", "b"] } }).success,
    ).toBe(true)
  })

  it("rejects an unknown kind", () => {
    expect(zElicitResponse.safeParse({ kind: "banana", content: "x" }).success).toBe(false)
  })

  it("rejects a known kind that is missing a required field", () => {
    expect(zElicitResponse.safeParse({ kind: "text" }).success).toBe(false) // content missing
    expect(zElicitResponse.safeParse({ kind: "warning", message: "x" }).success).toBe(false) // fixAvailable missing
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Seam request schemas — valid shapes parse; invalid shapes reject
// ─────────────────────────────────────────────────────────────────────────────

describe("zElicitRequest — Seam 1 (AI provider)", () => {
  const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000"

  it("a well-formed request (uuid requestId, draft record) parses", () => {
    expect(
      zElicitRequest.safeParse({
        requestId: VALID_UUID,
        step: "positioning",
        record: {},
        model: "claude-opus-4-8",
      }).success,
    ).toBe(true)
  })

  it("rejects a non-uuid requestId", () => {
    expect(
      zElicitRequest.safeParse({ requestId: "not-a-uuid", step: "positioning", record: {}, model: "x" }).success,
    ).toBe(false)
  })

  it("rejects a missing model", () => {
    expect(
      zElicitRequest.safeParse({ requestId: VALID_UUID, step: "positioning", record: {} }).success,
    ).toBe(false)
  })
})

describe("zWriteRecordRequest — Seam 2 (persistence)", () => {
  it("accepts a draft record + path", () => {
    expect(zWriteRecordRequest.safeParse({ record: {}, path: ".visor.yaml" }).success).toBe(true)
  })

  it("rejects a missing path", () => {
    expect(zWriteRecordRequest.safeParse({ record: {} }).success).toBe(false)
  })
})

describe("zReadRecordResult — Seam 2 read (draft | null)", () => {
  it("accepts null (file/block absent)", () => {
    expect(zReadRecordResult.safeParse(null).success).toBe(true)
  })

  it("accepts a draft record", () => {
    expect(zReadRecordResult.safeParse({ visibility: "private" }).success).toBe(true)
  })
})

describe("zExportRequest — Seam 3 (export requires a COMPLETE record)", () => {
  it("accepts a complete record", () => {
    expect(zExportRequest.safeParse({ record: validBrandRecord, visibility: "public" }).success).toBe(true)
  })

  it("rejects an incomplete (draft) record — drives the `incomplete-record` failure", () => {
    expect(zExportRequest.safeParse({ record: {}, visibility: "public" }).success).toBe(false)
  })
})
