// VI-562 — Challenge generator: prompt construction + reply normalization (human-gated, D4).

import { describe, it, expect } from "vitest"
import {
  buildChallengePrompt,
  parseChallenge,
  toElicitChallenge,
  DEFAULT_KEEP_LABEL,
  DEFAULT_REWRITE_LABEL,
} from "../lib/challenge-generator"

describe("buildChallengePrompt", () => {
  it("embeds the step + claim and asks for a challenge JSON, deterministically", () => {
    const a = buildChallengePrompt("positioning", "one portable file", { essence: ["coherent"] })
    const b = buildChallengePrompt("positioning", "one portable file", { essence: ["coherent"] })
    expect(a).toBe(b) // no Date/random — stable
    expect(a).toContain("positioning")
    expect(a).toContain("one portable file")
    expect(a).toContain('"kind":"challenge"')
  })
})

describe("parseChallenge", () => {
  it("returns a full challenge unchanged", () => {
    const c = parseChallenge({
      kind: "challenge",
      framing: "Is it only?",
      body: "Frontify hosts; Brandpad publishes.",
      keepLabel: 'Use "compile"',
      rewriteLabel: "I'll rewrite it",
    })
    expect(c).toEqual({
      framing: "Is it only?",
      body: "Frontify hosts; Brandpad publishes.",
      keepLabel: 'Use "compile"',
      rewriteLabel: "I'll rewrite it",
    })
  })

  it("fills default labels when the AI omits them", () => {
    const c = parseChallenge({ framing: "Really?", body: "Defend the wedge." })
    expect(c?.keepLabel).toBe(DEFAULT_KEEP_LABEL)
    expect(c?.rewriteLabel).toBe(DEFAULT_REWRITE_LABEL)
  })

  it("trims surrounding whitespace", () => {
    const c = parseChallenge({ framing: "  Really?  ", body: "  defend  " })
    expect(c?.framing).toBe("Really?")
    expect(c?.body).toBe("defend")
  })

  it("returns null when framing or body is missing/blank", () => {
    expect(parseChallenge({ body: "x" })).toBeNull()
    expect(parseChallenge({ framing: "x" })).toBeNull()
    expect(parseChallenge({ framing: "   ", body: "x" })).toBeNull()
  })

  it("returns null for a non-challenge kind or a non-object", () => {
    expect(parseChallenge({ kind: "text", content: "hi" })).toBeNull()
    expect(parseChallenge(null)).toBeNull()
    expect(parseChallenge("nope")).toBeNull()
  })
})

describe("toElicitChallenge", () => {
  it("lifts a Challenge into a valid frozen-contract challenge ElicitResponse", () => {
    const resp = toElicitChallenge({
      framing: "f",
      body: "b",
      keepLabel: "k",
      rewriteLabel: "r",
    })
    expect(resp).toEqual({ kind: "challenge", framing: "f", body: "b", keepLabel: "k", rewriteLabel: "r" })
  })
})
