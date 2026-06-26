// Brand Record → agent manifest (VI-563, Seam 3 / D3).
//
// The PUBLIC-key projection of a Brand Record — the standalone `manifest.brand.json` an agent reads
// (Mission Control + future agents) the way it reads a component's `when_to_use`. This is the durable
// downstream contract (contracts `zExportResult.agentManifest`: "PUBLIC keys only, visibility-gated").
//
// D3 reconciliation (durable schema — two Verification-Plan items are reconciled here):
//   • "matches VI-505 serialize.ts projection (snapshot parity)" → we DELEGATE to the shipped
//     `serializeBrandStrategy`, so the shared fields cannot drift (drift impossible by construction).
//   • "excludes `core` and private keys" → operator-confirmed D3. `core` is the immutable-subset
//     marker, an internal authoring concern, so we drop it from the agent-facing manifest; a `private`
//     record is visibility-gated to `null` (no public manifest) by the serializer itself.
// `visibility` is kept — it is itself a public, useful key (it tells the agent the brand is public)
// and dropping only `core` is the minimal deviation from the canonical projection.

import { serializeBrandStrategy, type BrandStrategy } from "@loworbitstudio/visor-theme-engine"
import type { BrandRecord } from "../../../../../spec/types"

/**
 * Project a Brand Record into its agent manifest. Returns `null` for a `private` record
 * (visibility-gated — the same rule `serializeBrandStrategy` enforces). The spec BrandRecord is a
 * stricter shape of the engine `BrandStrategy` (the five closed tone contexts ⊂ the engine's set;
 * the Phase-2 fields are required here, optional there), so it projects cleanly.
 */
export function agentManifest(record: BrandRecord): Record<string, unknown> | null {
  const serialized = serializeBrandStrategy(record as BrandStrategy)
  if (serialized === null) return null
  // Drop `core` (internal immutable-subset marker) per D3. Object-rest omit — `core` is intentionally
  // unused, the canonical "drop a property" pattern.
  const { core, ...manifest } = serialized
  return manifest
}
