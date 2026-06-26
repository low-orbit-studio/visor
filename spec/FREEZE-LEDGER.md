# FREEZE-LEDGER — Brand Workbench (VI-592, golden-path Phase 1)

> Every boundary decision, default, and open question for the spec-freeze. This is the Phase-2
> oracle author's companion: it explains WHY each frozen artifact reads the way it does and which
> behaviors are deliberately tracked-not-covered. Maintained alongside `spec/`.

## Scope & gate config

- **Scope class:** `new-feature` (operator-confirmed, golden-path Phase 0) → full Phases 0–6.
- **Freeze scope:** the WHOLE Brand Workbench journey (11 stages) is enumerated. Static/designed
  structure (VI-559 Elicit core + VI-560 routes) is `covered`/`designed`; the AI/canvas/export
  DYNAMICS are tracked `partial`/`gap`/`deferred` to their build tickets. Operator-accepted.
- **`freeze_gate`:** `advisory` (Visor's first pass; flips to `required` after `retro_count >= 2`).
- **Validators:** `state_exit_point_validator.py` PASS (245/245 cells); `cuj_coverage_validator.py`
  PASS (40 steps: 25 covered, 6 partial, 9 gap, 0 n/a). Both non-strict — tracked gaps pass.

## Decisions (boundary rows resolved)

| # | Decision | Source | Rationale |
|---|----------|--------|-----------|
| D-1 | Scope = new-feature; full pipeline | golden-path Phase 0 | new screens + new `brand-strategy` data domain |
| D-2 | Whole journey enumerated; AI/canvas/export dynamics tracked, not faked | freeze-scope (operator) | honest coverage without relitigating the locked design |
| D-3 | `tone` context set is CLOSED at 5 (error, success, empty, loading, validation-warning) | visor-brand-record.yaml `tone:` | UI-state contexts are fixed, not runtime-discovered |
| D-4 | `essence` is an ORDERED array of 2–3 words | visor-brand-record.yaml `essence` | order is significant for messaging/export |
| D-5 | `pillars[].governs` is a union of optional tokens/components/surfaces | visor-brand-record.yaml L50–51 | a pillar may govern any combination of the three |
| D-6 | `visibility` enum = public \| private; default public | visor-brand-record.yaml L200 | open-source brands default public |
| D-7 | Coherence checks are NON-blocking — `warn` AND `fail` are advisory; export proceeds once the record is complete | journey.html L503 "nothing here blocks you" | the human holds the gate; `coherence-blocked` (contracts) is RESERVED for a future opt-in strict gate, OFF by default |
| D-8 | Canvas reachable only at/after Export (guided is forward-only) | journey.html mode card; CFG canvas pct:100 | free-edit follows a complete draft |
| D-9 | Keyless = full manual; AI events suppressed; manual `section-lock` still allowed | BUILD-HANDOFF "no key? still fully manual" | local-first, BYOK-optional |
| D-10 | Local-first, single-user, no server/auth/concurrency; atomic + idempotent writes | BUILD-HANDOFF "never leaves this machine" | drives the many `n/a` dispositions in state-inventory |
| D-11 | Invalid Elicit transitions are no-ops, never throws | spec/state-machine.ts | a UI machine must not crash on an out-of-order event |
| D-12 | Exactly one `BrandRecord` per `.visor.yaml` (no top-level array) | data-model digest | one brand per file |

## ESCALATE — open questions (tracked to tickets; NON-blocking for the VI-559 static freeze)

Each is `partial`/`gap` in cuj-coverage and/or `deferred` in state-inventory. They re-enter Phase 1
as `covered`/`designed` when their phase is designed+built — they do NOT block the static-structure freeze.

| # | Open question | Tracked to |
|---|---------------|-----------|
| E-1 | AI provider seam specifics — model list, cost-estimate UI, API-key entry/storage surface — not in the prototype | VI-562 |
| E-2 | Persistence target — `.visor.yaml` at project root vs theme-level; live status of the VI-505 `brand-strategy` validator (does the schema gate exist yet?) | VI-505 / VI-562 |
| E-3 | Export agent-manifest exact JSON schema (the PUBLIC-key projection) is not frozen | VI-563 |
| E-4 | Seed ingestion (URL crawl / deck parse) scope + failure modes — not designed | VI-562 (UJ-F) |
| E-5 | Guided⇄Canvas live re-resolution — exactly which downstream sections recompute on an upstream edit | VI-561 |
| E-6 | Per-stage routing (VI-560) vs single route + `data-stage`; INTERFACE freezes the single base route `/brand-workbench`, sub-routes deferred | VI-560 |

## Source manifest (the locked design — visual+interaction truth, do not relitigate)

| Artifact | Role |
|----------|------|
| docs/design/brand-workbench/journey.html | Full A→Z journey — spine, stages, states, CFG |
| docs/design/brand-workbench/elicit-core.html | Elicit core screen (VI-559) — panels, turn types, states |
| docs/design/brand-workbench/BUILD-HANDOFF.md | Locked decisions (do not relitigate) |
| docs/design/brand-workbench/component-audit.md | Component inventory (1 extension + 8 new) |
| docs/brand/visor-brand-record.yaml | BrandRecord data model + dogfood fixtures |
| docs/brand/visor-brand-strategy.md | Human-canonical narrative |
| docs/brand-workbench-roadmap.md | Epic phasing |

## Blind-oracle gaps (Phase 2) — found by the isolated oracle author

| Gap | Finding | Resolution |
|-----|---------|-----------|
| G-A | `tone: z.record(enum,…)` is partial under Zod 3 → a missing tone key wrongly parsed as valid (1 RED test) | contracts.ts `tone` → explicit `z.object({…5 keys}).strict()`; missing OR extra key now invalid. Oracle green. |
| G-B | The conversational state machine has no AI-free path to `section-complete`; the keyless-manual flow is not expressible | NOT modified (the locked design does not draw the manual entry — no inventing UX). ESCALATE → VI-562 (owns the key-active/keyless split); R-KEYLESS note added. |
| G-C | R-PROGRESS done/pct had no frozen source (journey.html CFG only) | Frozen as `STAGE_PROGRESS` const in state-machine.ts + oracle test (`frozen-data.test.ts`). |
| G-D | R-DERIVATION-DEPENDENCY graph was prose-only | Frozen as `DERIVATION_DEPENDENCIES` const + oracle test; live re-resolution reducer remains VI-561. |
| G-E | `prevStep` had no authoritative row table | R-PREVSTEP table added to rules.md. |

## Phase status

- **Phase 1 (Freeze Inputs):** artifacts complete — `types.ts`, `state-machine.ts`, `contracts.ts`,
  `INTERFACE.d.ts`, `rules.md`, `state-inventory.yaml`, `cuj-coverage.yaml`, this ledger. TS compiles
  `tsc --strict` (exit 0). Both completeness validators green. **Gate PASSED — operator-approved (spec-frozen).**
- **Phase 2 (Freeze the Oracle):** COMPLETE. Oracle authored blind; isolation attested (below).
  5 spec gaps surfaced (table above) — G-A/C/D/E fixed in the spec, G-B escalated to VI-562.
  - **Isolation attestation (required, G-04):** the acceptance oracle was authored by a subagent
    instructed to read ONLY `spec/` — forbidden from opening `packages/`, `components/`, `src/`, or any
    existing test. The subagent attested it read only the eight `spec/` files. By instruction + attestation
    (not dispatch-enforced).
  - **Oracle tiers:** TIER 1 runnable — Vitest unit tests of the frozen pure logic + Zod contract tests,
    green against `spec/`. TIER 2 scaffold — Playwright CUJ specs for the `covered` journeys, `test.fixme`,
    activated by the VI-559 build (the presentational layer is impl-first per the spec-freeze carve-out).
- **Phase 3 (Prove + Self-Inspect):** Tier-1 oracle runs green; CI workflow committed to run the oracle +
  both completeness validators on every PR. Playwright screenshots N/A at this stage — the UI is built in
  Phase 5 (VI-559); the Tier-2 specs un-skip then.
- No ESCALATE item blocks the static-structure freeze; all are tracked to existing build tickets.
