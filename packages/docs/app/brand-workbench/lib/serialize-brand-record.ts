// Brand Record → `.visor.yaml` `brand-strategy:` block (VI-563, Seam 3 / D1).
//
// Serializes a COMPLETE Brand Record into the YAML block a user writes to their `.visor.yaml`
// (sibling to the asset-only `brand:` block). Deterministic and round-tripping: parsing the output
// back under `brand-strategy:` reconstructs the identical record (contracts `zExportResult.visorYaml`).
//
// This is the FULL record — `core` and `visibility` included — so the block round-trips and the
// engine `brand-strategy` validator accepts it. (The agent manifest is the narrower PUBLIC projection;
// see ./agent-manifest.) No theme-engine edit: the docs app owns its YAML emit via the `yaml` package,
// the same library the engine uses internally.

import { stringify } from "yaml"
import type { BrandRecord } from "../../../../../spec/types"

/**
 * Serialize a complete Brand Record to its `.visor.yaml` `brand-strategy:` block.
 *
 * `lineWidth: 0` disables line-folding so long scalars (boilerplate, pillar proofs) round-trip
 * byte-for-byte — `parse(serializeBrandRecord(r))["brand-strategy"]` deep-equals `r`.
 */
export function serializeBrandRecord(record: BrandRecord): string {
  return stringify({ "brand-strategy": record }, { lineWidth: 0 })
}
