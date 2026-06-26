// Coherence auditor — Brand Record → Prove-stage CoherenceCheck rows (VI-562).
//
// Pure projection of a draft record onto pass/warn/fail rows, traceable to the frozen rule tables:
//   • R-ESSENCE-CARDINALITY — essence is 2–3 words.
//   • R-TONE-KEYS           — tone is exactly the closed five-context set.
//   • presence checks       — positioning / pillars / voice / taglines derived yet?
// R-PROVE-NONBLOCKING: a `fail` is advisory — "nothing here blocks you" — so coherence never gates
// export (the export gate is R-EXPORT-READY, on record completeness, not on these rows).
//
// Distinct from the theme-engine `validateBrandStrategy` persistence validator (VI-505) used by the
// export/persist path: this auditor produces the UI rows; rows project cleanly to
// `zExportResult.coherence` (`{ id, status }`).

import type { CheckStatus } from "../../../../../spec/state-machine"
import type { DraftBrandRecord } from "../../../../../spec/types"

/** A single Prove-stage coherence row. `fix` is the suggested affordance label (warn/fail only). */
export interface CoherenceRow {
  id: string
  title: string
  status: CheckStatus
  fix?: string
}

/** The closed five-context tone set (R-TONE-KEYS / contracts `zToneContext`). */
const TONE_KEYS = ["error", "success", "empty", "loading", "validation-warning"] as const

/** R-ESSENCE-CARDINALITY: 2–3 words → pass; present but out of range → fail; absent → warn. */
function auditEssence(record: DraftBrandRecord): CoherenceRow {
  const essence = record.essence
  if (!essence) return { id: "essence-cardinality", title: "Essence derived", status: "warn", fix: "Derive essence" }
  const ok = essence.length >= 2 && essence.length <= 3
  return {
    id: "essence-cardinality",
    title: "Essence is 2–3 words",
    status: ok ? "pass" : "fail",
    ...(ok ? {} : { fix: "Trim to 2–3 words" }),
  }
}

/** R-TONE-KEYS: exactly the closed five keys → pass; missing/extra → fail; absent → warn. */
function auditTone(record: DraftBrandRecord): CoherenceRow {
  const tone = record.tone as Record<string, unknown> | undefined
  if (!tone) return { id: "tone-keys", title: "Tone contexts complete", status: "warn", fix: "Derive tone" }
  const keys = Object.keys(tone)
  const complete = keys.length === TONE_KEYS.length && TONE_KEYS.every((k) => k in tone)
  return {
    id: "tone-keys",
    title: "Tone covers the five contexts",
    status: complete ? "pass" : "fail",
    ...(complete ? {} : { fix: "Resolve tone to the five contexts" }),
  }
}

/** Positioning present + all three facets → pass; partial → warn; absent → warn. */
function auditPositioning(record: DraftBrandRecord): CoherenceRow {
  const p = record.positioning
  const full = !!p && !!p.onliness && !!p.category && !!p.differentiation
  return {
    id: "positioning-complete",
    title: "Positioning is fully stated",
    status: full ? "pass" : "warn",
    ...(full ? {} : { fix: "Complete positioning" }),
  }
}

/** Presence check: pass when ≥1 truthy entry exists, else warn (not yet derived). */
function auditPresence(
  id: string,
  title: string,
  present: boolean,
  fix: string,
): CoherenceRow {
  return { id, title, status: present ? "pass" : "warn", ...(present ? {} : { fix }) }
}

/** Audit a draft record into Prove-stage coherence rows (R-PROVE-NONBLOCKING: all advisory). */
export function auditCoherence(record: DraftBrandRecord): CoherenceRow[] {
  return [
    auditPositioning(record),
    auditEssence(record),
    auditPresence(
      "pillars-present",
      "Pillars are defined",
      !!record.pillars?.some((p) => !!p?.statement),
      "Define at least one pillar",
    ),
    auditTone(record),
    auditPresence(
      "voice-present",
      "Voice traits are set",
      !!record.voice?.traits?.length,
      "Add voice traits",
    ),
    auditPresence(
      "taglines-present",
      "At least one tagline",
      !!record.taglines?.length,
      "Write a tagline",
    ),
  ]
}

/** Roll the rows into pass/warn/fail counts. */
export function summarizeCoherence(rows: CoherenceRow[]): Record<CheckStatus, number> {
  const out: Record<CheckStatus, number> = { pass: 0, warn: 0, fail: 0 }
  for (const r of rows) out[r.status] += 1
  return out
}

/** Project rows to the frozen export shape (`zExportResult.coherence`). */
export function toExportCoherence(rows: CoherenceRow[]): { id: string; status: CheckStatus }[] {
  return rows.map(({ id, status }) => ({ id, status }))
}

/** R-PROVE-NONBLOCKING — coherence is advisory; a `fail` never blocks export. Always false. */
export function coherenceBlocksExport(_rows: CoherenceRow[]): boolean {
  return false
}
