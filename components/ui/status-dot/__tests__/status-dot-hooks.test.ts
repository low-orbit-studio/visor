import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, it, expect } from "vitest"

// VI-801: a theme sizes the dot; a caller colours one outside the five tones.
const css = readFileSync(join(process.cwd(), "components/ui/status-dot/status-dot.module.css"), "utf-8")

describe("StatusDot hooks", () => {
  it("reads its size from --status-dot-size, 6px unset", () => {
    expect(css).toContain("width: var(--status-dot-size, 6px);")
    expect(css).toContain("height: var(--status-dot-size, 6px);")
  })

  it("lets --status-dot-color override every tone, each tone token unset", () => {
    for (const tone of [
      "var(--surface-success-default, #22c55e)",
      "var(--surface-warning-default, #f59e0b)",
      "var(--text-tertiary, #6b7280)",
      "var(--surface-error-default, #ef4444)",
      "var(--surface-info-default, #0ea5e9)",
    ]) {
      expect(css).toContain(`background-color: var(--status-dot-color, ${tone});`)
    }
  })
})

describe("StatusDot shape", () => {
  it("stays round under a squircle theme", () => {
    expect(css.match(/\.dot \{[^}]*\}/)![0]).toContain("--corner-shape: round;")
  })
})
