import { describe, it, expect } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import BrandWorkbenchPage from "../page"
import { CANVAS_CONTENT } from "../lib/journey-fixtures"

// VI-561 — Guided ⇄ Canvas state. The mode FSM + toggle ship in VI-560; this suite covers the
// net-new behaviour: a single shared draft store (no copy-on-switch), the editable Canvas grid,
// and lazy per-pillar re-resolution (D4). jsdom-level mirror of UJ-B (Canvas Free-Edit Refine).

/** Click a spine node by id (scoped to its testid to avoid the top-bar Export ambiguity). */
function clickNode(id: string) {
  fireEvent.click(within(screen.getByTestId(`bw-spine-node-${id}`)).getByRole("button"))
}

/** The canvas grid cell (wrapper) for a block id — carries the testid + live resolution status. */
function cell(blockId: string): HTMLElement {
  const el = screen
    .getByTestId("bw-board")
    .querySelector(`[data-testid="bw-block"][data-block="${blockId}"]`)
  if (!el) throw new Error(`no canvas block "${blockId}"`)
  return el as HTMLElement
}

/** Render, complete the draft (jump to Export so Canvas unlocks per D-8), then enter Canvas mode. */
function renderAtCanvas() {
  const utils = render(<BrandWorkbenchPage />)
  fireEvent.click(screen.getByTestId("bw-begin")) // → strategy (draft underway)
  clickNode("export") // draft complete → canEnterCanvas
  fireEvent.click(screen.getByTestId("bw-mode-canvas")) // enter Canvas
  expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "canvas")
  return utils
}

/** Inline-edit a Canvas block's value through EditableBlock (open → type → Enter to save). */
function editCanvasBlock(blockId: string, label: string, value: string) {
  const c = cell(blockId)
  fireEvent.click(within(c).getByRole("button", { name: `Edit ${label}` }))
  const input = within(c).getByRole("textbox", { name: `Edit ${label}` })
  fireEvent.change(input, { target: { value } })
  fireEvent.keyDown(input, { key: "Enter" })
}

describe("Brand Workbench — Canvas free-edit (VI-561)", () => {
  it("renders the editable board with every draft block once Canvas is entered", () => {
    renderAtCanvas()
    expect(screen.getByTestId("bw-board")).toBeInTheDocument()
    expect(screen.getAllByTestId("bw-block").length).toBe(CANVAS_CONTENT.blocks.length)
    // Seeded from the dogfood Brand Record's board projection.
    expect(within(cell("positioning")).getByText(/only design system/i)).toBeInTheDocument()
    expect(within(cell("essence")).getByText(/coherent/i)).toBeInTheDocument()
  })

  it("mode toggle preserves the draft both directions — single shared store, no copy-on-switch", () => {
    renderAtCanvas()
    editCanvasBlock("positioning", "Positioning", "We are the only X.")
    expect(within(cell("positioning")).getByText("We are the only X.")).toBeInTheDocument()

    // Canvas → Guided → Canvas: the edit survives the round trip (the store never re-seeds).
    fireEvent.click(screen.getByTestId("bw-mode-guided"))
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "export")
    fireEvent.click(screen.getByTestId("bw-mode-canvas"))
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "canvas")
    expect(within(cell("positioning")).getByText("We are the only X.")).toBeInTheDocument()
  })

  it("editing a Strategy block marks its downstream closure stale, then re-resolves on next Guided view (D4)", () => {
    renderAtCanvas()

    // Positioning is the root of the derivation chain → editing it invalidates its whole
    // downstream closure (essence → personality/pillars → voice → tone), scoped to that pillar.
    editCanvasBlock("positioning", "Positioning", "We are the only X.")
    expect(cell("essence")).toHaveAttribute("data-status", "stale")
    expect(cell("voice")).toHaveAttribute("data-status", "stale")
    expect(cell("tone")).toHaveAttribute("data-status", "stale")
    // The edited section itself stays set (it is the source, not a derivation).
    expect(cell("positioning")).toHaveAttribute("data-status", "set")

    // Lazy, not eager: staleness persists in Canvas; it clears only when the Guided view that owns
    // the downstream section next renders. Switch to Guided and open the Verbal stage (voice + tone).
    fireEvent.click(screen.getByTestId("bw-mode-guided"))
    clickNode("voice")
    expect(screen.getByTestId("bw-root")).toHaveAttribute("data-stage", "verbal")

    // Back on Canvas, voice + tone have re-resolved; an unviewed branch (essence) is still stale.
    clickNode("export")
    fireEvent.click(screen.getByTestId("bw-mode-canvas"))
    expect(cell("voice")).toHaveAttribute("data-status", "set")
    expect(cell("tone")).toHaveAttribute("data-status", "set")
    expect(cell("essence")).toHaveAttribute("data-status", "stale")
  })
})
