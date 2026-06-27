import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { HeroGlow } from "../hero-glow"

// Read the CSS module source from the repo root (vitest's cwd) — jsdom cannot
// compute @media rules, so the reduced-motion assertion checks the source directly.
const cssSource = readFileSync(
  join(process.cwd(), "components/visual/hero-glow/hero-glow.module.css"),
  "utf8"
)

// ── Rendering ───────────────────────────────────────────────────────────────

describe("HeroGlow — rendering", () => {
  it("renders a div with data-slot='hero-glow'", () => {
    const { container } = render(<HeroGlow />)
    const el = container.querySelector("[data-slot='hero-glow']")
    expect(el).not.toBeNull()
  })

  it("is aria-hidden", () => {
    const { container } = render(<HeroGlow />)
    const el = container.querySelector("[data-slot='hero-glow']")
    expect(el).toHaveAttribute("aria-hidden", "true")
  })

  it("accepts a custom className", () => {
    const { container } = render(<HeroGlow className="my-glow" />)
    const el = container.querySelector("[data-slot='hero-glow']")
    expect(el).toHaveClass("my-glow")
  })

  it("forwards HTML attributes", () => {
    const { container } = render(<HeroGlow data-testid="glow" />)
    const el = container.querySelector("[data-testid='glow']")
    expect(el).not.toBeNull()
  })
})

// ── Live color contract ─────────────────────────────────────────────────────

describe("HeroGlow — live color contract", () => {
  it("sets --glow-color CSS custom property when glowColor is provided", () => {
    const { container } = render(<HeroGlow glowColor="oklch(70% 0.3 145)" />)
    const el = container.querySelector("[data-slot='hero-glow']") as HTMLElement
    expect(el.style.getPropertyValue("--glow-color")).toBe("oklch(70% 0.3 145)")
  })

  it("does not set --glow-color when glowColor is omitted", () => {
    const { container } = render(<HeroGlow />)
    const el = container.querySelector("[data-slot='hero-glow']") as HTMLElement
    expect(el.style.getPropertyValue("--glow-color")).toBe("")
  })

  it("merges glowColor with user-supplied style", () => {
    const { container } = render(
      <HeroGlow glowColor="#ff0080" style={{ zIndex: 5 }} />
    )
    const el = container.querySelector("[data-slot='hero-glow']") as HTMLElement
    expect(el.style.getPropertyValue("--glow-color")).toBe("#ff0080")
    expect(el.style.zIndex).toBe("5")
  })
})

// ── Reduced motion ──────────────────────────────────────────────────────────

describe("HeroGlow — reduced motion", () => {
  it("renders without error (reduced-motion is a CSS-only concern)", () => {
    // The component renders correctly regardless of motion preference.
    // The animation: none rule is in .module.css @media prefers-reduced-motion.
    const { container } = render(<HeroGlow glowColor="red" />)
    expect(container.querySelector("[data-slot='hero-glow']")).not.toBeNull()
  })

  it("rests at full opacity under prefers-reduced-motion (faithful to BL-326, VI-581)", () => {
    // jsdom cannot compute @media rules, so assert against the CSS source: the
    // reduced-motion block must rest at opacity 1 — the bl-hero-glow origin set no
    // base opacity, so its computed rest was 1. Guard against re-normalizing to the
    // keyframe's 0.75 rest value, which dims reduced-motion users ~25%.
    const block = cssSource.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\}\s*\}/
    )?.[0]
    expect(block).toBeDefined()
    const opacity = block!.match(/opacity:\s*([\d.]+)/)?.[1]
    expect(opacity).toBe("1")
  })
})
