import * as React from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import { OptionCards, type OptionCardsOption } from "../option-cards"
import { checkA11y } from "../../../../test-utils/a11y"

const OPTIONS: OptionCardsOption[] = [
  { label: "Vercel", detail: "As today.", pros: ["No setup"], cons: ["Per-seat cost"], recommended: true },
  { label: "Self-host", detail: "Our own box.", pros: ["No bill"], cons: ["We run upgrades"], recommended: true },
  { label: "Static export", detail: "Plain files.", pros: ["Cheapest"], cons: ["No previews"] },
]

function renderCards(props?: Partial<React.ComponentProps<typeof OptionCards>>) {
  return render(<OptionCards aria-label="Hosting" options={OPTIONS} {...props} />)
}

const css = readFileSync(
  join(process.cwd(), "components/ui/option-cards/option-cards.module.css"),
  "utf8",
)

describe("OptionCards", () => {
  it("renders a labelled radiogroup with one radio per option", () => {
    renderCards()
    expect(screen.getByRole("radiogroup", { name: "Hosting" })).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(3)
  })

  it("draws a letter tile, label, detail, and pros and cons on each card", () => {
    const { container } = renderCards()
    const first = screen.getByRole("radio", { name: "Vercel" })
    expect(first).toHaveTextContent("A")
    expect(first).toHaveTextContent("As today.")
    expect(first).toHaveTextContent("Pro: No setup")
    expect(first).toHaveTextContent("Con: Per-seat cost")
    expect(first.querySelector('[data-kind="pro"] svg')).not.toBeNull()
    expect(first.querySelector('[data-kind="con"] svg')).not.toBeNull()
    expect(container.querySelectorAll("button ul, button li")).toHaveLength(0)
  })

  it("marks at most one card Recommended, the first that asks", () => {
    const { container } = renderCards()
    const marks = container.querySelectorAll('[data-slot="option-cards-recommended"]')
    expect(marks).toHaveLength(1)
    expect(screen.getByRole("radio", { name: "Vercel" })).toContainElement(marks[0] as HTMLElement)
  })

  it("selects on click and reports the index", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderCards({ onValueChange })
    await user.click(screen.getByRole("radio", { name: "Self-host" }))
    expect(onValueChange).toHaveBeenCalledWith(1)
    expect(screen.getByRole("radio", { name: "Self-host" })).toHaveAttribute("aria-checked", "true")
  })

  it("arrows move the selection and focus, wrapping", async () => {
    const user = userEvent.setup()
    renderCards({ defaultValue: 0 })
    await user.tab()
    expect(screen.getByRole("radio", { name: "Vercel" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Self-host" })).toHaveFocus()
    expect(screen.getByRole("radio", { name: "Self-host" })).toBeChecked()
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(screen.getByRole("radio", { name: "Static export" })).toBeChecked()
  })

  it("A/B/C keys pick directly while focus is in the group", async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    renderCards({ onValueChange })
    await user.tab()
    await user.keyboard("c")
    expect(screen.getByRole("radio", { name: "Static export" })).toBeChecked()
    expect(screen.getByRole("radio", { name: "Static export" })).toHaveFocus()
    await user.keyboard("B")
    expect(onValueChange).toHaveBeenLastCalledWith(1)
    await user.keyboard("d")
    expect(onValueChange).toHaveBeenCalledTimes(2)
  })

  it("keeps one tab stop (roving tabindex)", () => {
    renderCards({ defaultValue: 2 })
    const tabStops = screen.getAllByRole("radio").map((r) => r.getAttribute("tabindex"))
    expect(tabStops).toEqual(["-1", "-1", "0"])
  })

  it("respects a controlled value", async () => {
    const user = userEvent.setup()
    renderCards({ value: 0, onValueChange: () => {} })
    await user.click(screen.getByRole("radio", { name: "Self-host" }))
    expect(screen.getByRole("radio", { name: "Vercel" })).toBeChecked()
  })

  it("draws one selection ring only when something is picked", async () => {
    const user = userEvent.setup()
    const { container } = renderCards()
    expect(container.querySelector('[data-slot="option-cards-ring"]')).toBeNull()
    await user.click(screen.getByRole("radio", { name: "Vercel" }))
    expect(container.querySelectorAll('[data-slot="option-cards-ring"]')).toHaveLength(1)
  })

  it("slides the ring on a transition that reduced motion switches off", () => {
    expect(css).toMatch(/\.ring\[data-placed\]\s*{\s*transition:\s*transform/)
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
    expect(reduced).toMatch(/\.ring\[data-placed\][\s\S]*?transition: none/)
  })

  it("stacks the cards under 900px", () => {
    expect(css).toMatch(
      /@container option-cards \(max-width: 899\.98px\)\s*{\s*\.grid\s*{\s*grid-template-columns: minmax\(0, 1fr\)/,
    )
  })

  it("takes every colour from a theme token", () => {
    const decls = css.replace(/\/\*[\s\S]*?\*\//g, "").match(/(?:color|background|box-shadow|border-top|outline):[^;]+;/g) ?? []
    for (const decl of decls) {
      // A literal colour may only appear as a var() fallback.
      const bare = decl.replace(/var\(--[a-z0-9-]+,\s*#[0-9a-f]{3,8}\)/gi, "")
      expect(bare, decl).not.toMatch(/#[0-9a-f]{3,8}|rgba?\(/i)
    }
  })

  it("has no axe violations", async () => {
    const { container } = renderCards({ defaultValue: 0 })
    await checkA11y(container)
  })
})
