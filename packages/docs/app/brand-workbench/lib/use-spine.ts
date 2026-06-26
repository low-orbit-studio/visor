"use client"

// Brand Workbench navigation controller (VI-560).
//
// The single source of truth for "which journey stage are we on" — `currentStep` + `mode` — and the
// only place the frozen state machine is consumed. Every derived value (active view, per-node status,
// progress, canvas gating) comes straight from spec/state-machine.ts; this file never re-derives a
// rule (BUILD-HANDOFF + ticket: "Stage progression rules come verbatim from spec/rules.md").
//
// JSX-free on purpose so the file stays `.ts`: it exports the context + a controller hook; page.tsx
// mounts the provider. Consumers call `useSpine()`.

import * as React from "react"
import {
  type SpineStepId,
  type SectionViewId,
  type WorkbenchMode,
  type NodeStatus,
  STEP_TO_VIEW,
  STAGE_PROGRESS,
  deriveStepStatuses,
  nextStep,
  canEnterCanvas,
  initialWorkbenchState,
} from "../../../../../spec/state-machine"

/** The observable navigation state the whole surface reads from. */
export interface SpineController {
  /** The current spine step (drives everything). */
  currentStep: SpineStepId
  /** guided ⇄ canvas. */
  mode: WorkbenchMode
  /** The section view that renders `currentStep` (`STEP_TO_VIEW`). Drives `data-stage`. */
  view: SectionViewId
  /** Every node's status for the spine (`deriveStepStatuses`). */
  statuses: Record<SpineStepId, NodeStatus>
  /** Global progress for the active view (`STAGE_PROGRESS`). */
  progress: { done: number; pct: number }
  /** Whether Canvas mode is reachable from here (D-8 / `canEnterCanvas`). */
  canEnterCanvas: boolean
  /** Advance one step down the derivation chain (`nextStep`). No-op at the terminal. Drives Begin. */
  advance: () => void
  /** Navigate to a spine node (the journey nav — journey.html clickable nodes). */
  goToStep: (step: SpineStepId) => void
  /** Switch authoring mode. Canvas is rejected unless `canEnterCanvas`. */
  setMode: (mode: WorkbenchMode) => void
}

interface SpineState {
  currentStep: SpineStepId
  mode: WorkbenchMode
}

type SpineAction =
  | { type: "advance" }
  | { type: "goToStep"; step: SpineStepId }
  | { type: "setMode"; mode: WorkbenchMode }

function reducer(state: SpineState, action: SpineAction): SpineState {
  switch (action.type) {
    case "advance": {
      const next = nextStep(state.currentStep)
      return next ? { ...state, currentStep: next } : state
    }
    case "goToStep": {
      // The spine doubles as the journey nav (journey.html clickable nodes): navigating to a node
      // sets the current step; `deriveStepStatuses` re-derives every node's status (lock glyph ahead).
      // The one hard gate is Canvas mode (D-8 / setMode), not node navigation.
      return { ...state, currentStep: action.step }
    }
    case "setMode": {
      if (action.mode === state.mode) return state
      if (action.mode === "canvas") {
        // D-8: Canvas only at/after Export.
        return canEnterCanvas(state.currentStep, state.mode)
          ? { mode: "canvas", currentStep: "canvas" }
          : state
      }
      // Leaving Canvas → resume guided at Export (the threshold the draft was complete at).
      return { mode: "guided", currentStep: "export" }
    }
  }
}

function init(): SpineState {
  const seed = initialWorkbenchState()
  return { currentStep: seed.currentStep, mode: seed.mode }
}

const SpineContext = React.createContext<SpineController | null>(null)

/**
 * The reducer-backed controller. `page.tsx` calls this once and feeds it to `SpineContext.Provider`;
 * components read via `useSpine()`. (Kept JSX-free so this module stays `.ts`.)
 */
export function useSpineController(): SpineController {
  const [state, dispatch] = React.useReducer(reducer, undefined, init)

  return React.useMemo<SpineController>(() => {
    const view = STEP_TO_VIEW[state.currentStep]
    return {
      currentStep: state.currentStep,
      mode: state.mode,
      view,
      statuses: deriveStepStatuses(state.currentStep, state.mode),
      progress: STAGE_PROGRESS[view],
      canEnterCanvas: canEnterCanvas(state.currentStep, state.mode),
      advance: () => dispatch({ type: "advance" }),
      goToStep: (step) => dispatch({ type: "goToStep", step }),
      setMode: (mode) => dispatch({ type: "setMode", mode }),
    }
  }, [state])
}

/** Provider element identity for `page.tsx`. */
export const SpineProvider = SpineContext.Provider

/** Read the navigation controller. Throws outside a `SpineProvider`. */
export function useSpine(): SpineController {
  const ctx = React.useContext(SpineContext)
  if (!ctx) throw new Error("useSpine must be used within a SpineProvider")
  return ctx
}
