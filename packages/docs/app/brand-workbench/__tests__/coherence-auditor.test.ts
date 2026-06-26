// VI-562 — Coherence auditor: pass/warn/fail mapping over the frozen R-rules; non-blocking.

import { describe, it, expect } from "vitest"
import {
  auditCoherence,
  summarizeCoherence,
  toExportCoherence,
  coherenceBlocksExport,
  type CoherenceRow,
} from "../lib/coherence-auditor"
import type { DraftBrandRecord } from "../../../../../spec/types"

const TONE_FULL = {
  error: { feeling: "x", example: "x" },
  success: { feeling: "x", example: "x" },
  empty: { feeling: "x", example: "x" },
  loading: { feeling: "x", example: "x" },
  "validation-warning": { feeling: "x", example: "x" },
}

function row(rows: CoherenceRow[], id: string): CoherenceRow {
  const r = rows.find((x) => x.id === id)
  if (!r) throw new Error(`no row ${id}`)
  return r
}

describe("auditCoherence — empty record warns (nothing derived)", () => {
  it("every row is warn, none fail", () => {
    const rows = auditCoherence({})
    expect(summarizeCoherence(rows).fail).toBe(0)
    expect(summarizeCoherence(rows).warn).toBe(rows.length)
    for (const r of rows) expect(r.fix).toBeTruthy() // warn carries a fix affordance
  })
})

describe("R-ESSENCE-CARDINALITY mapping", () => {
  it.each([
    [["a", "b"], "pass"],
    [["a", "b", "c"], "pass"],
    [["a"], "fail"],
    [["a", "b", "c", "d"], "fail"],
  ])("essence %j → %s", (essence, status) => {
    const rows = auditCoherence({ essence } as DraftBrandRecord)
    expect(row(rows, "essence-cardinality").status).toBe(status)
  })

  it("absent essence → warn", () => {
    expect(row(auditCoherence({}), "essence-cardinality").status).toBe("warn")
  })
})

describe("R-TONE-KEYS mapping", () => {
  it("exactly the five contexts → pass", () => {
    const rows = auditCoherence({ tone: TONE_FULL } as DraftBrandRecord)
    expect(row(rows, "tone-keys").status).toBe("pass")
  })

  it("missing a context → fail", () => {
    const { loading, ...missing } = TONE_FULL
    void loading
    const rows = auditCoherence({ tone: missing } as unknown as DraftBrandRecord)
    expect(row(rows, "tone-keys").status).toBe("fail")
  })

  it("an extra context key → fail (closed set)", () => {
    const extra = { ...TONE_FULL, info: { feeling: "x", example: "x" } }
    const rows = auditCoherence({ tone: extra } as unknown as DraftBrandRecord)
    expect(row(rows, "tone-keys").status).toBe("fail")
  })

  it("absent tone → warn", () => {
    expect(row(auditCoherence({}), "tone-keys").status).toBe("warn")
  })
})

describe("presence checks", () => {
  it("full positioning → pass; partial → warn", () => {
    const full = { positioning: { onliness: "o", category: "c", differentiation: "d" } }
    expect(row(auditCoherence(full as DraftBrandRecord), "positioning-complete").status).toBe("pass")
    const partial = { positioning: { onliness: "o", category: "", differentiation: "" } }
    expect(row(auditCoherence(partial as DraftBrandRecord), "positioning-complete").status).toBe(
      "warn",
    )
  })

  it("pillars / voice / taglines present → pass", () => {
    const rec = {
      pillars: [{ id: "p1", statement: "s", governs: {}, proof: [] }],
      voice: { traits: [{ name: "n", do: "d", dont: "x", example: "e" }] },
      taglines: ["only one that compiles"],
    } as DraftBrandRecord
    const rows = auditCoherence(rec)
    expect(row(rows, "pillars-present").status).toBe("pass")
    expect(row(rows, "voice-present").status).toBe("pass")
    expect(row(rows, "taglines-present").status).toBe("pass")
  })
})

describe("projection + non-blocking", () => {
  it("toExportCoherence keeps id + status only", () => {
    const rows = auditCoherence({ essence: ["a", "b"] } as DraftBrandRecord)
    const proj = toExportCoherence(rows)
    expect(proj.every((r) => Object.keys(r).sort().join() === "id,status")).toBe(true)
  })

  it("R-PROVE-NONBLOCKING: a fail never blocks export", () => {
    const rows = auditCoherence({ essence: ["a"] } as DraftBrandRecord) // forces a fail
    expect(summarizeCoherence(rows).fail).toBeGreaterThan(0)
    expect(coherenceBlocksExport(rows)).toBe(false)
  })
})
