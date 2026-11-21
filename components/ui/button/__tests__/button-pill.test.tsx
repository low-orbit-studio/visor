/**
 * VI-807 — pill hooks, the glass variant and the arrow swap.
 *
 * The markup tests cover ArrowSwap and the glass class. The stylesheet tests
 * read the source (and a Lightning CSS build, the way Next.js compiles it) to
 * pin the two promises jsdom cannot paint: glass blurs only under the glass
 * switch, and an unbound theme gets no grow, press scale or shadow.
 */

import { readFileSync } from "fs"
import { resolve } from "path"
import { transform } from "lightningcss"
import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ArrowSwap, Button } from "../button"
import styles from "../button.module.css"
import { checkA11y } from "../../../../test-utils/a11y"

const css = readFileSync(resolve(__dirname, "..", "button.module.css"), "utf-8")
const squashed = css.replace(/\s+/g, " ")

describe("ArrowSwap", () => {
  it("renders a decorative two-arrow track pointing right by default", () => {
    const { container } = render(<ArrowSwap />)
    const swap = container.querySelector('[data-slot="button-arrow"]')!
    expect(swap).toHaveAttribute("data-direction", "right")
    expect(swap).toHaveAttribute("aria-hidden", "true")
    expect(swap).toHaveClass(styles.arrowSwap)
    expect(swap.querySelectorAll("svg")).toHaveLength(2)
  })

  it("points left on request", () => {
    const { container } = render(<ArrowSwap direction="left" />)
    expect(container.querySelector('[data-slot="button-arrow"]')).toHaveAttribute("data-direction", "left")
  })

  it("sits beside the label without being wrapped in it, and leaves the name alone", () => {
    render(
      <Button size="lg">
        Continue <ArrowSwap />
      </Button>
    )
    const button = screen.getByRole("button", { name: "Continue" })
    const label = button.querySelector('[data-slot="button-text"]')!
    expect(label.textContent).toBe("Continue")
    expect(label.querySelector('[data-slot="button-arrow"]')).toBeNull()
    expect(button.querySelector('[data-slot="button-arrow"]')).not.toBeNull()
  })
})

describe('variant="glass"', () => {
  afterEach(() => vi.restoreAllMocks())

  it("applies the glass class to a round icon button with a name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const { container } = render(
      <Button variant="glass" size="icon" aria-label="Back">
        <ArrowSwap direction="left" />
      </Button>
    )
    const button = screen.getByRole("button", { name: "Back" })
    expect(button).toHaveClass(styles.variantGlass, styles.sizeIcon)
    expect(warn).not.toHaveBeenCalled()
    await checkA11y(container)
  })
})

describe("stylesheet", () => {
  it("draws a backdrop-filter only from the glass switch's control blur or the outline's own hook (unbound: none)", () => {
    const filters = [...squashed.matchAll(/backdrop-filter:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(filters.length).toBeGreaterThan(0)
    for (const value of filters) {
      expect(["var(--glass-on-control-blur, none)", "var(--button-outline-backdrop-filter, none)"]).toContain(value)
    }
  })

  it("reads the glass layer's shared control values with a solid ringed control as fallback", () => {
    expect(squashed).toContain("background-color: var(--glass-on-control-fill, var(--surface-subtle, #f3f4f6))")
    expect(squashed).toContain("background-color: var(--glass-on-control-hover-fill, var(--surface-muted, #f3f4f6))")
    expect(squashed).toContain("color: var(--glass-on-control-ink, var(--text-primary, #111827))")
    expect(squashed).toContain("var(--glass-on-control-ring, var(--border-default, #e5e7eb))")
  })

  it("gives the outline face the glass control's wash under the glass switch (VI-829)", () => {
    const rule = (selector: string) => squashed.slice(squashed.indexOf(`${selector} {`)).split("}")[0]
    const face = rule(':global([data-glass="on"]) .variantOutline')
    expect(face).toContain("background-color: var(--glass-on-control-fill,")
    expect(face).toContain("color: var(--glass-on-control-ink,")
    expect(rule(':global([data-glass="on"]) .variantOutline::after')).toContain("outline-color: var(--glass-on-control-ring,")
    expect(rule(':global([data-glass="on"]) .variantOutline:hover')).toContain("var(--glass-on-control-hover-fill,")
  })

  it("keeps grow, press scale and shadow unset unless a theme binds them", () => {
    const layer = squashed.slice(squashed.indexOf("@layer visor-base { .variantDefault"))
    expect(layer).toContain("box-shadow: var(--button-default-shadow, revert-layer)")
    expect(layer).toContain("scale: var(--button-hover-scale, revert-layer)")
    expect(layer).toContain("scale: var(--button-press-scale, revert-layer)")
    // A busy or gated button holds still.
    expect(layer).toContain('.base:hover:not(:disabled, [aria-busy="true"], [aria-disabled="true"])')
  })

  describe("after a Lightning CSS build", () => {
    const built = transform({
      filename: "button.module.css",
      code: Buffer.from(css),
      minify: true,
      cssModules: true,
      targets: { chrome: 111 << 16, edge: 111 << 16, firefox: 111 << 16, safari: (16 << 16) | (4 << 8) },
    }).code.toString()

    it("keeps both glass backdrop-filter lines (VI-788)", () => {
      expect(built).toContain(";backdrop-filter:var(--glass-on-control-blur,none)")
      expect(built).toContain("-webkit-backdrop-filter:var(--glass-on-control-blur,none)")
    })

    it("keeps the scale hooks", () => {
      expect(built).toContain("scale:var(--button-hover-scale,revert-layer)")
      expect(built).toContain("scale:var(--button-press-scale,revert-layer)")
    })
  })
})
