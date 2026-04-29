/**
 * Pure classification of a source file path against host-supplied
 * predicates. Extracted from the SourceInspector runtime so the logic
 * is testable without instantiating React.
 */

export type SourceLabel = "visor" | "local" | "third-party" | "dom"

export interface Classifiers {
  visor?: (filePath: string) => boolean
  local?: (filePath: string) => boolean
  thirdParty?: (filePath: string) => boolean
}

export const DEFAULT_CLASSIFIERS: Classifiers = {
  visor: (path) => path.includes("node_modules/@loworbitstudio/visor"),
  local: (path) =>
    !path.includes("node_modules") &&
    !path.includes("/.pnpm/") &&
    !path.startsWith("<"),
  thirdParty: (path) =>
    path.includes("node_modules") &&
    !path.includes("@loworbitstudio/visor"),
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
