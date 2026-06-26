# Golden Business Rules — Brand Workbench (VI-592, golden-path Phase 1)

> Authoritative (input → expected output) tables. Each row becomes a parameterized unit test in
> Phase 2. Boundary rows are mandatory. Source: journey.html / elicit-core.html (cited per rule).
> A change to any row is a scope change → escalate → re-run Phase 1.

## R-PROGRESS — global progress per section view

Source: journey.html `CFG` L613–621. `done` = spine steps complete; `pct` = global bar width.

| view (`data-stage`) | done | pct | encouraging copy fires |
|---------------------|------|-----|------------------------|
| start    | 0  | 5   | yes |
| strategy | 2  | 20  | yes |
| verbal   | 6  | 60  | yes |
| visual   | 7  | 75  | yes |
| prove    | 8  | 88  | yes |
| export   | 10 | 100 | yes |
| canvas   | 10 | 100 | yes (free-edit) |

Boundary: `start` is the floor (0 done / 5%); `export` and `canvas` both pin to 10/100% — entering canvas never reduces progress. Frozen as `STAGE_PROGRESS` in state-machine.ts (gap G-C resolved).

## R-NEXTSTEP — `nextStep(step)` (ordered derivation chain)

Source: spec/state-machine.ts `DERIVATION_ORDER`.

| step | nextStep |
|------|----------|
| start       | positioning |
| positioning | essence |
| essence     | personality |
| personality | pillars |
| pillars     | voice |
| voice       | tone |
| tone        | visual |
| visual      | prove |
| prove       | export |
| export      | **null** (terminal of guided chain) |
| canvas      | **null** (free-mode, not in chain) |

Boundary: `export` → null (no successor); `canvas` → null (excluded from the ordered chain).

## R-PREVSTEP — `prevStep(step)` (inverse of the chain)

| step | prevStep |
|------|----------|
| start       | **null** (no predecessor) |
| positioning | start |
| essence     | positioning |
| tone        | voice |
| visual      | tone |
| export      | prove |
| canvas      | **null** (free-mode, not in chain) |

Boundary: `start` → null; `canvas` → null. (Resolves blind-oracle gap G-E — `prevStep` now has an authoritative row table.)

## R-SPINE-STATUS — `deriveStepStatuses(currentStep, mode)`

Source: journey.html `.node.done/.active/.pending` + VI-550 `locked`; spec/state-machine.ts.

| currentStep | mode   | a step with order < current | order == current | order > current | canvas node |
|-------------|--------|-----------------------------|------------------|-----------------|-------------|
| positioning | guided | done | active | locked | locked |
| start       | guided | — (none before) | active (start) | locked | locked |
| export      | guided | done | active (export) | — (none after) | locked |
| (any)       | canvas | done | done | done | active |

Boundary: in `guided`, every future step is `locked` (forward-only); in `canvas`, all derivation nodes are `done` and the canvas node is `active`.

## R-CANVAS-ENTRY — `canEnterCanvas(currentStep, mode)`

Source: journey.html — Canvas entered from the mode card after Export; spec/state-machine.ts.

| currentStep | mode   | canEnterCanvas |
|-------------|--------|----------------|
| prove   | guided | false |
| export  | guided | **true** |
| start   | guided | false |
| export  | canvas | false (already canvas) |

Boundary: `export` is the threshold — `order >= stepOrder("export")`; any earlier step is false.

## R-ELICIT — `elicitReduce(state, event)` (center-panel machine)

Source: elicit-core.html turn/tool/challenge/setrow; spec/state-machine.ts `ELICIT_TRANSITIONS`.

