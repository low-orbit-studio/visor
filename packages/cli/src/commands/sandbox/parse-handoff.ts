import { readFileSync, existsSync } from "fs"
import { dirname, resolve, isAbsolute } from "path"

export type PrimitiveStatus = "shipped" | "gap-new" | "gap-inflight"

export interface PrimitiveEntry {
  name: string
  status: PrimitiveStatus
  viTicket?: string
  kind?: string
}

export type ScreenKind = "named" | "state-coverage"

export interface ScreenEntry {
  name: string
  title: string
  route?: string
  /**
   * `named` for screens declared in the recipe (the default).
   * `state-coverage` for screens auto-discovered from a Phase 1.5 HTML
   * prototype beyond the recipe's named-screen count (e.g. menus, feedback,
   * edge-state screens). Sandbox baselines for these power the Phase 4
   * state-coverage diff gate.
   */
  kind?: ScreenKind
}

export interface MockField {
  field: string
  type: string
  description?: string
}

export interface HandoffManifest {
  pattern: string
  theme?: string
  recipePath?: string
  primitives: PrimitiveEntry[]
  screens: ScreenEntry[]
  mockShapes: MockField[]
  warnings: string[]
}

/**
 * Parse a Low Orbit `design-handoff.md` manifest into a structured object.
 * Tolerant — pulls signal from H1, "Theme:" meta line, "Recipe" link, and
 * any "Component" table. Anything it cannot classify is surfaced as a warning.
 */
export function parseHandoff(handoffPath: string): HandoffManifest {
  const text = readFileSync(handoffPath, "utf-8")
  const lines = text.split("\n")
  const warnings: string[] = []

  const pattern = extractPatternSlug(lines, warnings)
  const theme = extractMetaField(lines, "Theme")
  const recipePath = extractRecipePath(text, handoffPath, warnings)
  const primitives = extractPrimitives(text, warnings)
  const { screens, mockShapes } = recipePath && existsSync(recipePath)
    ? extractRecipeArtifacts(recipePath, warnings)
    : { screens: [], mockShapes: [] as MockField[] }

  return { pattern, theme, recipePath, primitives, screens, mockShapes, warnings }
}

