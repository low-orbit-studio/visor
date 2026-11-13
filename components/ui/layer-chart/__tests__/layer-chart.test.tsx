import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { LayerChart, SpanStrip, type LayerNode } from "../layer-chart"
import { foldThin, geom, layout, rowsFor, ROW_HEIGHTS } from "../layer-chart-layout"

const T = (id: string, value: number, extra: Partial<LayerNode> = {}): LayerNode => ({ id, name: id, layer: "Tickets", value, ...extra })

const tree: LayerNode = {
  id: "all",
  name: "All clients",
  layer: "All",
  children: [
    {
      id: "a",
      name: "Client A",
      layer: "Clients",
      hue: 147,
      children: [
        { id: "a/p1", name: "Website rebuild", layer: "Packages", children: [T("a/p1/t1", 6), T("a/p1/t2", 2)] },
        { id: "a/cov", name: "Covered", layer: "Packages", kind: "covered", children: [T("a/cov/t3", 2)] },
      ],
    },
    { id: "b", name: "Client B", layer: "Clients", hue: 219, children: [T("b/t4", 10)] },
    { id: "u", name: "Unassigned", layer: "Clients", kind: "unresolved", value: 0 },
  ],
}

// jsdom has no layout: give the canvas a width so blocks are drawn.
function withWidth(width: number) {
  return vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(width)
}

describe("layer chart layout", () => {
  it("shares each node's span among its children by the measure", () => {
    const { root, byId } = layout(tree, (n) => n.value)
    expect(root.value).toBe(20)
    expect(byId.get("a")!.x1).toBeCloseTo(0.5)
    expect(byId.get("b")!.x0).toBeCloseTo(0.5)
    expect(byId.get("a/p1/t1")!.x1).toBeCloseTo(0.3)
    // a value of zero takes no width
    expect(byId.get("u")!.x1 - byId.get("u")!.x0).toBe(0)
  })

  it("inherits hue and kind from the ancestors", () => {
    const { byId } = layout(tree, (n) => n.value)
    expect(byId.get("a/p1/t1")!.hue).toBe(147)
    expect(byId.get("a/cov/t3")!.kind).toBe("covered")
    expect(byId.get("a/p1/t1")!.kind).toBe("solid")
  })

  it("re-partitions the same shapes under another measure", () => {
    const { byId } = layout(tree, (n) => (n.id === "b" ? 30 : n.value))
    expect(byId.get("b")!.x0).toBeCloseTo(0.25)
  })

  it("stacks the path, the focus and three layers below at falling heights", () => {
    const { byId } = layout(tree, (n) => n.value)
    const { rows } = rowsFor(byId.get("a")!, false)
    expect(rows.map((r) => r.role)).toEqual(["anc", "focus", "kids", "gkids"])
    expect(rows.map((r) => r.h)).toEqual([ROW_HEIGHTS.desk.anc, ROW_HEIGHTS.desk.focus, ROW_HEIGHTS.desk.kids, ROW_HEIGHTS.desk.gkids])
    expect(rows[2].label).toBe("Packages")
    expect(rowsFor(byId.get("a")!, true).rows[2].h).toBe(108)
  })

  it("grows the focus to full width and clamps the path rows", () => {
    const { byId } = layout(tree, (n) => n.value)
    const F = byId.get("b")!
    const ctx = { F, rows: rowsFor(F, false).rows, W: 1000 }
    expect(geom(F.x0, F.x1, F.depth, ctx)).toMatchObject({ l: 1.5, w: 997 })
    const root = byId.get("all")!
    expect(geom(root.x0, root.x1, 0, ctx)).toMatchObject({ l: 1.5, w: 997 })
    // a sibling of the focus slides off the canvas
    const a = byId.get("a")!
    expect(geom(a.x0, a.x1, a.depth, ctx)!.l).toBeLessThan(0)
  })

  it("folds children under 6px into one +n block", () => {
    const many: LayerNode = { id: "r", name: "r", children: [T("big", 1000), ...Array.from({ length: 5 }, (_, i) => T(`s${i}`, 1))] }
    const { root } = layout(many, (n) => n.value)
    const ctx = { F: root, rows: rowsFor(root, false).rows, W: 800 }
    const { more, folded } = foldThin(root, ctx)
    expect(more).toHaveLength(1)
    expect(more[0].more).toHaveLength(5)
    expect(more[0].value).toBe(5)
    expect(folded.has("s0")).toBe(true)
  })
})

