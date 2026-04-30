/**
 * Pure classification of a source identifier (file path or bundler chunk
 * URL) against host-supplied predicates. Extracted from the
 * SourceInspector runtime so the logic is testable without React.
 */

import { VISOR_COMPONENT_NAMES } from "./visor-component-names.generated"

export type SourceLabel = "visor" | "local" | "third-party" | "dom"

export interface Classifiers {
  visor?: (source: string) => boolean
  local?: (source: string) => boolean
  thirdParty?: (source: string) => boolean
}

// Underscore form (`loworbitstudio_visor`) covers Turbopack chunk URLs that
// flatten path separators; slash form covers plain file paths and Webpack
// chunks that preserve `node_modules/@loworbitstudio/visor`.
const VISOR_MARKERS = ["@loworbitstudio/visor", "loworbitstudio_visor"]

function matchesVisor(source: string): boolean {
  return VISOR_MARKERS.some((marker) => source.includes(marker))
}

export const DEFAULT_CLASSIFIERS: Classifiers = {
  visor: (source) => matchesVisor(source),
  local: (source) =>
    !source.includes("node_modules") &&
    !source.includes("/.pnpm/") &&
    !source.startsWith("<"),
  thirdParty: (source) =>
    source.includes("node_modules") && !matchesVisor(source),
}

export function classifyFile(
  fileName: string | undefined | null,
  classifiers: Classifiers = DEFAULT_CLASSIFIERS,
): SourceLabel {
  if (!fileName) return "dom"
  const merged: Required<Classifiers> = {
    visor: classifiers.visor ?? DEFAULT_CLASSIFIERS.visor!,
    local: classifiers.local ?? DEFAULT_CLASSIFIERS.local!,
    thirdParty: classifiers.thirdParty ?? DEFAULT_CLASSIFIERS.thirdParty!,
  }
  if (merged.visor(fileName)) return "visor"
  if (merged.local(fileName)) return "local"
  if (merged.thirdParty(fileName)) return "third-party"
  return "dom"
}

/**
 * Bundler-independent fast path. Returns "visor" when the React component
 * name (from `_debugOwner.type.displayName ?? _debugOwner.type.name`) is in
 * the registry-derived set, otherwise undefined so callers can fall back to
 * URL-based classification.
 *
 * Turbopack hashes away `@loworbitstudio/visor` from chunk URLs, so URL
 * substring matching cannot identify Visor renders under Next 16 dev. The
 * component name is stable across bundlers; this set is regenerated from
 * the registry by `scripts/generate-visor-component-names.ts`.
 */
export function classifyByVisorName(
  name: string | undefined | null,
): "visor" | undefined {
  if (!name) return undefined
  return VISOR_COMPONENT_NAMES.has(name) ? "visor" : undefined
}
