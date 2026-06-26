import { describe, it, expect } from "vitest"
import {
  DERIVATION_SECTIONS,
  downstreamDependents,
} from "../lib/resolve-derivations"

// VI-561 / D4 — re-resolution is SCOPED per pillar: editing a section invalidates only its transitive
// downstream closure off the frozen `DERIVATION_DEPENDENCIES` graph, never the whole record. These
// assert the closure exactly (set-equality, order-insensitive) so a future graph edit fails loudly.

const set = (xs: readonly string[]) => new Set(xs)

describe("resolve-derivations — downstream closure (D4 scope)", () => {
  it("tracks exactly the six derivation sections", () => {
    expect(set(DERIVATION_SECTIONS)).toEqual(
      set(["positioning", "essence", "personality", "pillars", "voice", "tone"]),
    )
  })

  it("positioning (chain root) invalidates the whole downstream closure", () => {
    expect(set(downstreamDependents("positioning"))).toEqual(
      set(["essence", "personality", "pillars", "voice", "tone"]),
    )
  })

  it("essence invalidates personality + pillars and everything below voice/tone", () => {
    expect(set(downstreamDependents("essence"))).toEqual(
      set(["personality", "pillars", "voice", "tone"]),
    )
  })

  it("a sibling edit stays scoped — pillars has no dependents; personality skips pillars", () => {
    expect(downstreamDependents("pillars")).toEqual([])
    // personality → voice → tone, but NOT pillars (pillars derives from essence, not personality).
    expect(set(downstreamDependents("personality"))).toEqual(set(["voice", "tone"]))
  })

  it("voice invalidates only tone; tone is terminal", () => {
    expect(downstreamDependents("voice")).toEqual(["tone"])
    expect(downstreamDependents("tone")).toEqual([])
  })
})
