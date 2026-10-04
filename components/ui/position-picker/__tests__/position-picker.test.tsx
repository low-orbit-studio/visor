import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { PositionPicker, type PositionValue } from "../position-picker"
import { checkA11y } from "../../../../test-utils/a11y"

const css = readFileSync(join(__dirname, "../position-picker.module.css"), "utf8")

const NAMES = [
  "Top left", "Top center", "Top right",
  "Center left", "Center", "Center right",
  "Bottom left", "Bottom center", "Bottom right",
]

function setup(props?: Partial<React.ComponentProps<typeof PositionPicker>>) {
  return render(<PositionPicker aria-label="Focal point" {...props} />)
}

describe("PositionPicker", () => {
  describe("structure", () => {
    it("renders a radiogroup of nine named radios in row order", () => {
      setup()
      expect(screen.getByRole("radiogroup", { name: "Focal point" })).toBeInTheDocument()
      expect(screen.getAllByRole("radio").map((r) => r.getAttribute("aria-label"))).toEqual(NAMES)
    })

    it("exposes the checked state to assistive tech", () => {
      setup({ defaultValue: { y: "bottom", x: "right" } })
      expect(screen.getByRole("radio", { name: "Bottom right" })).toBeChecked()
      expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1)
    })

    it("has nothing checked without a value", () => {
      setup()
      expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0)
    })

    it("forwards className and ref", () => {
      const ref = React.createRef<HTMLDivElement>()
      setup({ className: "extra", ref })
      expect(ref.current).toHaveClass("extra")
    })

    it("marks the variant", () => {
      const { container } = setup({ variant: "on-image" })
      expect(container.querySelector('[data-slot="position-picker"]')).toHaveAttribute("data-variant", "on-image")
    })

    it("draws a custom glyph from renderTarget without changing the name", () => {
      setup({ renderTarget: (p) => <svg data-testid={`glyph-${p.y}-${p.x}`} /> })
      expect(screen.getByTestId("glyph-top-left")).toBeInTheDocument()
      expect(screen.getByRole("radio", { name: "Top left" })).toBeInTheDocument()
    })
  })

  describe("value shape and selection", () => {
    it("reports a { y, x } pair for each of the nine targets", async () => {
      const onValueChange = vi.fn()
      setup({ onValueChange })
      const user = userEvent.setup()
      const seen: PositionValue[] = []
      for (const name of NAMES) {
        await user.click(screen.getByRole("radio", { name }))
        seen.push(onValueChange.mock.lastCall![0])
      }
      expect(seen).toEqual([
        { y: "top", x: "left" }, { y: "top", x: "center" }, { y: "top", x: "right" },
        { y: "center", x: "left" }, { y: "center", x: "center" }, { y: "center", x: "right" },
        { y: "bottom", x: "left" }, { y: "bottom", x: "center" }, { y: "bottom", x: "right" },
      ])
      for (const v of seen) expect(Object.keys(v).sort()).toEqual(["x", "y"])
    })

    it("is single choice", async () => {
      setup()
      const user = userEvent.setup()
      await user.click(screen.getByRole("radio", { name: "Top left" }))
      await user.click(screen.getByRole("radio", { name: "Bottom right" }))
      expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(1)
      expect(screen.getByRole("radio", { name: "Bottom right" })).toBeChecked()
    })

    it("uncontrolled: starts from defaultValue and updates itself", async () => {
      setup({ defaultValue: { y: "center", x: "center" } })
      expect(screen.getByRole("radio", { name: "Center" })).toBeChecked()
      await userEvent.setup().click(screen.getByRole("radio", { name: "Top right" }))
      expect(screen.getByRole("radio", { name: "Top right" })).toBeChecked()
    })

    it("controlled: follows value and does not change on its own", async () => {
      const onValueChange = vi.fn()
      const { rerender } = setup({ value: { y: "top", x: "left" }, onValueChange })
      await userEvent.setup().click(screen.getByRole("radio", { name: "Bottom center" }))
      expect(onValueChange).toHaveBeenCalledWith({ y: "bottom", x: "center" })
      expect(screen.getByRole("radio", { name: "Top left" })).toBeChecked()
      rerender(<PositionPicker aria-label="Focal point" value={{ y: "bottom", x: "center" }} onValueChange={onValueChange} />)
      expect(screen.getByRole("radio", { name: "Bottom center" })).toBeChecked()
    })

    it("controlled null clears the choice", () => {
      setup({ value: null })
      expect(screen.queryAllByRole("radio", { checked: true })).toHaveLength(0)
    })

    it("disabled blocks selection", async () => {
      const onValueChange = vi.fn()
      setup({ disabled: true, onValueChange })
      await userEvent.setup().click(screen.getByRole("radio", { name: "Top left" }))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(screen.getAllByRole("radio").every((r) => (r as HTMLButtonElement).disabled)).toBe(true)
    })
  })

  describe("keyboard", () => {
    const start = { y: "center", x: "center" } as const

    async function press(key: string, defaultValue: PositionValue = start) {
      const onValueChange = vi.fn()
      setup({ defaultValue, onValueChange })
      const user = userEvent.setup()
      await user.tab()
      await user.keyboard(key)
      return { onValueChange, focused: document.activeElement as HTMLElement }
    }

    it("has one tab stop: the chosen target", async () => {
      setup({ defaultValue: { y: "bottom", x: "left" } })
      const stops = screen.getAllByRole("radio").filter((r) => r.tabIndex === 0)
      expect(stops.map((r) => r.getAttribute("aria-label"))).toEqual(["Bottom left"])
      await userEvent.setup().tab()
      expect(screen.getByRole("radio", { name: "Bottom left" })).toHaveFocus()
    })

    it("falls back to the first target as the tab stop when nothing is chosen", async () => {
      setup()
      await userEvent.setup().tab()
      expect(screen.getByRole("radio", { name: "Top left" })).toHaveFocus()
    })

    it.each([
      ["{ArrowLeft}", "Center left", { y: "center", x: "left" }],
      ["{ArrowRight}", "Center right", { y: "center", x: "right" }],
      ["{ArrowUp}", "Top center", { y: "top", x: "center" }],
      ["{ArrowDown}", "Bottom center", { y: "bottom", x: "center" }],
    ])("%s moves along its axis, focusing and choosing the target", async (key, name, value) => {
      const { onValueChange, focused } = await press(key)
      expect(focused).toHaveAccessibleName(name)
      expect(onValueChange).toHaveBeenCalledWith(value)
      expect(screen.getByRole("radio", { name })).toBeChecked()
    })

    it("moves in both axes from one target to the next", async () => {
      const onValueChange = vi.fn()
      setup({ defaultValue: { y: "top", x: "left" }, onValueChange })
      const user = userEvent.setup()
      await user.tab()
      await user.keyboard("{ArrowRight}{ArrowDown}{ArrowDown}")
      expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([
        { y: "top", x: "center" }, { y: "center", x: "center" }, { y: "bottom", x: "center" },
      ])
    })

    it("wraps at the edges of each axis", async () => {
      expect((await press("{ArrowLeft}", { y: "top", x: "left" })).focused).toHaveAccessibleName("Top right")
    })

    it("wraps vertically", async () => {
      expect((await press("{ArrowUp}", { y: "top", x: "left" })).focused).toHaveAccessibleName("Bottom left")
    })

    it("Home and End go to the first and last target", async () => {
      expect((await press("{Home}")).focused).toHaveAccessibleName("Top left")
    })

    it("End goes to the last target", async () => {
      expect((await press("{End}")).focused).toHaveAccessibleName("Bottom right")
    })

    it("Space chooses the focused target", async () => {
      const onValueChange = vi.fn()
      setup({ onValueChange })
      const user = userEvent.setup()
      await user.tab()
      await user.keyboard(" ")
      expect(onValueChange).toHaveBeenCalledWith({ y: "top", x: "left" })
    })

    it("ignores other keys", async () => {
      const { onValueChange } = await press("a")
      expect(onValueChange).not.toHaveBeenCalled()
    })
  })

  describe("target size (2.5.8) and edges", () => {
    it("every target's hit area is at least 24px, tokenised", () => {
      // The drawn dot is smaller than the hit area; the target is what is clicked.
      expect(css).toMatch(/--_target:\s*var\(--position-picker-target-size,\s*var\(--spacing-6,\s*1\.5rem\)\)/)
      expect(css).toMatch(/\.target\s*\{[^}]*min-width:\s*var\(--_target\)/)
      expect(css).toMatch(/\.target\s*\{[^}]*min-height:\s*var\(--_target\)/)
      expect(css).toMatch(/\.mark\s*\{[^}]*width:\s*var\(--spacing-3/)
    })

    it("the grid grows to three targets a side instead of shrinking them", () => {
      expect(css).toMatch(/min-width:\s*calc\(3 \* var\(--_target\)\)/)
      expect(css).toMatch(/min-height:\s*calc\(3 \* var\(--_target\)\)/)
      expect(css).toMatch(/grid-template-columns:\s*repeat\(3,\s*minmax\(var\(--_target\),\s*1fr\)\)/)
    })

    it("the standalone default is never below the 24px floor", () => {
      expect(css).toMatch(/\.root:not\(\.onImage\)\s*\{\s*--_target:\s*var\(--position-picker-target-size,\s*var\(--spacing-8,\s*2rem\)\)/)
    })

    it("draws no border; the resting edge reads the shared edge tokens", () => {
      expect(css).not.toMatch(/\bborder:\s*[^;]*(solid|dashed)/)
      expect(css).toContain("var(--control-edge-width, 1px)")
      expect(css).toContain("var(--control-edge-color")
    })

    it("on-image gives each target a scrim ring and puts no filter on the photo", () => {
      expect(css).toMatch(/\.onImage \.mark\s*\{[^}]*var\(--_scrim/)
      expect(css).not.toMatch(/(?<!-)\b(backdrop-)?filter:/)
    })

    it("focus survives the edge switch", () => {
      expect(css).toMatch(/\.target:focus-visible\s*\{[^}]*var\(--focus-ring-width/)
    })
  })

  describe("a11y", () => {
    it("has no axe violations", async () => {
      const { container } = setup({ defaultValue: { y: "top", x: "center" } })
      await checkA11y(container)
    })

    it("has no axe violations on image", async () => {
      const { container } = setup({ variant: "on-image", defaultValue: { y: "center", x: "left" } })
      await checkA11y(container)
    })
  })
})
