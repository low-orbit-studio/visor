import { describe, expect, it } from "vitest"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { parseHandoff } from "../commands/sandbox/parse-handoff.js"

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "sandbox-handoff.md")

describe("parseHandoff", () => {
  it("extracts the pattern slug from the H1", () => {
    const m = parseHandoff(FIXTURE)
    expect(m.pattern).toBe("test-pattern")
  })

  it("extracts the theme meta field", () => {
    const m = parseHandoff(FIXTURE)
    expect(m.theme).toBe("space")
  })

  it("resolves the recipe link relative to the handoff", () => {
    const m = parseHandoff(FIXTURE)
    expect(m.recipePath).toMatch(/test-recipe\.md$/)
  })

  it("classifies primitives by status", () => {
    const m = parseHandoff(FIXTURE)
    const byName = Object.fromEntries(m.primitives.map((p) => [p.name, p]))
    expect(byName.button.status).toBe("shipped")
    expect(byName["widget-stack"].status).toBe("gap-new")
    expect(byName["status-pill"].status).toBe("gap-new")
    expect(byName["status-pill"].viTicket).toBe("VI-999")
    expect(byName.badge.status).toBe("gap-inflight")
  })

  it("extracts screens from the recipe when present", () => {
    const m = parseHandoff(FIXTURE)
    expect(m.screens.map((s) => s.name)).toEqual(["list-view", "detail-view"])
    expect(m.screens[0].route).toBe("/test/list")
  })

  it("extracts mock field shapes from the recipe", () => {
    const m = parseHandoff(FIXTURE)
    const fields = m.mockShapes.map((f) => f.field)
    expect(fields).toContain("items")
    expect(fields).toContain("currentUser")
    expect(fields).toContain("pageTitle")
  })
})
