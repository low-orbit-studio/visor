// VI-562 — BYOK key management: set / clear / missing flows, status gate, model + cost estimate.

import { describe, it, expect, beforeEach } from "vitest"
import {
  BYOK_KEY_STORAGE,
  MODELS,
  DEFAULT_MODEL,
  getApiKey,
  setApiKey,
  clearApiKey,
  hasKey,
  getKeyStatus,
  getModel,
  setModel,
  estimateCost,
  formatCost,
} from "../lib/byok"

describe("byok — key storage", () => {
  beforeEach(() => localStorage.clear())

  it("missing: getApiKey null, hasKey false, status keyless", () => {
    expect(getApiKey()).toBeNull()
    expect(hasKey()).toBe(false)
    expect(getKeyStatus()).toBe("keyless")
  })

  it("set: persists, hasKey true, status key-active", () => {
    setApiKey("sk-ant-test-123")
    expect(getApiKey()).toBe("sk-ant-test-123")
    expect(hasKey()).toBe(true)
    expect(getKeyStatus()).toBe("key-active")
    expect(localStorage.getItem(BYOK_KEY_STORAGE)).toBe("sk-ant-test-123")
  })

  it("set trims surrounding whitespace", () => {
    setApiKey("  sk-ant-pad  ")
    expect(getApiKey()).toBe("sk-ant-pad")
  })

  it("set with blank/whitespace clears instead of storing a blank key", () => {
    setApiKey("sk-ant-real")
    setApiKey("   ")
    expect(getApiKey()).toBeNull()
    expect(getKeyStatus()).toBe("keyless")
  })

  it("clear: removes the key, drops back to keyless", () => {
    setApiKey("sk-ant-real")
    clearApiKey()
    expect(getApiKey()).toBeNull()
    expect(hasKey()).toBe(false)
    expect(getKeyStatus()).toBe("keyless")
  })

  it("whitespace-only stored value reads as absent", () => {
    localStorage.setItem(BYOK_KEY_STORAGE, "   ")
    expect(getApiKey()).toBeNull()
    expect(getKeyStatus()).toBe("keyless")
  })
})

describe("byok — model selection", () => {
  beforeEach(() => localStorage.clear())

  it("defaults to DEFAULT_MODEL (Opus 4.8) when unset", () => {
    expect(getModel()).toBe(DEFAULT_MODEL)
    expect(DEFAULT_MODEL).toBe("claude-opus-4-8")
  })

  it("persists an offered model and rejects an unknown one", () => {
    setModel("claude-sonnet-4-6")
    expect(getModel()).toBe("claude-sonnet-4-6")
    setModel("gpt-4o")
    expect(getModel()).toBe("claude-sonnet-4-6") // unchanged
  })

  it("falls back to default when the stored model is no longer offered", () => {
    localStorage.setItem("visor-bw-model", "claude-opus-4-1")
    expect(getModel()).toBe(DEFAULT_MODEL)
  })
})

describe("byok — cost estimate", () => {
  it("prices input + output tokens at the model rate card", () => {
    // Opus 4.8: $5 in / $25 out per MTok. 200k in + 40k out = 1.0 + 1.0 = $2.00
    expect(estimateCost("claude-opus-4-8", 200_000, 40_000)).toBeCloseTo(2.0, 6)
    // Sonnet 4.6: $3 in / $15 out. 1M in + 1M out = 3 + 15 = $18.00
    expect(estimateCost("claude-sonnet-4-6", 1_000_000, 1_000_000)).toBeCloseTo(18.0, 6)
  })

  it("unknown model prices at 0", () => {
    expect(estimateCost("nope", 1_000_000, 1_000_000)).toBe(0)
  })

  it("every offered model has positive rates", () => {
    for (const m of MODELS) {
      expect(m.inputPerMTok).toBeGreaterThan(0)
      expect(m.outputPerMTok).toBeGreaterThan(0)
    }
  })

  it("formatCost: sub-cent at 4dp, larger at 2dp", () => {
    expect(formatCost(0.0034)).toBe("$0.0034")
    expect(formatCost(2)).toBe("$2.00")
    expect(formatCost(0)).toBe("$0.00")
  })
})
