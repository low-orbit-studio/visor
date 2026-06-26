"use client"

// Brand Workbench draft store (VI-561) — the single Brand Record draft shared across Guided ⇄ Canvas.
//
// D3: ONE store, no copy-on-switch. `page.tsx` mounts the provider ABOVE the mode toggle, so flipping
// guided ⇄ canvas never unmounts it — the draft (and its per-section resolution status) simply
// persists. Canvas is the free-edit surface that writes the draft; the Guided derived-section views
// read it back (the same store, both directions).
//
// D4 (lazy, scoped per pillar): editing a section marks only its downstream derivation closure
// `stale` (`downstreamDependents`, off the frozen graph) — never the whole record. A stale section
// re-resolves lazily, when the Guided view that owns it next renders (`resolveView`), not on edit.
//
// JSX-free on purpose so this stays `.ts` (mirrors use-spine.ts): it exports the context + a
// controller hook; page.tsx mounts the provider. Consumers call `useDraft()`.

import * as React from "react"
import {
  type CanvasSectionId,
  type SectionViewId,
  STEP_TO_VIEW,
} from "../../../../../spec/state-machine"
import { CANVAS_CONTENT } from "./journey-fixtures"
import { DERIVATION_SECTIONS, downstreamDependents } from "./resolve-derivations"

/** A derived section is `set` (current) or `stale` (an upstream edit invalidated it; awaits re-view). */
export type ResolutionStatus = "set" | "stale"

/**
 * The canvas free-edit blocks — the board form of the dogfood Brand Record (VISOR_BRAND_RECORD,
 * projected into `CANVAS_CONTENT` in VI-560). Blocks whose label maps to a frozen `CanvasSectionId`
 * participate in re-resolution; the rest (lexicon, color/type, marks) are free edits with no cascade.
 */
const SECTION_BY_LABEL: Record<string, CanvasSectionId> = {
  Essence: "essence",
  Positioning: "positioning",
  Personality: "personality",
  Pillars: "pillars",
  Voice: "voice",
  Tone: "tone",
}

/** Static block metadata (value is dynamic — held in store state). */
export interface CanvasBlockMeta {
  /** stable id (kebab-cased label), the key into `values`. */
  id: string
  label: string
  /** the derivation section this block edits, when it maps to one. */
  section?: CanvasSectionId
}

/** A block as the Canvas view consumes it — meta + live value + live resolution status. */
export interface CanvasBlock extends CanvasBlockMeta {
  value: string
  /** `undefined` for blocks with no derivation section (never goes stale). */
  status?: ResolutionStatus
}

const slug = (label: string) =>
  label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/** The board's block list, in journey.html order, seeded from the dogfood record's board projection. */
export const CANVAS_BLOCKS: readonly CanvasBlockMeta[] = CANVAS_CONTENT.blocks.map((b) => ({
  id: slug(b.label),
  label: b.label,
  section: SECTION_BY_LABEL[b.label],
}))

const SECTION_BY_ID: Record<string, CanvasSectionId | undefined> = Object.fromEntries(
  CANVAS_BLOCKS.map((b) => [b.id, b.section]),
)

/** Which derivation sections a Guided view owns — the lazy re-resolution trigger set (off STEP_TO_VIEW). */
const SECTIONS_BY_VIEW: Partial<Record<SectionViewId, CanvasSectionId[]>> = (() => {
  const map: Partial<Record<SectionViewId, CanvasSectionId[]>> = {}
  for (const section of DERIVATION_SECTIONS) {
    const view = STEP_TO_VIEW[section]
    ;(map[view] ??= []).push(section)
  }
  return map
})()

interface DraftState {
  values: Record<string, string>
  status: Record<string, ResolutionStatus>
}

type DraftAction =
  | { type: "editBlock"; blockId: string; value: string }
  | { type: "resolveView"; view: SectionViewId }

function init(): DraftState {
  const values: Record<string, string> = {}
  for (const b of CANVAS_CONTENT.blocks) values[slug(b.label)] = b.value
  const status: Record<string, ResolutionStatus> = {}
  for (const s of DERIVATION_SECTIONS) status[s] = "set"
  return { values, status }
}

function reducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "editBlock": {
      const value = action.value
      if (state.values[action.blockId] === value) return state
      const values = { ...state.values, [action.blockId]: value }
      const section = SECTION_BY_ID[action.blockId]
      if (!section) return { ...state, values } // free-edit block — no downstream to invalidate
      // D4 scope: mark only the edited section's transitive downstream closure stale.
      const stale = downstreamDependents(section)
      if (stale.length === 0) return { ...state, values }
      const status = { ...state.status }
      for (const s of stale) status[s] = "stale"
      return { values, status }
    }
    case "resolveView": {
      // D4 lazy trigger: viewing a Guided section re-resolves it (clears stale). Canvas, the
      // edit surface, owns no sections here — staleness stays visible until you go look.
      const owned = SECTIONS_BY_VIEW[action.view]
      if (!owned) return state
      let changed = false
      const status = { ...state.status }
      for (const s of owned) {
        if (status[s] === "stale") {
          status[s] = "set"
          changed = true
        }
      }
      return changed ? { ...state, status } : state
    }
  }
}

/** The observable draft the surface reads from. */
export interface DraftController {
  /** Board blocks with live value + resolution status (journey.html order). */
  blocks: CanvasBlock[]
  /** Edit a block's value; marks its downstream derivation closure stale (D4). */
  editBlock: (blockId: string, value: string) => void
  /** Re-resolve the sections a view owns (the lazy trigger — call on view render). */
  resolveView: (view: SectionViewId) => void
}

const DraftContext = React.createContext<DraftController | null>(null)

/** Reducer-backed controller. `page.tsx` calls this once and feeds it to `DraftProvider`. */
export function useDraftController(): DraftController {
  const [state, dispatch] = React.useReducer(reducer, undefined, init)

  const editBlock = React.useCallback(
    (blockId: string, value: string) => dispatch({ type: "editBlock", blockId, value }),
    [],
  )
  const resolveView = React.useCallback(
    (view: SectionViewId) => dispatch({ type: "resolveView", view }),
    [],
  )

  return React.useMemo<DraftController>(() => {
    const blocks: CanvasBlock[] = CANVAS_BLOCKS.map((b) => ({
      ...b,
      value: state.values[b.id],
      status: b.section ? state.status[b.section] : undefined,
    }))
    return { blocks, editBlock, resolveView }
  }, [state, editBlock, resolveView])
}

/** Provider element identity for `page.tsx`. */
export const DraftProvider = DraftContext.Provider

/** Read the draft store. Throws outside a `DraftProvider`. */
export function useDraft(): DraftController {
  const ctx = React.useContext(DraftContext)
  if (!ctx) throw new Error("useDraft must be used within a DraftProvider")
  return ctx
}

/**
 * Mount once inside the shell: re-resolves the active view's sections whenever the view changes —
 * the lazy "re-resolve on next view" trigger (D4). Caller passes the live `view` from `useSpine`.
 */
export function useResolveOnView(view: SectionViewId): void {
  const { resolveView } = useDraft()
  React.useEffect(() => {
    resolveView(view)
  }, [view, resolveView])
}
