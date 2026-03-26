import { describe, it, expect } from "vitest"
import { getSections, getFooterColumns } from "../deck-registry"
import type { DeckRegistry } from "../deck-registry"

const Noop = () => null

const testRegistry: DeckRegistry = {
  description: "Test deck",
  slides: [
    { id: "s-intro", title: "Intro", section: "_title", component: Noop },
    { id: "s-colors", title: "Colors", section: "Tokens", component: Noop },
    { id: "s-spacing", title: "Spacing", section: "Tokens", component: Noop },
    { id: "s-buttons", title: "Buttons", section: "Components", component: Noop },
    { id: "s-closing", title: "Close", section: "_closing", component: Noop },
  ],
}

describe("getSections", () => {
  it("groups slides by section", () => {
    const sections = getSections(testRegistry)
    expect(sections).toHaveLength(2)
    expect(sections[0].section).toBe("Tokens")
    expect(sections[0].slides).toHaveLength(2)
    expect(sections[1].section).toBe("Components")
    expect(sections[1].slides).toHaveLength(1)
  })

  it("excludes sections prefixed with _", () => {
    const sections = getSections(testRegistry)
    const names = sections.map((s) => s.section)
    expect(names).not.toContain("_title")
    expect(names).not.toContain("_closing")
  })

  it("returns empty array when all sections are excluded", () => {
    const reg: DeckRegistry = {
      description: "Hidden",
      slides: [
        { id: "s-a", title: "A", section: "_hidden", component: Noop },
      ],
    }
    expect(getSections(reg)).toHaveLength(0)
  })
})

describe("getFooterColumns", () => {
  it("creates columns from visible sections", () => {
    const columns = getFooterColumns(testRegistry)
    expect(columns).toHaveLength(2)
    expect(columns[0].title).toBe("Tokens")
    expect(columns[0].links).toHaveLength(2)
    expect(columns[1].title).toBe("Components")
    expect(columns[1].links).toHaveLength(1)
  })

  it("appends footerExtras to the last column", () => {
    const reg: DeckRegistry = {
      ...testRegistry,
      footerExtras: [
        { label: "GitHub", href: "https://github.com" },
      ],
    }
    const columns = getFooterColumns(reg)
    const last = columns[columns.length - 1]
    expect(last.links[last.links.length - 1].label).toBe("GitHub")
  })

  it("returns empty columns when no visible sections", () => {
    const reg: DeckRegistry = {
      description: "Hidden",
      slides: [
        { id: "s-a", title: "A", section: "_hidden", component: Noop },
      ],
    }
    expect(getFooterColumns(reg)).toHaveLength(0)
  })
})
