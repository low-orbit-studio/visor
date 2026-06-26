// VI-563 — agent-manifest: the PUBLIC-key projection (D3). Excludes `core`; visibility-gated to null
// for private; snapshot parity with the shipped VI-505 serializeBrandStrategy (drift guard).

import { describe, it, expect } from "vitest"
import { serializeBrandStrategy, type BrandStrategy } from "@loworbitstudio/visor-theme-engine"
import { agentManifest } from "../lib/agent-manifest"
import { VISOR_BRAND_RECORD } from "../lib/brand-record-fixture"

describe("agent-manifest — PUBLIC-key projection (VI-563, D3)", () => {
  it("excludes the internal `core` immutable-subset marker", () => {
    const m = agentManifest(VISOR_BRAND_RECORD)
    expect(m).not.toBeNull()
    expect(m).not.toHaveProperty("core")
  })

  it("is visibility-gated: a private record yields no public manifest", () => {
    expect(agentManifest({ ...VISOR_BRAND_RECORD, visibility: "private" })).toBeNull()
  })

  it("carries every PUBLIC key an agent consumes", () => {
    const m = agentManifest(VISOR_BRAND_RECORD)!
    const publicKeys = [
      "positioning", "essence", "personality", "archetype", "pillars", "voice",
      "tone", "lexicon", "messaging", "taglines", "boilerplate", "colorUsage",
      "accessibility", "visibility",
    ]
    for (const key of publicKeys) expect(m).toHaveProperty(key)
  })

  it("matches the VI-505 serialize.ts projection minus `core` (drift guard — parity by construction)", () => {
    const full = serializeBrandStrategy(VISOR_BRAND_RECORD as BrandStrategy)!
    const { core, ...expected } = full
    expect(agentManifest(VISOR_BRAND_RECORD)).toEqual(expected)
  })

  it("pins the public projection shape (snapshot)", () => {
    expect(agentManifest(VISOR_BRAND_RECORD)).toMatchSnapshot()
  })
})
