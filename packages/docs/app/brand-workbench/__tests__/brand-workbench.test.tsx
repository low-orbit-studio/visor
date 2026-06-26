import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import BrandWorkbenchPage from "../page"

// VI-560 makes the seven journey stages navigable. The entry is now the Start view; the strategy
// split-screen (VI-559) is reached by beginning the interview, and the spine doubles as the journey
// nav (clickable nodes). These unit tests mirror the activated Tier-2 oracle (tests/oracle/uj-*.spec)
// at the jsdom level and cover the new navigation + Canvas gating (D-8).

/** Click a spine node by id (scoped to its testid to avoid the top-bar Export ambiguity). */
function clickNode(id: string) {
  fireEvent.click(within(screen.getByTestId(`bw-spine-node-${id}`)).getByRole("button"))
}

/** Render the workbench and begin the interview → lands on the strategy view (Positioning). */
function renderAtStrategy() {
  const utils = render(<BrandWorkbenchPage />)
  fireEvent.click(screen.getByTestId("bw-begin"))
  return utils
}

describe("Brand Workbench — journey stages (VI-560)", () => {
  it("opens on the Start view with the seed/blank paths", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "start")
    expect(screen.getByTestId("bw-start")).toBeInTheDocument()
    expect(screen.getByTestId("bw-path-seed")).toBeInTheDocument()
    expect(screen.getByTestId("bw-path-blank")).toBeInTheDocument()
    expect(screen.getByTestId("bw-name-input")).toBeInTheDocument()
    expect(screen.getByTestId("bw-visibility-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("bw-begin")).toBeInTheDocument()
  })

  it("always renders the shell: top bar progress + spine with every node + mode card", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-global-progress")).toBeInTheDocument()
    expect(screen.getByTestId("bw-spine")).toBeInTheDocument()
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

  it("Begin advances to the strategy split-screen shell", () => {
    renderAtStrategy()
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
    expect(screen.getByTestId("bw-elicit-thread")).toBeInTheDocument()
    expect(screen.getByTestId("bw-canvas")).toBeInTheDocument()
  })

  it("strategy view renders the conversation: header, turns, mad-lib, challenge, set confirmation", () => {
    renderAtStrategy()
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

  it("strategy view renders the composer + BYOK affordances and the live canvas", () => {
    renderAtStrategy()
    expect(screen.getByTestId("bw-key-pill")).toBeInTheDocument()
    expect(screen.getByTestId("bw-model-chip")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-suggestion-chip").length).toBe(3)
    expect(screen.getByTestId("bw-composer")).toBeInTheDocument()
    expect(screen.getByTestId("bw-canvas-mode-toggle")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-canvas-section").length).toBeGreaterThanOrEqual(5)
  })

  it("Canvas mode is gated until Export (D-8), then enabled", () => {
    render(<BrandWorkbenchPage />)
    expect(screen.getByTestId("bw-mode-canvas")).toBeDisabled()
    clickNode("export")
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "export")
    expect(screen.getByTestId("bw-mode-canvas")).not.toBeDisabled()
  })

  it("forward navigation walks Start → Export through the right views", () => {
    render(<BrandWorkbenchPage />)
    const root = screen.getByTestId("bw-root")
    expect(root).toHaveAttribute("data-stage", "start")
    fireEvent.click(screen.getByTestId("bw-begin")) // → positioning (strategy)
    expect(root).toHaveAttribute("data-stage", "strategy")

    const walk: Array<[string, string]> = [
      ["essence", "strategy"],
      ["personality", "strategy"],
      ["pillars", "strategy"],
      ["voice", "verbal"],
      ["tone", "verbal"],
      ["visual", "visual"],
      ["prove", "prove"],
      ["export", "export"],
    ]
    for (const [id, stage] of walk) {
      clickNode(id)
      expect(root).toHaveAttribute("data-stage", stage)
    }
  })

  it("back navigation: clicking a reached spine node returns to its view", () => {
    render(<BrandWorkbenchPage />)
    fireEvent.click(screen.getByTestId("bw-begin"))
    clickNode("voice") // → verbal
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "verbal")
    clickNode("positioning") // back → strategy
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "strategy")
  })
})