| from.kind | event | result.kind |
|-----------|-------|-------------|
| empty | assistant-asks | awaiting-input |
| awaiting-input | user-sends | assistant-streaming |
| assistant-streaming | ai-returns-tool | tool-shown |
| assistant-streaming | ai-returns-challenge | challenge-shown |
| assistant-streaming | ai-errors | error |
| assistant-streaming | section-lock | section-complete |
| tool-shown | user-submits-tool | assistant-streaming |
| challenge-shown | challenge-keep | section-complete |
| challenge-shown | challenge-rewrite | awaiting-input |
| validation-warning | warning-apply-fix | assistant-streaming |
| error | error-retry | awaiting-input |
| **empty** | **user-sends** | **empty** (invalid transition → no-op) |
| **section-complete** | **(any)** | **section-complete** (terminal for the step) |

Boundary: any (kind, event) absent from the table is a **no-op** (state unchanged) — never a throw.

## R-KEYLESS — AI gating by key status

Source: BUILD-HANDOFF "no key? still fully manual"; spec/state-machine.ts `AI_DEPENDENT_EVENTS`.

| key | AI-dependent event (e.g. assistant-asks) | manual `section-lock` |
|-----|------------------------------------------|------------------------|
| key-active | fires | fires |
| keyless | **suppressed** (never fires) | **fires** (user locks sections manually) |

Boundary: in `keyless`, no AI-dependent event is emitted; the manual `section-lock` event is the only non-AI route to `section-complete`. NOTE (gap G-B): the keyless ENTRY path — how the first StructuredPrompt is presented and a section is locked without any AI turn — is asserted by BUILD-HANDOFF ("fully manual") but not drawn in the locked design. The conversational `ELICIT_TRANSITIONS` model the AI path; the full keyless interaction model is tracked to VI-562 (the AI/key seam, which owns the key-active vs keyless split). Do not infer a manual entry transition the design has not specified.

## R-PROVE-NONBLOCKING — coherence checks never block export

Source: journey.html L503 lede "nothing here blocks you"; L515 warn, L518 fail both carry fix actions.

| check status | shown affordance | blocks export? |
|--------------|------------------|----------------|
| pass | green check | no |
| warn | "Rewrite to voice" fix | **no** (advisory) |
| fail | "Suggest a fix" | **no** (advisory) |

Boundary: a `fail` is advisory only — export proceeds (see FREEZE-LEDGER D-7; `coherence-blocked` is reserved for a future opt-in strict gate, OFF by default).

## R-EXPORT-READY — export enablement

Source: journey.html — export enabled once all 10 spine nodes are `done`; contracts `zExportRequest` requires a complete `BrandRecord`.

| all derivation steps done? | record complete (all sections present)? | export enabled? |
|----------------------------|------------------------------------------|-----------------|
| no  | (any) | disabled |
| yes | no  | disabled (→ `incomplete-record`) |
| yes | yes | **enabled** |

Boundary: both conditions required; an all-done spine with a missing section still blocks export.

## R-TONE-KEYS — tone context completeness

Source: visor-brand-record.yaml `tone:`; spec/types.ts `ToneContext`.

| tone keys present | valid? |
|-------------------|--------|
| {error, success, empty, loading, validation-warning} | **valid** |
| missing any one of the five | invalid |
| any extra key beyond the five | invalid (closed set) |

## R-ESSENCE-CARDINALITY — essence word count

Source: visor-brand-record.yaml `essence` (2–3 words); contracts `zBrandRecord.essence.min(2).max(3)`.

| essence length | valid? |
|----------------|--------|
| 1 | invalid (below min) |
| 2 | valid |
| 3 | valid |
| 4 | invalid (above max) |

## R-DERIVATION-DEPENDENCY — downstream derives only after upstream locks

Source: journey.html canvas ghost/derive states ("derives once essence locks…"); elicit-core.html `.pill-card.derive`.

| section | derives only after these lock |
|---------|-------------------------------|
| essence     | positioning |
| personality | essence |
| pillars     | essence |
| voice       | personality |
| tone        | voice |

Boundary: a downstream section renders in the `deriving` (ghost) canvas state until every listed upstream section is `set`; it cannot reach `set` before them. Frozen as `DERIVATION_DEPENDENCIES` in state-machine.ts (graph only; live re-resolution reducer is VI-561). Gap G-D resolved.
