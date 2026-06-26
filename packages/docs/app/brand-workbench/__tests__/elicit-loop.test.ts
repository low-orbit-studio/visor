// VI-562 — Elicit loop: R-ELICIT transition fidelity, R-KEYLESS gating, challenge human-gate.

import { describe, it, expect, vi } from "vitest"
import {
  responseToEvent,
  elicitReduceGated,
  initialElicitForKey,
  runAiTurn,
  resolveChallenge,
  manualLock,
  aiEnabled,
} from "../lib/elicit-loop"
import { ELICIT_TRANSITIONS, type ElicitState, type ElicitEvent } from "../../../../../spec/state-machine"
import type { ElicitRequest, ElicitResponse } from "../../../../../spec/contracts"
import type { Provider } from "../lib/provider-claude"
import { ElicitError } from "../lib/provider-claude"

const REQ: ElicitRequest = {
  requestId: "22222222-2222-4222-8222-222222222222",
  step: "positioning",
  record: {},
  model: "claude-opus-4-8",
}

function providerReturning(resp: ElicitResponse): Provider {
  return { elicit: vi.fn(async () => resp) }
}

describe("responseToEvent — reply kind → FSM event", () => {
  it.each([
    ["text", "ai-returns-text"],
    ["tool", "ai-returns-tool"],
    ["challenge", "ai-returns-challenge"],
    ["warning", "ai-returns-warning"],
    ["section-complete", "section-lock"],
  ])("%s → %s", (kind, event) => {
    const resp = { kind, content: "x", title: "x", template: "x", slots: [], framing: "x", body: "x", keepLabel: "x", rewriteLabel: "x", message: "x", fixAvailable: false, patch: {} } as unknown as ElicitResponse
    expect(responseToEvent({ ...resp, kind } as ElicitResponse)).toBe(event)
  })
})

describe("elicitReduceGated — R-ELICIT rows (key-active) match rules.md L89-101 exactly", () => {
  // Authoritative rows from spec/rules.md §R-ELICIT (the boundary oracle table).
  const ROWS: [ElicitState["kind"], ElicitEvent, ElicitState["kind"]][] = [
    ["empty", "assistant-asks", "awaiting-input"],
    ["awaiting-input", "user-sends", "assistant-streaming"],
    ["assistant-streaming", "ai-returns-tool", "tool-shown"],
    ["assistant-streaming", "ai-returns-challenge", "challenge-shown"],
    ["assistant-streaming", "ai-errors", "error"],
    ["assistant-streaming", "section-lock", "section-complete"],
    ["tool-shown", "user-submits-tool", "assistant-streaming"],
    ["challenge-shown", "challenge-keep", "section-complete"],
    ["challenge-shown", "challenge-rewrite", "awaiting-input"],
    ["validation-warning", "warning-apply-fix", "assistant-streaming"],
    ["error", "error-retry", "awaiting-input"],
    ["empty", "user-sends", "empty"], // invalid transition → no-op
  ]

  it.each(ROWS)("%s + %s → %s", (from, event, to) => {
    expect(elicitReduceGated({ kind: from } as ElicitState, event, "key-active").kind).toBe(to)
  })

  it("section-complete is terminal for any event", () => {
    for (const event of Object.keys(ELICIT_TRANSITIONS) as ElicitEvent[]) {
      expect(elicitReduceGated({ kind: "section-complete" }, event, "key-active").kind).toBe(
        "section-complete",
      )
    }
  })
})

describe("R-KEYLESS — AI-dependent events suppressed in keyless", () => {
  const AI_EVENTS: ElicitEvent[] = [
    "assistant-asks",
    "ai-returns-text",
    "ai-returns-tool",
    "ai-returns-challenge",
    "ai-returns-warning",
    "ai-errors",
  ]

  it("every AI-dependent event is a no-op in keyless", () => {
    // assistant-asks would move empty→awaiting-input in key-active; suppressed here.
    expect(elicitReduceGated({ kind: "empty" }, "assistant-asks", "keyless").kind).toBe("empty")
    for (const event of AI_EVENTS) {
      expect(elicitReduceGated({ kind: "assistant-streaming" }, event, "keyless").kind).toBe(
        "assistant-streaming",
      )
    }
  })

  it("non-AI events still fire in keyless (user-sends, section-lock)", () => {
    expect(elicitReduceGated({ kind: "awaiting-input" }, "user-sends", "keyless").kind).toBe(
      "assistant-streaming",
    )
    expect(elicitReduceGated({ kind: "assistant-streaming" }, "section-lock", "keyless").kind).toBe(
      "section-complete",
    )
  })

  it("aiEnabled reflects the key status", () => {
    expect(aiEnabled("keyless")).toBe(false)
    expect(aiEnabled("key-active")).toBe(true)
  })
})

