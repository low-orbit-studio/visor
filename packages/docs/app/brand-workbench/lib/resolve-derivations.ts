// Live re-resolution graph helpers (VI-561).
//
// D4 (FREEZE-LEDGER E-5, operator-confirmed): re-resolution is **scoped per pillar** — editing one
// section invalidates only its downstream derivation closure, never the whole record — and **lazy**
// (a stale section re-resolves on the next view of the Guided view that owns it, not eagerly on edit).
//
// Both the scope and the trigger read off the frozen dependency GRAPH in spec/state-machine.ts
// (`DERIVATION_DEPENDENCIES`); this file never re-states the edges — it only traverses them. The
// graph is upstream-keyed (section → the sections it derives FROM); re-resolution needs the reverse
// (section → the sections that derive from it), so we invert it once and BFS the transitive closure.

import {
  DERIVATION_DEPENDENCIES,
  type CanvasSectionId,
} from "../../../../../spec/state-machine"

/**
 * Every section that participates in the derivation graph — the union of the dependents (keys) and
 * their upstreams (values). These are the only sections whose canvas status can go `stale`; sections
 * absent from the graph (visual, prove, export) have no derivation edge and stay `set`.
 */
export const DERIVATION_SECTIONS: readonly CanvasSectionId[] = (() => {
  const set = new Set<CanvasSectionId>()
  for (const [dependent, upstreams] of Object.entries(DERIVATION_DEPENDENCIES)) {
    set.add(dependent as CanvasSectionId)
    for (const up of upstreams ?? []) set.add(up)
  }
  return [...set]
})()

/** The inverted graph: section → the sections that derive directly from it (one hop). */
const DEPENDENTS: Map<CanvasSectionId, CanvasSectionId[]> = (() => {
  const map = new Map<CanvasSectionId, CanvasSectionId[]>()
  for (const [dependent, upstreams] of Object.entries(DERIVATION_DEPENDENCIES)) {
    for (const up of upstreams ?? []) {
      const list = map.get(up) ?? []
      list.push(dependent as CanvasSectionId)
      map.set(up, list)
    }
  }
  return map
})()

/**
 * The transitive downstream closure of a section — every section that (directly or indirectly)
 * derives from it. This is exactly the set an edit to `section` invalidates (D4 scope). The edited
 * section itself is NOT included. Order is breadth-first from `section`; duplicates are collapsed.
 *
 * e.g. `positioning` → [essence, personality, pillars, voice, tone]; `voice` → [tone];
 *      `pillars` → [] (nothing derives from pillars).
 */
export function downstreamDependents(section: CanvasSectionId): CanvasSectionId[] {
  const out: CanvasSectionId[] = []
  const seen = new Set<CanvasSectionId>([section])
  const queue = [...(DEPENDENTS.get(section) ?? [])]
  while (queue.length) {
    const next = queue.shift() as CanvasSectionId
    if (seen.has(next)) continue
    seen.add(next)
    out.push(next)
    queue.push(...(DEPENDENTS.get(next) ?? []))
  }
  return out
}
