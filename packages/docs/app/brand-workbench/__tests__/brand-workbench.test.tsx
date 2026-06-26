import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import BrandWorkbenchPage from "../page"

// Mirrors the activated Tier-2 oracle (tests/oracle/uj-*.spec.ts) at the unit level: the static
// Strategy core screen must expose every testid those specs query. Keeps the contract green in the
// fast jsdom run, not only under Playwright.
describe("Brand Workbench — core Elicit screen (VI-559)", () => {
  it("renders the strategy split-screen shell", () => {
    render(<BrandWorkbenchPage />)
    const root = screen.getByTestId("bw-root")
    expect(root).toHaveAttribute("data-stage", "strategy")
    expect(screen.getByTestId("bw-global-progress")).toBeInTheDocument()
    expect(screen.getByTestId("bw-spine")).toBeInTheDocument()
    expect(screen.getByTestId("bw-elicit-thread")).toBeInTheDocument()
    expect(screen.getByTestId("bw-canvas")).toBeInTheDocument()
  })

  it("renders the derivation spine: progress card, every node, mode card", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-spine-progress-card")).toBeInTheDocument()
    for (const id of [
      "start",
      "positioning",
      "essence",
      "personality",
      "pillars",
      "voice",
      "tone",
      "visual",
      "prove",
      "export",
    ]) {
      expect(screen.getByTestId(`bw-spine-node-${id}`)).toBeInTheDocument()
    }
    expect(screen.getByTestId("bw-mode-guided")).toBeInTheDocument()
    expect(screen.getByTestId("bw-mode-canvas")).toBeInTheDocument()
  })

  it("renders the conversation: header, turns, mad-lib, challenge, set confirmation", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-elicit-breadcrumb")).toBeInTheDocument()
    expect(screen.getByTestId("bw-elicit-stepmeter")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-turn-assistant").length).toBeGreaterThanOrEqual(3)
    expect(screen.getAllByTestId("bw-turn-user").length).toBeGreaterThanOrEqual(2)
    expect(screen.getByTestId("bw-tool")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-tool-slot").length).toBe(3)
    expect(screen.getByTestId("bw-challenge")).toBeInTheDocument()
    expect(screen.getByTestId("bw-challenge-keep")).toBeInTheDocument()
    expect(screen.getByTestId("bw-challenge-rewrite")).toBeInTheDocument()
    expect(screen.getByTestId("bw-section-complete")).toBeInTheDocument()
  })

  it("renders the composer + BYOK affordances", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-key-pill")).toBeInTheDocument()
    expect(screen.getByTestId("bw-model-chip")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-suggestion-chip").length).toBe(3)
    expect(screen.getByTestId("bw-composer")).toBeInTheDocument()
    expect(screen.getByTestId("bw-composer-input")).toBeInTheDocument()
    expect(screen.getByTestId("bw-composer-send")).toBeInTheDocument()
  })

  it("renders the live brand canvas with multiple sections", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-canvas-mode-toggle")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-canvas-section").length).toBeGreaterThanOrEqual(5)
  })
})