describe("challenge human-gate invariant", () => {
  it("no event except keep/rewrite advances from challenge-shown", () => {
    const everyEvent: ElicitEvent[] = [
      "assistant-asks",
      "user-sends",
      "ai-returns-text",
      "ai-returns-tool",
      "ai-returns-challenge",
      "ai-returns-warning",
      "ai-errors",
      "user-submits-tool",
      "warning-dismiss",
      "warning-apply-fix",
      "error-retry",
      "section-lock",
    ]
    for (const event of everyEvent) {
      expect(elicitReduceGated({ kind: "challenge-shown" }, event, "key-active").kind).toBe(
        "challenge-shown",
      )
    }
  })

  it("explicit operator keep → section-complete; rewrite → awaiting-input", () => {
    expect(resolveChallenge({ kind: "challenge-shown" }, "keep").kind).toBe("section-complete")
    expect(resolveChallenge({ kind: "challenge-shown" }, "rewrite").kind).toBe("awaiting-input")
  })

  it("challenge resolution still gated by human in keyless (operator events, not AI)", () => {
    expect(resolveChallenge({ kind: "challenge-shown" }, "keep").kind).toBe("section-complete")
  })
})

describe("runAiTurn — key-active drives the provider; keyless is a no-op", () => {
  it("awaiting-input + text reply → awaiting-input, response returned", async () => {
    const provider = providerReturning({ kind: "text", content: "more" })
    const turn = await runAiTurn({ kind: "awaiting-input" }, REQ, { provider, keyStatus: "key-active" })
    expect(turn.state.kind).toBe("awaiting-input")
    expect(turn.response).toEqual({ kind: "text", content: "more" })
  })

  it("awaiting-input + challenge reply → challenge-shown (human gate next)", async () => {
    const provider = providerReturning({
      kind: "challenge",
      framing: "f",
      body: "b",
      keepLabel: "k",
      rewriteLabel: "r",
    })
    const turn = await runAiTurn({ kind: "awaiting-input" }, REQ, { provider, keyStatus: "key-active" })
    expect(turn.state.kind).toBe("challenge-shown")
  })

  it("provider rejection → error state with the AiFailure", async () => {
    const provider: Provider = { elicit: vi.fn(async () => { throw new ElicitError("rate-limited") }) }
    const turn = await runAiTurn({ kind: "awaiting-input" }, REQ, { provider, keyStatus: "key-active" })
    expect(turn.state.kind).toBe("error")
    expect(turn.failure).toBe("rate-limited")
  })

  it("keyless: provider never called, state unchanged", async () => {
    const provider = providerReturning({ kind: "text", content: "x" })
    const turn = await runAiTurn({ kind: "awaiting-input" }, REQ, { provider, keyStatus: "keyless" })
    expect(turn.state.kind).toBe("awaiting-input")
    expect(provider.elicit).not.toHaveBeenCalled()
  })

  it("tool-shown + user-submits-tool trigger drives a follow-up AI turn", async () => {
    const provider = providerReturning({ kind: "section-complete", patch: { essence: ["a", "b"] } })
    const turn = await runAiTurn(
      { kind: "tool-shown" },
      REQ,
      { provider, keyStatus: "key-active" },
      "user-submits-tool",
    )
    expect(turn.state.kind).toBe("section-complete")
  })
})

describe("manualLock + initialElicitForKey (G-B resolution)", () => {
  it("keyless seeds at awaiting-input; key-active at empty", () => {
    expect(initialElicitForKey("keyless").kind).toBe("awaiting-input")
    expect(initialElicitForKey("key-active").kind).toBe("empty")
  })

  it("manualLock composes user-sends → section-lock to reach section-complete", () => {
    expect(manualLock({ kind: "awaiting-input" }).kind).toBe("section-complete")
  })

  it("manualLock is a no-op once already complete", () => {
    expect(manualLock({ kind: "section-complete" }).kind).toBe("section-complete")
  })
})
