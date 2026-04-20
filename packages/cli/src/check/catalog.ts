import { loadManifest } from "../registry/resolve.js"
import type { VisorManifest } from "../generate/manifest-types.js"

export type CatalogItemType = "component" | "block" | "hook" | "pattern"

export interface CatalogItem {
  type: CatalogItemType
  name: string
  category?: string
  description: string
}

export interface MatchResult {
  found: true
  name: string
  type: CatalogItemType
  category?: string
  description: string
  installCmd: string | null
}

export interface NoMatchResult {
  found: false
}

const STOP_WORDS = new Set([
  "a", "an", "the", "with", "for", "and", "or", "to", "in", "of", "is",
  "that", "this", "it", "as", "at", "by", "on", "be", "are", "was", "were",
])

function toKebab(s: string): string {
  return s
    .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
    .replace(/^-/, "")
    .toLowerCase()
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s\-_,]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

function installCmd(name: string, type: CatalogItemType): string | null {
  if (type === "block") return `npx visor add ${name} --block`
  if (type === "pattern") return null
  return `npx visor add ${name}`
}

export function getAllCatalogItems(manifest: VisorManifest): CatalogItem[] {
  const items: CatalogItem[] = []

  for (const [name, c] of Object.entries(manifest.components)) {
    items.push({ type: "component", name, category: c.category, description: c.description })
    for (const sub of c.sub_components ?? []) {
      items.push({ type: "component", name: toKebab(sub.name), category: c.category, description: sub.description })
    }
  }
  for (const [name, b] of Object.entries(manifest.blocks)) {
    items.push({ type: "block", name, category: b.category, description: b.description })
  }
  for (const [name, h] of Object.entries(manifest.hooks)) {
    items.push({ type: "hook", name, description: h.description })
  }
  for (const [name, p] of Object.entries(manifest.patterns)) {
    items.push({ type: "pattern", name, description: p.description })
  }

  return items
}

export function findByName(
  manifest: VisorManifest,
  pattern: string
): MatchResult | NoMatchResult {
  const normalized = toKebab(pattern)

  if (normalized in manifest.components) {
    const c = manifest.components[normalized]
    return { found: true, name: normalized, type: "component", category: c.category, description: c.description, installCmd: `npx visor add ${normalized}` }
  }
  if (normalized in manifest.blocks) {
    const b = manifest.blocks[normalized]
    return { found: true, name: normalized, type: "block", category: b.category, description: b.description, installCmd: `npx visor add ${normalized} --block` }
  }
  if (normalized in manifest.hooks) {
    const h = manifest.hooks[normalized]
    return { found: true, name: normalized, type: "hook", description: h.description, installCmd: `npx visor add ${normalized}` }
  }
  if (normalized in manifest.patterns) {
    const p = manifest.patterns[normalized]
    return { found: true, name: normalized, type: "pattern", description: p.description, installCmd: null }
  }

  // Sub-component lookup (PascalCase names like AccordionItem, CardHeader)
  for (const [parentName, c] of Object.entries(manifest.components)) {
    for (const sub of c.sub_components ?? []) {
      if (toKebab(sub.name) === normalized) {
        return { found: true, name: toKebab(sub.name), type: "component", category: c.category, description: sub.description, installCmd: `npx visor add ${parentName}` }
      }
    }
  }

  return { found: false }
}

export interface FuzzyResult {
  name: string
  type: CatalogItemType
  category?: string
  description: string
  score: number
  matchReason: string
  installCmd: string | null
}

export function fuzzyFind(
  manifest: VisorManifest,
  query: string,
  limit = 5
): FuzzyResult[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const results: FuzzyResult[] = []

  for (const item of getAllCatalogItems(manifest)) {
    const searchText = [item.name, item.description].join(" ").toLowerCase()
    const matched = queryTokens.filter((t) => searchText.includes(t))
    if (matched.length > 0) {
      results.push({
        name: item.name,
        type: item.type,
        category: item.category,
        description: item.description,
        score: matched.length,
        matchReason: `Matched: ${matched.join(", ")}`,
        installCmd: installCmd(item.name, item.type),
      })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

export { loadManifest }
