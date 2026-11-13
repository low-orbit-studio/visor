import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

import { KanbanBoard, neighborCard, type KanbanBoardColumn } from "../kanban-board"
import { checkA11y } from "../../../test-utils/a11y"

interface Deal {
  id: string
  name: string
}

const COLUMNS: KanbanBoardColumn<Deal>[] = [
  { id: "lead", label: "Lead", total: "$12k", items: [{ id: "a", name: "Acme" }, { id: "b", name: "Bolt" }] },
  { id: "won", label: "Won", items: [{ id: "c", name: "Cove" }], empty: "Nothing won." },
  { id: "paused", label: "Paused", items: [{ id: "d", name: "Dune" }] },
]

function setup(props: Partial<React.ComponentProps<typeof KanbanBoard<Deal>>> = {}) {
  const onMove = vi.fn()
  const utils = render(
    <KanbanBoard<Deal>
      aria-label="Deals"
      columns={COLUMNS}
      rails={["paused"]}
      renderCard={(d) => <span>{d.name}</span>}
      getItemLabel={(d) => d.name}
      onMove={onMove}
      {...props}
    />
  )
  const card = (name: string) => screen.getByText(name).closest<HTMLElement>("[data-card-id]")!
  const live = () => utils.container.querySelector("[aria-live]")!.textContent
  return { ...utils, onMove, card, live }
}

/** Moves the card between columns, the way a consumer's onMove would. */
function Stateful() {
  const [columns, setColumns] = React.useState(COLUMNS)
  return (
    <KanbanBoard<Deal>
      columns={columns}
      rails={["paused"]}
      renderCard={(d) => <span>{d.name}</span>}
      getItemLabel={(d) => d.name}
      onMove={(id, to) =>
        setColumns((cols) => {
          const item = cols.flatMap((c) => c.items).find((i) => i.id === id)!
          return cols.map((c) => ({
            ...c,
            items: c.id === to ? [...c.items, item] : c.items.filter((i) => i.id !== id),
          }))
        })
      }
    />
  )
}

function drag(source: HTMLElement, target: HTMLElement, id = source.dataset.cardId!) {
  const dataTransfer = { setData: vi.fn(), getData: () => id, effectAllowed: "", dropEffect: "" }
  fireEvent.dragStart(source, { dataTransfer })
  fireEvent.dragOver(target, { dataTransfer })
  fireEvent.drop(target, { dataTransfer })
}

describe("neighborCard", () => {
  const cols = [["a", "b"], [], ["c"]]

  it("moves up and down within a column", () => {
    expect(neighborCard(cols, "a", "ArrowDown")).toBe("b")
    expect(neighborCard(cols, "b", "ArrowUp")).toBe("a")
    expect(neighborCard(cols, "a", "ArrowUp")).toBeNull()
  })

  it("skips empty columns and clamps to the nearest row", () => {
    expect(neighborCard(cols, "b", "ArrowRight")).toBe("c")
    expect(neighborCard(cols, "c", "ArrowLeft")).toBe("a")
    expect(neighborCard(cols, "c", "ArrowRight")).toBeNull()
  })

  it("returns null for an unknown id or key", () => {
    expect(neighborCard(cols, "z", "ArrowDown")).toBeNull()
    expect(neighborCard(cols, "a", "Home")).toBeNull()
  })
})

