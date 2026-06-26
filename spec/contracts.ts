// FROZEN — Brand Workbench spec-freeze (VI-592, golden-path Phase 1).
// Integration contracts (Zod) for the THREE seams the Workbench crosses. The near-term build
// (VI-559 static Elicit) crosses NONE of these — it runs on fixtures. These contracts freeze the
// SHAPES so the later phases (VI-562 AI seam, VI-563 export, persistence) build to a fixed target.
// Mirrors spec/types.ts; the Phase-2 oracle tests conformance. Do NOT edit during build.

import { z } from "zod"

// ─────────────────────────────────────────────────────────────────────────────
// BrandRecord runtime schema (mirror of spec/types.ts — keep in sync; oracle asserts equality)
// ─────────────────────────────────────────────────────────────────────────────

export const zToneContext = z.enum([
  "error",
  "success",
  "empty",
  "loading",
  "validation-warning",
])

export const zPositioning = z.object({
  onliness: z.string(),
  category: z.string(),
  differentiation: z.string(),
})

export const zPersonalityTrait = z.object({ trait: z.string(), not: z.string() })

export const zArchetype = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
  tertiary: z.string().optional(),
})

export const zPillar = z.object({
  id: z.string(),
  statement: z.string(),
  governs: z.object({
    tokens: z.array(z.string()).optional(),
    components: z.array(z.string()).optional(),
    surfaces: z.array(z.string()).optional(),
  }),
  proof: z.array(z.string()),
})

export const zVoiceTrait = z.object({
  name: z.string(),
  do: z.string(),
  dont: z.string(),
  example: z.string(),
})

export const zToneSpecimen = z.object({ feeling: z.string(), example: z.string() })

export const zBrandRecord = z.object({
  positioning: zPositioning,
  essence: z.array(z.string()).min(2).max(3),
  personality: z.array(zPersonalityTrait),
  archetype: zArchetype,
  pillars: z.array(zPillar),
  voice: z.object({ traits: z.array(zVoiceTrait) }),
  // Tone: the CLOSED five-context set. `.strict()` so a MISSING key OR an EXTRA key is invalid
  // (R-TONE-KEYS, D-3). z.record(enum, …) is partial under Zod 3 and would let a missing key pass —
  // the G-A spec gap the blind oracle caught.
  tone: z
    .object({
      error: zToneSpecimen,
      success: zToneSpecimen,
      empty: zToneSpecimen,
      loading: zToneSpecimen,
      "validation-warning": zToneSpecimen,
    })
    .strict(),
  lexicon: z.array(z.object({ use: z.string(), avoid: z.string() })),
  messaging: z.object({ roof: z.string() }),
  taglines: z.array(z.string()).min(1),
  boilerplate: z.object({ short: z.string(), long: z.string() }),
  colorUsage: z.object({
    pairings: z.array(z.object({ use: z.string(), with: z.string(), rule: z.string() })),
  }),
  accessibility: z.object({
    standard: z.string(),
    contrast: z.array(z.object({ context: z.string(), ratio: z.string() })),
    intent: z.string(),
  }),
  core: z.array(z.string()),
  visibility: z.enum(["public", "private"]),
})

/** A partial record mid-derivation — every section optional until its step locks. */
export const zDraftBrandRecord = zBrandRecord.partial()

// ─────────────────────────────────────────────────────────────────────────────
// Seam 1 — AI Provider (Claude-first, local-first, BYOK).  Build: VI-562.
// ─────────────────────────────────────────────────────────────────────────────

export const zElicitRequest = z.object({
  /** Idempotency key: a duplicate submit with the same id returns the in-flight/last result. */
  requestId: z.string().uuid(),
  step: z.string(), // SpineStepId (string-typed here; compile type lives in state-machine.ts)
  record: zDraftBrandRecord,
  userMessage: z.string().optional(),
  model: z.string(), // e.g. "claude-opus-4-8"
})

/** AI reply — a discriminated union mirroring the Elicit center-panel states. */
export const zElicitResponse = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), content: z.string() }),
  z.object({
    kind: z.literal("tool"),
    title: z.string(),
    template: z.string(),
    slots: z.array(z.object({ id: z.string(), value: z.string().nullable() })),
  }),
  z.object({
    kind: z.literal("challenge"),
    framing: z.string(),
    body: z.string(),
    keepLabel: z.string(),
    rewriteLabel: z.string(),
  }),
  z.object({ kind: z.literal("warning"), message: z.string(), fixAvailable: z.boolean() }),
  z.object({ kind: z.literal("section-complete"), patch: zDraftBrandRecord }),
])

/** AI failure modes. The Elicit machine maps these to the `error` state (VI-562). */
export const zAiFailure = z.enum([
  "invalid-key",
  "provider-auth-failed",
  "rate-limited",
  "network-error",
  "timeout",
  "content-filtered",
  "unknown",
])

// ─────────────────────────────────────────────────────────────────────────────
// Seam 2 — Brand Record persistence (.visor.yaml, local-first).  Build: VI-562/VI-505.
// ─────────────────────────────────────────────────────────────────────────────

/** Read returns the parsed brand-strategy block, or null when the file/block is absent. */
export const zReadRecordResult = z.union([zDraftBrandRecord, z.null()])

/**
 * Write is idempotent: persisting a record byte-identical to what is on disk is a no-op
 * (idempotent-replay). Writes are atomic (write-temp-then-rename). Local disk only — no server.
 */
export const zWriteRecordRequest = z.object({
  record: zDraftBrandRecord,
  /** absolute or project-relative path to the .visor.yaml */
  path: z.string(),
})

export const zPersistenceFailure = z.enum([
  "file-not-found",
  "parse-error",
  "schema-invalid", // VI-505 brand-strategy validator rejected the block
  "write-failed",
  "permission-denied",
])

// ─────────────────────────────────────────────────────────────────────────────
// Seam 3 — Export manifest (brand-strategy block + agent manifest).  Build: VI-563.
// ─────────────────────────────────────────────────────────────────────────────

export const zExportRequest = z.object({
  /** Export requires a COMPLETE record (all sections present). */
  record: zBrandRecord,
  visibility: z.enum(["public", "private"]),
})

/** Deterministic: re-exporting the same record yields byte-identical output (idempotent). */
export const zExportResult = z.object({
  visorYaml: z.string(), // the `brand-strategy` block, serialized
  agentManifest: z.record(z.string(), z.unknown()), // PUBLIC keys only (visibility-gated)
  coherence: z.array(z.object({ id: z.string(), status: z.enum(["pass", "warn", "fail"]) })),
})

export const zExportFailure = z.enum([
  "incomplete-record", // a required section is missing
  "serialize-error",
  "coherence-blocked", // a hard coherence FAIL blocks export (warnings do NOT — see rules R-PROVE)
])

// ─────────────────────────────────────────────────────────────────────────────
// Inferred types (consumed by build code; mirror spec/types.ts)
// ─────────────────────────────────────────────────────────────────────────────

export type ElicitRequest = z.infer<typeof zElicitRequest>
export type ElicitResponse = z.infer<typeof zElicitResponse>
export type AiFailure = z.infer<typeof zAiFailure>
export type WriteRecordRequest = z.infer<typeof zWriteRecordRequest>
export type PersistenceFailure = z.infer<typeof zPersistenceFailure>
export type ExportRequest = z.infer<typeof zExportRequest>
export type ExportResult = z.infer<typeof zExportResult>
export type ExportFailure = z.infer<typeof zExportFailure>
