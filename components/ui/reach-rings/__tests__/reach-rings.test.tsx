import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { ReachRings } from "../reach-rings"

const lit = (root: Element) => Array.from(root.querySelectorAll('[data-state="on"]'))
const rings = (root: Element) => Array.from(root.querySelectorAll("[data-slot^=reach-rings-]:not([data-slot=reach-rings-icon])"))

describe("ReachRings", () => {
  it("should_draw_levels_rings_with_the_core_last_when_rendered", () => {
    const { container } = render(<ReachRings levels={4} value={0} />)
    const all = rings(container)
    expect(all).toHaveLength(4)
    expect(all[3].getAttribute("data-slot")).toBe("reach-rings-core")
  })

  it.each([
    [-1, 0],
    [0, 1],
    [1, 2],
    [3, 4],
    [9, 4],
  ])("should_light_value_plus_one_rings_from_the_centre_when_value_is_%i", (value, count) => {
    const { container } = render(<ReachRings levels={4} value={value} />)
    const on = lit(container)
    expect(on).toHaveLength(count)
    // The lit ones are the innermost: the last `count` in paint order.
    expect(on).toEqual(rings(container).slice(4 - count))
  })

  it("should_be_hidden_from_assistive_tech_when_rendered", () => {
    const { container } = render(<ReachRings levels={4} value={2} icon={<svg data-testid="i" />} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute("aria-hidden", "true")
    expect(root.querySelector("[data-slot=reach-rings-icon] svg")).not.toBeNull()
  })

  it("should_set_size_and_pass_props_through_when_given", () => {
    const { container } = render(<ReachRings levels={4} value={1} size="compact" className="x" data-testid="r" />)
    const root = container.firstElementChild as HTMLElement
    expect(root.dataset.size).toBe("compact")
    expect(root.dataset.testid).toBe("r")
    expect(root.className).toMatch(/\bx\b/)
  })

  it("should_turn_transitions_off_when_reduced_motion_is_preferred", () => {
    const css = readFileSync(join(process.cwd(), "components/ui/reach-rings/reach-rings.module.css"), "utf-8")
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*{\s*\.ring\s*{\s*transition: none;/)
  })
})
