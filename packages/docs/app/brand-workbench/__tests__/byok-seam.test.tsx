// VI-562 — BYOK control + Elicit seam (component level): keyless manual path, key-active turbo
// path, and the challenge human-gate, at the jsdom level (mirrors the Playwright CUJ).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, renderHook, act, within } from "@testing-library/react"
import BrandWorkbenchPage from "../page"
import { ByokKeyControl } from "../components/byok-settings"
import { useByok } from "../lib/use-byok"
import { BYOK_KEY_STORAGE } from "../lib/byok"

/** Render the workbench and begin → strategy split-screen (where the Elicit seam lives). */
function renderAtStrategy() {
  const utils = render(<BrandWorkbenchPage />)
  fireEvent.click(screen.getByTestId("bw-begin"))
  return utils
}

/** A fetch stub returning one canned Anthropic challenge reply. */
function stubChallengeFetch() {
  const body = {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          kind: "challenge",
          framing: "Is it actually only?",
          body: "Frontify hosts; Brandpad publishes.",
          keepLabel: 'Use "compile"',
          rewriteLabel: "I'll rewrite it",
        }),
      },
    ],
    stop_reason: "end_turn",
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
  )
}

/** A fetch stub returning a non-OK status with an Anthropic-shaped error body. */
function stubErrorFetch(status: number, message: string) {
  const body = JSON.stringify({ type: "error", error: { type: "invalid_request_error", message } })
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(body, { status })),
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe("ByokKeyControl — pill reflects key status", () => {
  it("keyless → 'Add Claude key'", () => {
    render(<ByokKeyControl />)
    expect(screen.getByTestId("bw-key-pill")).toHaveTextContent("Add Claude key")
    expect(screen.getByTestId("bw-key-pill")).toHaveAttribute("data-key-status", "keyless")
  })

  it("with a stored key → 'key active'", () => {
    localStorage.setItem(BYOK_KEY_STORAGE, "sk-ant-x")
    render(<ByokKeyControl />)
    expect(screen.getByTestId("bw-key-pill")).toHaveAttribute("data-key-status", "key-active")
    expect(screen.getByTestId("bw-key-pill")).toHaveTextContent("key active")
  })
})

describe("useByok — reactive save / clear / model", () => {
  it("saveKey flips to key-active; clearKey returns to keyless", () => {
    const { result } = renderHook(() => useByok())
    expect(result.current.keyStatus).toBe("keyless")
    act(() => result.current.saveKey("sk-ant-1"))
    expect(result.current.keyStatus).toBe("key-active")
    expect(result.current.hasKey).toBe(true)
    act(() => result.current.clearKey())
    expect(result.current.keyStatus).toBe("keyless")
  })

  it("chooseModel persists the selection", () => {
    const { result } = renderHook(() => useByok())
    act(() => result.current.chooseModel("claude-sonnet-4-6"))
    expect(result.current.model).toBe("claude-sonnet-4-6")
  })
})

describe("Elicit seam — keyless manual path", () => {
  it("shows manual mode and locks the section via the manual affordance", () => {
    renderAtStrategy()
    const seam = screen.getByTestId("bw-seam")
    expect(seam).toHaveAttribute("data-key-status", "keyless")
    expect(screen.getByTestId("bw-seam-status")).toHaveTextContent("Manual · keyless")
    expect(screen.queryByTestId("bw-seam-locked")).toBeNull()

    fireEvent.click(screen.getByTestId("bw-seam-lock"))
    expect(screen.getByTestId("bw-seam-locked")).toBeInTheDocument()
  })
})

describe("Elicit seam — key-active turbo path + challenge human-gate", () => {
  it("composer send drives a live challenge; section locks only after operator keep", async () => {
    localStorage.setItem(BYOK_KEY_STORAGE, "sk-ant-test")
    stubChallengeFetch()
    renderAtStrategy()

    expect(screen.getByTestId("bw-seam")).toHaveAttribute("data-key-status", "key-active")
    expect(screen.getByTestId("bw-seam-status")).toHaveTextContent("AI turbo")

    // Send a composer message → provider (stubbed) returns a challenge.
    fireEvent.change(screen.getByTestId("bw-composer-input"), {
      target: { value: "A design system you copy and own." },
    })
    fireEvent.click(screen.getByTestId("bw-composer-send"))

    const challenge = await screen.findByTestId("bw-seam-challenge")
    expect(challenge).toBeInTheDocument()
    // Human gate: not locked until the operator explicitly keeps.
    expect(screen.queryByTestId("bw-seam-locked")).toBeNull()

    fireEvent.click(within(challenge).getByTestId("bw-seam-challenge-keep"))
    expect(screen.getByTestId("bw-seam-locked")).toBeInTheDocument()
  })
})

describe("Elicit seam — provider error surfaces the real message (VI-593)", () => {
  it("a non-OK provider response renders the provider detail, not a bare 'unknown'", async () => {
    localStorage.setItem(BYOK_KEY_STORAGE, "sk-ant-test")
    stubErrorFetch(400, "Your credit balance is too low to access the Anthropic API.")
    renderAtStrategy()

    fireEvent.change(screen.getByTestId("bw-composer-input"), {
      target: { value: "A design system you copy and own." },
    })
    fireEvent.click(screen.getByTestId("bw-composer-send"))

    const error = await screen.findByTestId("bw-seam-error")
    expect(error).toHaveTextContent("credit balance is too low")
    expect(error).not.toHaveTextContent("Provider error: unknown.")
  })
})
