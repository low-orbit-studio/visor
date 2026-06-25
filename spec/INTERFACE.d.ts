// FROZEN — Brand Workbench spec-freeze (VI-592, golden-path Phase 1).
// The test-facing interface contract: routes, the data-testid map, and the function signatures
// the Phase-2 oracle author writes against. Pure declaration — no `src/` imports. If a testid is
// not here, the oracle may not reference it. Do NOT edit during build (a change is a scope change).

import type {
  SpineStepId,
  WorkbenchState,
  WorkbenchMode,
  NodeStatus,
  ElicitState,
  ElicitEvent,
} from "./state-machine"
import type { DraftBrandRecord } from "./types"
import type {
  ElicitRequest,
  ElicitResponse,
  WriteRecordRequest,
  ExportRequest,
  ExportResult,
} from "./contracts"

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base route of the Workbench (BUILD-HANDOFF: packages/docs/app/brand-workbench/).
 * Per-stage sub-routing (e.g. /brand-workbench/strategy) is VI-560; until then the active
 * stage is reflected on the root element via `data-stage`.
 */
export type BrandWorkbenchRoute = "/brand-workbench"

/** Root element attribute carrying the active section view (journey.html html[data-stage]). */
export type DataStageValue =
  | "start"
  | "strategy"
  | "verbal"
  | "visual"
  | "prove"
  | "export"
  | "canvas"

// ─────────────────────────────────────────────────────────────────────────────
// data-testid map — the closed set the oracle may query
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every test id the build MUST expose. Component build tickets add `data-testid` matching these.
 * Per-spine-node ids are templated: `bw-spine-node-${SpineStepId}`.
 */
export type BrandWorkbenchTestId =
  // shell
  | "bw-root"
  | "bw-global-progress"
  | "bw-key-pill"
  // left: spine
  | "bw-spine"
  | "bw-spine-progress-card"
  | "bw-mode-guided"
  | "bw-mode-canvas"
  // center: elicit
  | "bw-elicit-thread"
  | "bw-elicit-breadcrumb"
  | "bw-elicit-stepmeter"
  | "bw-turn-assistant"
  | "bw-turn-user"
  | "bw-tool" // StructuredPrompt / mad-lib
  | "bw-tool-slot"
  | "bw-challenge"
  | "bw-challenge-keep"
  | "bw-challenge-rewrite"
  | "bw-section-complete"
  | "bw-suggestion-chip"
  | "bw-composer"
  | "bw-composer-input"
  | "bw-composer-send"
  | "bw-model-chip"
  // right: live canvas
  | "bw-canvas"
  | "bw-canvas-section"
  | "bw-canvas-mode-toggle"
  // start
  | "bw-start"
  | "bw-path-seed"
  | "bw-path-blank"
  | "bw-name-input"
  | "bw-visibility-toggle"
  | "bw-begin"
  // visual / prove / export / canvas-board
  | "bw-visual"
  | "bw-prove"
  | "bw-score-ring"
  | "bw-check"
  | "bw-check-fix"
  | "bw-export"
  | "bw-export-yaml"
  | "bw-visibility-public"
  | "bw-visibility-private"
  | "bw-export-submit"
  | "bw-board"
  | "bw-block"
  | "bw-block-edit"
  | "bw-block-save"
  | "bw-block-ai"

/** Per-spine-node test id (e.g. "bw-spine-node-positioning"). */
export type SpineNodeTestId = `bw-spine-node-${SpineStepId}`

// ─────────────────────────────────────────────────────────────────────────────
// Function signatures — state machine (impl in state-machine.ts) + the three seams
// ─────────────────────────────────────────────────────────────────────────────

export declare function stepOrder(step: SpineStepId): number
export declare function nextStep(step: SpineStepId): SpineStepId | null
export declare function prevStep(step: SpineStepId): SpineStepId | null
export declare function deriveStepStatuses(
  currentStep: SpineStepId,
  mode: WorkbenchMode,
): Record<SpineStepId, NodeStatus>
export declare function canEnterCanvas(currentStep: SpineStepId, mode: WorkbenchMode): boolean
export declare function elicitReduce(state: ElicitState, event: ElicitEvent): ElicitState
export declare function initialWorkbenchState(): WorkbenchState

// Seam 1 — AI provider (VI-562). Rejects with an AiFailure.
export declare function elicit(req: ElicitRequest): Promise<ElicitResponse>

// Seam 2 — persistence (VI-562/VI-505). read returns null when absent; write is atomic + idempotent.
export declare function readBrandRecord(path: string): Promise<DraftBrandRecord | null>
export declare function writeBrandRecord(req: WriteRecordRequest): Promise<void>

// Seam 3 — export (VI-563). Deterministic; rejects with an ExportFailure.
export declare function exportBrand(req: ExportRequest): Promise<ExportResult>