describe("KanbanBoard", () => {
  it("renders columns with label, count, total and cards", () => {
    setup()
    const lead = screen.getByRole("region", { name: "Lead" })
    expect(lead).toHaveTextContent("Lead2$12k")
    expect(screen.getAllByRole("listitem")).toHaveLength(3)
  })

  it("shows a column's empty text when it has no cards", () => {
    setup({ columns: [COLUMNS[0], { ...COLUMNS[1], items: [] }] })
    expect(screen.getByText("Nothing won.")).toBeInTheDocument()
  })

  // ─── Keyboard ──────────────────────────────────────────────────────────

  it("Space, ArrowRight, Space calls onMove with the next column", () => {
    const { card, onMove, live } = setup()
    fireEvent.keyDown(card("Acme"), { key: " " })
    expect(live()).toMatch(/Picked up Acme/)
    expect(card("Acme")).toHaveAttribute("data-grabbed")
    fireEvent.keyDown(card("Acme"), { key: "ArrowRight" })
    expect(live()).toBe("Over Won.")
    expect(screen.getByRole("region", { name: "Won" })).toHaveAttribute("data-target")
    fireEvent.keyDown(card("Acme"), { key: " " })
    expect(onMove).toHaveBeenCalledWith("a", "won")
    expect(live()).toBe("Acme moved to Won.")
  })

  it("Enter also drops a held card", () => {
    const { card, onMove } = setup()
    fireEvent.keyDown(card("Cove"), { key: " " })
    fireEvent.keyDown(card("Cove"), { key: "ArrowLeft" })
    fireEvent.keyDown(card("Cove"), { key: "Enter" })
    expect(onMove).toHaveBeenCalledWith("c", "lead")
  })

  it("Escape cancels and calls nothing", () => {
    const { card, onMove, live } = setup()
    fireEvent.keyDown(card("Acme"), { key: " " })
    fireEvent.keyDown(card("Acme"), { key: "ArrowRight" })
    fireEvent.keyDown(card("Acme"), { key: "Escape" })
    expect(onMove).not.toHaveBeenCalled()
    expect(card("Acme")).not.toHaveAttribute("data-grabbed")
    expect(live()).toBe("Move cancelled. Acme stays in Lead.")
  })

  it("dropping in the card's own column calls nothing", () => {
    const { card, onMove, live } = setup()
    fireEvent.keyDown(card("Acme"), { key: " " })
    fireEvent.keyDown(card("Acme"), { key: "ArrowLeft" })
    fireEvent.keyDown(card("Acme"), { key: " " })
    expect(onMove).not.toHaveBeenCalled()
    expect(live()).toBe("Acme stays in Lead.")
  })

  it("a keyboard drop on a collapsed rail opens it and keeps focus on the card", () => {
    render(<Stateful />)
    const acme = screen.getByText("Acme").closest<HTMLElement>("[data-card-id]")!
    acme.focus()
    fireEvent.keyDown(acme, { key: " " })
    fireEvent.keyDown(acme, { key: "ArrowRight" })
    fireEvent.keyDown(acme, { key: "ArrowRight" })
    act(() => {
      fireEvent.keyDown(acme, { key: " " })
    })
    const paused = screen.getByRole("region", { name: "Paused" })
    expect(paused).toHaveTextContent("Acme")
    expect(document.activeElement).toHaveTextContent("Acme")
  })

  it("arrows move focus between cards when nothing is held", () => {
    const { card } = setup()
    card("Acme").focus()
    fireEvent.keyDown(card("Acme"), { key: "ArrowDown" })
    expect(document.activeElement).toBe(card("Bolt"))
    fireEvent.keyDown(card("Bolt"), { key: "ArrowRight" })
    expect(document.activeElement).toBe(card("Cove"))
  })

  it("Enter opens the card when nothing is held", () => {
    const onCardOpen = vi.fn()
    const { card } = setup({ onCardOpen })
    fireEvent.keyDown(card("Bolt"), { key: "Enter" })
    expect(onCardOpen).toHaveBeenCalledWith({ id: "b", name: "Bolt" })
  })

  // ─── Drag ──────────────────────────────────────────────────────────────

  it("dragging a card onto another column calls onMove", () => {
    const { card, onMove } = setup()
    drag(card("Acme"), screen.getByRole("region", { name: "Won" }))
    expect(onMove).toHaveBeenCalledWith("a", "won")
  })

  it("a drop on a collapsed rail calls onMove with the rail's column", () => {
    const { card, onMove } = setup()
    drag(card("Cove"), screen.getByRole("button", { name: /Paused, 1 cards/ }))
    expect(onMove).toHaveBeenCalledWith("c", "paused")
  })

  it("ignores drops from outside the board and drops on the same column", () => {
    const { card, onMove } = setup()
    drag(card("Acme"), screen.getByRole("region", { name: "Won" }), "not-a-card")
    drag(card("Acme"), screen.getByRole("region", { name: "Lead" }))
    expect(onMove).not.toHaveBeenCalled()
  })

  // ─── Rails ─────────────────────────────────────────────────────────────

  it("a collapsed rail expands on click and collapses from its header", () => {
    setup()
    const rail = screen.getByRole("button", { name: /Paused, 1 cards/ })
    expect(rail).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Dune")).not.toBeInTheDocument()
    fireEvent.click(rail)
    expect(screen.getByRole("region", { name: "Paused" })).toHaveTextContent("Dune")
    fireEvent.click(screen.getByRole("button", { name: "Paused. Collapse column" }))
    expect(screen.queryByText("Dune")).not.toBeInTheDocument()
  })

  it("renders a column footer", () => {
    setup({ renderColumnFooter: (c) => <button type="button">Add to {c.label}</button> })
    expect(screen.getByRole("button", { name: "Add to Lead" })).toBeInTheDocument()
  })

  it("has no axe violations", async () => {
    const { container } = setup()
    await checkA11y(container)
  })
})