describe("LayerChart", () => {
  it("draws each block as a button named with its value", () => {
    const w = withWidth(1000)
    render(<LayerChart data={tree} format={(v) => `${v} h`} />)
    expect(screen.getByRole("group", { name: "Layers" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Client A, 10 h" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Website rebuild, 8 h" })).toBeInTheDocument()
    // zero leaves the chart: hidden from the tab order and assistive tech
    expect(screen.queryByRole("button", { name: /Unassigned/ })).toBeNull()
    w.mockRestore()
  })

  it("opens a block on click and goes up a layer on Escape", () => {
    const w = withWidth(1000)
    const onFocusChange = vi.fn()
    render(<LayerChart data={tree} onFocusChange={onFocusChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Client A, 10" }))
    expect(onFocusChange).toHaveBeenLastCalledWith("a", expect.objectContaining({ id: "a" }), "open")
    expect(screen.getByRole("button", { name: "Client A, 10" })).toHaveAttribute("aria-current", "true")
    expect(screen.getByRole("button", { name: "Client A, 10" })).toHaveAttribute("data-role", "focus")
    fireEvent.keyDown(screen.getByRole("button", { name: "Client A, 10" }), { key: "Escape" })
    expect(onFocusChange).toHaveBeenLastCalledWith("all", expect.objectContaining({ id: "all" }), "up")
    w.mockRestore()
  })

  it("follows a controlled focus id", () => {
    const w = withWidth(1000)
    const { rerender } = render(<LayerChart data={tree} focusId="b" />)
    expect(screen.getByRole("button", { name: "Client B, 10" })).toHaveAttribute("data-role", "focus")
    rerender(<LayerChart data={tree} focusId="a" />)
    expect(screen.getByRole("button", { name: "Client A, 10" })).toHaveAttribute("data-role", "focus")
    w.mockRestore()
  })

  it("moves along the main row with the arrow keys", () => {
    const w = withWidth(1000)
    render(<LayerChart data={tree} />)
    const a = screen.getByRole("button", { name: "Client A, 10" })
    const b = screen.getByRole("button", { name: "Client B, 10" })
    fireEvent.keyDown(a, { key: "ArrowRight" })
    expect(document.activeElement).toBe(a)
    fireEvent.keyDown(a, { key: "ArrowRight" })
    expect(document.activeElement).toBe(b)
    fireEvent.keyDown(b, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(a)
    w.mockRestore()
  })

  it("marks kinds, depth tones and hues on the blocks", () => {
    const w = withWidth(1000)
    const { container } = render(<LayerChart data={tree} />)
    const cov = container.querySelector<HTMLElement>('[data-id="a/cov"]')!
    expect(cov).toHaveAttribute("data-kind", "covered")
    expect(cov).toHaveAttribute("data-tone", "1")
    expect(cov.style.getPropertyValue("--layer-hue-fill")).toBe("var(--paper-hue-147-fill)")
    expect(container.querySelector('[data-id="all"]')).toHaveAttribute("data-root")
    w.mockRestore()
  })

  it("draws a block's slot and the band where it is measured", () => {
    const w = withWidth(1000)
    const { container } = render(
      <LayerChart
        data={tree}
        renderBlock={(n) => (n.layer === "Clients" ? <span data-testid="slot">{n.name}</span> : null)}
        band={{ value: (n) => (n.layer === "Clients" && n.id !== "u" ? 4 : undefined), note: (l) => `Agent time · not measured per ${l}` }}
      />
    )
    expect(screen.getAllByTestId("slot").map((s) => s.textContent)).toEqual(["Client A", "Client B"])
    expect(container.querySelectorAll('[data-slot="layer-chart-band"]')).toHaveLength(2)
    expect(screen.getAllByText("Agent 4 h")).toHaveLength(2)
    expect(screen.getByText("Agent time · not measured per Packages")).toBeInTheDocument()
    w.mockRestore()
  })

  it("opens the parent from a +n block", () => {
    const w = withWidth(800)
    const many: LayerNode = { id: "r", name: "Root", children: [T("big", 1000), ...Array.from({ length: 5 }, (_, i) => T(`s${i}`, 1))] }
    const onFocusChange = vi.fn()
    render(<LayerChart data={many} defaultFocusId="big" onFocusChange={onFocusChange} />)
    // focus "big" leaves the small ones off canvas; open the root to see them fold
    act(() => {
      fireEvent.keyDown(screen.getByRole("button", { name: "big, 1000" }), { key: "Escape" })
    })
    const more = screen.getByRole("button", { name: "5 more, 5" })
    expect(more).toHaveTextContent("+5")
    fireEvent.click(more)
    expect(onFocusChange).toHaveBeenLastCalledWith("r", expect.objectContaining({ id: "r" }), "more")
    w.mockRestore()
  })
})

describe("SpanStrip", () => {
  const spans = [
    { kind: "attended" as const, start: 9 * 60, end: 9 * 60 + 20 },
    { kind: "call" as const, start: 10 * 60, end: 10 * 60 + 30 },
    { kind: "agent" as const, start: 11 * 60, end: 11 * 60 + 15 },
  ]

  it("cuts spans into 5-minute cells, one lane per kind group", () => {
    const { container } = render(<SpanStrip spans={spans} hue={219} />)
    const lanes = screen.getAllByRole("img")
    expect(lanes.map((l) => l.getAttribute("aria-label"))).toEqual(["You: attended 0.33 h, call 0.5 h", "Agent: agent 0.25 h"])
    expect(lanes[0].querySelectorAll('[data-kind="attended"]')).toHaveLength(4)
    expect(lanes[0].querySelectorAll('[data-kind="call"]')).toHaveLength(6)
    expect(lanes[1]).toHaveAttribute("data-thin")
    expect(container.querySelector<HTMLElement>('[data-slot="span-strip"]')!.style.getPropertyValue("--layer-hue-ink")).toBe("var(--paper-hue-219-ink)")
  })

  it("runs the axis from 8am to 7pm at least, labelled every two hours", () => {
    render(<SpanStrip spans={spans} />)
    expect(screen.getByText("8am")).toBeInTheDocument()
    expect(screen.getByText("12pm")).toBeInTheDocument()
    expect(screen.getByText("6pm")).toBeInTheDocument()
    const cell = document.querySelector<HTMLElement>('[data-kind="attended"]')!
    expect(parseFloat(cell.style.left.replace("calc(", ""))).toBeCloseTo((60 / 660) * 100, 3)
  })

  it("totals each kind in the legend", () => {
    render(<SpanStrip spans={spans} lanes={[{ label: "You", kinds: ["attended", "call"] }]} />)
    expect(screen.getByText("Call 0.5 h")).toBeInTheDocument()
    expect(screen.getAllByRole("img")).toHaveLength(1)
  })
})
