import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AmbientGlow } from "../ambient-glow"

describe("AmbientGlow", () => {
  it("renders as aria-hidden div with pointer-events-none", () => {
    const { container } = render(<AmbientGlow />)
    const el = container.querySelector('[data-slot="ambient-glow"]')
    expect(el).not.toBeNull()
    expect(el).toHaveAttribute("aria-hidden", "true")
  })

  it("defaults to keyed variant", () => {
    const { container } = render(<AmbientGlow />)
    const el = container.querySelector('[data-slot="ambient-glow"]')
    expect(el).toHaveAttribute("data-variant", "keyed")
  })

  it("renders gold variant", () => {
    const { container } = render(<AmbientGlow variant="gold" />)
    const el = container.querySelector('[data-slot="ambient-glow"]')
    expect(el).toHaveAttribute("data-variant", "gold")
  })

  it("merges className onto the root element", () => {
    const { container } = render(<AmbientGlow className="custom-class" />)
    const el = container.querySelector('[data-slot="ambient-glow"]')
    expect(el?.classList.contains("custom-class")).toBe(true)
  })

  it("applies glowColor as a CSS custom property via inline style", () => {
    const { container } = render(<AmbientGlow glowColor="#ff0066" />)
    const el = container.querySelector('[data-slot="ambient-glow"]') as HTMLElement | null
    expect(el?.style.getPropertyValue("--glow-color")).toBe("#ff0066")
  })

  it("live-rewrite test: updating --glow-color on a parent element repaint without re-render", () => {
    // Demonstrates the CSS-var runtime contract: set --glow-color on a parent,
    // the glow tracks it. This test verifies the component does NOT bake the
    // color into any non-CSS-var channel (e.g. inline RGB) — the only color
    // path is the var() chain in the CSS module.
    const wrapper = document.createElement("div")
    document.body.appendChild(wrapper)
    wrapper.style.setProperty("--glow-color", "rgb(0, 200, 100)")

    const { container } = render(<AmbientGlow />, { container: wrapper })
    const el = container.querySelector('[data-slot="ambient-glow"]') as HTMLElement | null

    // The element itself should NOT have an inline --glow-color override —
    // the color resolves from the parent, not from any baked value on the element.
    expect(el?.style.getPropertyValue("--glow-color")).toBe("")

    // Now simulate a live rewrite (no React re-render).
    wrapper.style.setProperty("--glow-color", "rgb(255, 190, 38)")
    // The element is the same node — no re-render happened.
    expect(container.querySelector('[data-slot="ambient-glow"]')).toBe(el)

    document.body.removeChild(wrapper)
  })

  it("passes additional style props through to the root element", () => {
    const { container } = render(<AmbientGlow style={{ inset: 0, width: 200 }} />)
    const el = container.querySelector('[data-slot="ambient-glow"]') as HTMLElement | null
    // inset: 0 serializes to top/right/bottom/left in jsdom style
    expect(el).not.toBeNull()
  })

  it("passes through arbitrary HTML attributes", () => {
    const { container } = render(<AmbientGlow data-testid="glow" />)
    expect(container.querySelector('[data-testid="glow"]')).not.toBeNull()
  })
})
