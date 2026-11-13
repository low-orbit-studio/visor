import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import { axe } from "../../../../test-utils/axe"
import { LayerChart, SpanStrip, type LayerNode } from "../layer-chart"

const tree: LayerNode = {
  id: "all",
  name: "All clients",
  children: [
    { id: "a", name: "Client A", hue: 147, layer: "Clients", children: [{ id: "a/p", name: "Website rebuild", value: 8, layer: "Packages" }] },
    { id: "b", name: "Client B", hue: 219, layer: "Clients", kind: "not-billable", value: 4 },
  ],
}

describe("LayerChart a11y", () => {
  it("has no axe violations", async () => {
    const w = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(900)
    const { container } = render(<LayerChart data={tree} band={{ value: (n) => (n.layer === "Clients" ? 2 : undefined) }} />)
    expect(await axe(container)).toHaveNoViolations()
    w.mockRestore()
  })

  it("has no axe violations as a span strip", async () => {
    const { container } = render(
      <SpanStrip spans={[{ kind: "attended", start: 540, end: 600 }, { kind: "agent", start: 600, end: 630 }]} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