function extractPatternSlug(lines: string[], warnings: string[]): string {
  const h1 = lines.find((l) => /^#\s/.test(l))
  if (!h1) {
    warnings.push("Handoff has no H1 — pattern slug fell back to 'sandbox'")
    return "sandbox"
  }
  const m = h1.match(/^#\s+(?:Design\s+handoff\s+[—-]\s+)?(.+?)\s*$/i)
  if (!m) {
    warnings.push(`Could not parse pattern from H1: ${h1}`)
    return "sandbox"
  }
  return m[1].trim().toLowerCase().replace(/\s+/g, "-")
}

function extractMetaField(lines: string[], field: string): string | undefined {
  const re = new RegExp(`^\\*\\*${field}:\\*\\*\\s+([^\\s(*]+)`, "i")
  for (const l of lines) {
    const m = l.match(re)
    if (m) return m[1].trim()
  }
  return undefined
}

function extractRecipePath(
  text: string,
  handoffPath: string,
  warnings: string[]
): string | undefined {
  const m = text.match(/##\s+Recipe[\s\S]*?\[`?([^\]`]+)`?\]\(([^)]+)\)/i)
  if (!m) {
    warnings.push("Could not locate Recipe link in handoff")
    return undefined
  }
  const href = m[2].trim()
  if (isAbsolute(href)) return href
  return resolve(dirname(handoffPath), href)
}

const STATUS_PATTERNS: Array<{ re: RegExp; status: PrimitiveStatus }> = [
  { re: /NEW\s+gap/i, status: "gap-new" },
  { re: /blocked-by/i, status: "gap-new" },
  { re: /in\s+flight/i, status: "gap-inflight" },
  { re: /shipped/i, status: "shipped" },
]

function classifyStatus(cell: string): PrimitiveStatus {
  for (const { re, status } of STATUS_PATTERNS) {
    if (re.test(cell)) return status
  }
  return "shipped"
}

function extractVITicket(cell: string): string | undefined {
  const m = cell.match(/VI-(\d+)/i)
  return m ? `VI-${m[1]}` : undefined
}

function extractPrimitives(text: string, warnings: string[]): PrimitiveEntry[] {
  const primitives: PrimitiveEntry[] = []
  const seen = new Set<string>()

  const tableMatches = text.matchAll(/\|\s*Component\s*\|[^\n]*\n\|[^\n]*\n((?:\|[^\n]*\n?)+)/gi)
  for (const tm of tableMatches) {
    const rows = tm[1]
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.startsWith("|"))
    for (const row of rows) {
      const cells = row
        .split("|")
        .map((c) => c.trim())
        .filter((_, i, arr) => i > 0 && i < arr.length - 1)
      if (cells.length < 2) continue
      const rawName = cells[0].replace(/`/g, "").trim()
      // Strip parenthetical annotations from the name (e.g. `avatar-stack (block)`
      // becomes `avatar-stack`). The annotation is captured separately as `kind`.
      const nameCell = rawName.replace(/\s*\([^)]*\)\s*/g, "").trim()
      if (!nameCell || nameCell.includes("---") || nameCell === "Component") continue
      if (seen.has(nameCell)) continue
      seen.add(nameCell)

      const joined = cells.slice(1).join(" | ")
      const status = classifyStatus(joined)
      const viTicket = status === "shipped" ? undefined : extractVITicket(joined)
      const kindCell = cells[1] || ""
      // Detect kind both from the dedicated column AND from any (block)/(primitive)
      // annotation lifted from the name cell.
      const annotation = rawName.match(/\(([^)]+)\)/)?.[1] ?? ""
      const kind = /block/i.test(kindCell) || /block/i.test(annotation)
        ? "block"
        : /primitive/i.test(kindCell) || /primitive/i.test(annotation)
        ? "primitive"
        : undefined

      primitives.push({ name: nameCell, status, viTicket, kind })
    }
  }

  if (primitives.length === 0) {
    warnings.push("Handoff has no Component inventory rows — sandbox will be empty")
  }
  return primitives
}

function extractRecipeArtifacts(
  recipePath: string,
  warnings: string[]
): { screens: ScreenEntry[]; mockShapes: MockField[] } {
  const text = readFileSync(recipePath, "utf-8")
  const screens = extractScreens(text)
  const mockShapes = extractMockFields(text, warnings)
  return { screens, mockShapes }
}

function extractScreens(text: string): ScreenEntry[] {
  const out: ScreenEntry[] = []
  const matches = text.matchAll(/^###\s+Screen\s+\d+:\s+(.+?)(?:\s*\(`([^`]+)`\))?\s*$/gim)
  let idx = 1
  for (const m of matches) {
    const title = m[1].trim()
    const route = m[2]?.trim()
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const name = slug || `screen-${idx}`
    out.push({ name, title, route })
    idx++
  }
  return out
}

function extractMockFields(text: string, warnings: string[]): MockField[] {
  const m = text.match(/##\s+Inputs[^\n]*\n+([\s\S]*?)(?=\n##\s|\n$)/i)
  if (!m) {
    warnings.push(
      "Recipe has no 'Inputs from generation skill' section — mock data will be empty"
    )
    return []
  }
  const rows = m[1].split("\n").filter((r) => r.startsWith("|"))
  if (rows.length < 2) return []
  const out: MockField[] = []
  for (const row of rows.slice(2)) {
    const cells = row
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    if (cells.length < 2) continue
    const field = cells[0].replace(/`/g, "").trim()
    if (!field) continue
    const type = cells[1].replace(/`/g, "").trim()
    const description = cells[2]?.trim()
    out.push({ field, type, description })
  }
  return out
}
