import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { Marquee } from "../marquee"

// ── Single-band shorthand ───────────────────────────────────────────────────

describe("Marquee — single-band shorthand", () => {
  it("renders items in the track", () => {
    render(
      <Marquee
        items={["Acme Corp", "Vercel", "Low Orbit Studio"]}
        durationSec={20}
      />
    )
    // Items are duplicated (first + second set), so we expect multiple occurrences
    const acmeItems = screen.getAllByText("Acme Corp")
    expect(acmeItems.length).toBeGreaterThanOrEqual(2)
  })

  it("renders separator between items", () => {
    render(
      <Marquee
        items={["Alpha", "Beta"]}
        separator="·"
      />
    )
    const separators = screen.getAllByText("·")
    expect(separators.length).toBeGreaterThanOrEqual(2)
  })

  it("renders with data-slot attribute", () => {
    const { container } = render(
      <Marquee items={["Item"]} />
    )
    const root = container.querySelector("[data-slot='marquee']")
    expect(root).not.toBeNull()
  })

  it("renders with custom className", () => {
    const { container } = render(
      <Marquee items={["Item"]} className="custom-marquee" />
    )
    const root = container.querySelector("[data-slot='marquee']")
    expect(root).toHaveClass("custom-marquee")
  })

  it("applies data-direction='left' by default", () => {
    const { container } = render(
      <Marquee items={["Item"]} />
    )
    const band = container.querySelector("[data-slot='marquee-band']")
    expect(band).toHaveAttribute("data-direction", "left")
  })
})

// ── Dual-band counter-flow ──────────────────────────────────────────────────

describe("Marquee — dual-band counter-flow", () => {
  it("renders two bands", () => {
    const { container } = render(
      <Marquee
        bands={[
          { items: ["A", "B", "C"], direction: "left", durationSec: 25, separator: "●" },
          { items: ["D", "E", "F"], direction: "right", durationSec: 30, separator: "○" },
        ]}
      />
    )
    const bands = container.querySelectorAll("[data-slot='marquee-band']")
    expect(bands).toHaveLength(2)
  })

  it("applies correct direction attributes", () => {
    const { container } = render(
      <Marquee
        bands={[
          { items: ["A"], direction: "left" },
          { items: ["B"], direction: "right" },
        ]}
      />
    )
    const bands = container.querySelectorAll("[data-slot='marquee-band']")
    expect(bands[0]).toHaveAttribute("data-direction", "left")
    expect(bands[1]).toHaveAttribute("data-direction", "right")
  })

  it("renders items from both bands", () => {
    render(
      <Marquee
        bands={[
          { items: ["FirstBandItem"], direction: "left" },
          { items: ["SecondBandItem"], direction: "right" },
        ]}
      />
    )
    expect(screen.getAllByText("FirstBandItem").length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText("SecondBandItem").length).toBeGreaterThanOrEqual(2)
  })

  it("renders band-specific separators", () => {
    render(
      <Marquee
        bands={[
          { items: ["X"], direction: "left", separator: "●" },
          { items: ["Y"], direction: "right", separator: "○" },
        ]}
      />
    )
    expect(screen.getAllByText("●").length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText("○").length).toBeGreaterThanOrEqual(2)
  })

  it("bands prop overrides top-level items prop", () => {
    const { container } = render(
      <Marquee
        bands={[{ items: ["BandItem"], direction: "left" }]}
        items={["TopLevelItem"]}
      />
    )
    // TopLevelItem should not appear
    expect(screen.queryByText("TopLevelItem")).toBeNull()
    expect(screen.getAllByText("BandItem").length).toBeGreaterThanOrEqual(2)
  })
})

// ── Pause on hover ──────────────────────────────────────────────────────────

describe("Marquee — pauseOnHover", () => {
  it("applies pauseOnHover class to band when pauseOnHover=true", () => {
    const { container } = render(
      <Marquee items={["Item"]} pauseOnHover={true} />
    )
    const band = container.querySelector("[data-slot='marquee-band']")
    // The band should have a class that enables pause-on-hover
    expect(band?.className).toMatch(/pauseOnHover/)
  })

  it("does not apply pauseOnHover class when pauseOnHover=false", () => {
    const { container } = render(
      <Marquee items={["Item"]} pauseOnHover={false} />
    )
    const band = container.querySelector("[data-slot='marquee-band']")
    expect(band?.className).not.toMatch(/pauseOnHover/)
  })

  it("defaults pauseOnHover to true", () => {
    const { container } = render(
      <Marquee items={["Item"]} />
    )
    const band = container.querySelector("[data-slot='marquee-band']")
    expect(band?.className).toMatch(/pauseOnHover/)
  })
})

// ── Reduced-motion ──────────────────────────────────────────────────────────

describe("Marquee — reduced-motion", () => {
  it("renders without error when items are provided (prefers-reduced-motion handled by CSS)", () => {
    // The component renders correctly regardless — reduced motion is a CSS-only concern.
    const { container } = render(
      <Marquee items={["Item A", "Item B", "Item C"]} />
    )
    expect(container.querySelector("[data-slot='marquee']")).not.toBeNull()
  })

  it("items remain accessible regardless of motion state", () => {
    render(<Marquee items={["Always Visible"]} />)
    // Items are rendered (even if duplicated in the DOM for the animation loop)
    expect(screen.getAllByText("Always Visible").length).toBeGreaterThanOrEqual(1)
  })
})

// ── Custom separator ────────────────────────────────────────────────────────

describe("Marquee — custom separator", () => {
  it("renders string separator", () => {
    render(<Marquee items={["A", "B"]} separator="—" />)
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2)
  })

  it("renders ReactNode separator", () => {
    render(
      <Marquee
        items={["A", "B"]}
        separator={<span data-testid="sep-dot">•</span>}
      />
    )
    const dots = screen.getAllByTestId("sep-dot")
    expect(dots.length).toBeGreaterThanOrEqual(2)
  })

  it("renders no separator when not provided", () => {
    const { container } = render(
      <Marquee items={["A", "B"]} />
    )
    // No separator class elements
    const seps = container.querySelectorAll(".separator")
    expect(seps).toHaveLength(0)
  })
})

// ── Custom renderItem ───────────────────────────────────────────────────────

describe("Marquee — custom renderItem", () => {
  it("uses renderItem to render each item", () => {
    render(
      <Marquee
        items={["foo", "bar"]}
        renderItem={(item, idx) => (
          <span data-testid={`custom-item-${idx}`}>{item}</span>
        )}
      />
    )
    // Both items should be rendered with custom slots (duplicated for loop)
    const foos = screen.getAllByTestId("custom-item-0")
    expect(foos.length).toBeGreaterThanOrEqual(2)
    const bars = screen.getAllByTestId("custom-item-1")
    expect(bars.length).toBeGreaterThanOrEqual(2)
  })
})

// ── Empty states ────────────────────────────────────────────────────────────

describe("Marquee — edge cases", () => {
  it("renders without crashing with empty items array", () => {
    const { container } = render(<Marquee items={[]} />)
    expect(container.querySelector("[data-slot='marquee']")).not.toBeNull()
  })

  it("renders without crashing with empty bands array", () => {
    const { container } = render(<Marquee bands={[]} />)
    expect(container.querySelector("[data-slot='marquee']")).not.toBeNull()
  })

  it("passes through HTML attributes", () => {
    const { container } = render(
      <Marquee items={["Item"]} aria-label="Trusted by logos" />
    )
    const root = container.querySelector("[data-slot='marquee']")
    expect(root).toHaveAttribute("aria-label", "Trusted by logos")
  })
})
