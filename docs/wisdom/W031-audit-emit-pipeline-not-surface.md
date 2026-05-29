# W031 — Coverage audits must verify the emit pipeline, not just the surface layer

**Tags:** audit, design-tokens, theme-engine, verification, pipeline

**Source:** VI-466 audit of the docs Visual Explorer — "does it expose the BL-193 token shape?" The first-pass answer scoped itself to the demo layer (which demos reference which tokens). An adversarial review of that audit found the real blocker upstream: six BL-193 token families (`interactive-primary-soft/glow/strong`, `surface-{success,warning,error}-soft`, and `surface-elevated`) were not in the theme-engine's `semantic-map.ts`, so `applyOverrides` silently dropped them — they emitted no CSS under any theme, including the one that authored them. A demo-layer-only audit would have greenlit demo tickets that, once built, rendered nothing.

## What

A token (or prop, flag, field) can be referenced at the surface — a demo, a component, a doc — yet never materialize at runtime because an upstream stage discards it:

1. `blacklight-underground.theme.visor.yaml` declared all six families in `overrides.dark`.
2. The engine's `applyOverrides` only applies an override whose key already exists in the resolved semantic group (`overrides.ts` guard; the test literally reads "silently ignores unknown override keys").
3. None of the six keys were in `semantic-map.ts`, so they were dropped — `validate` returned `valid: true`, zero `--vars` emitted, only a non-blocking `UNKNOWN_OVERRIDE_KEY` warning.

"The theme sets it" and "a demo references it" were both true. "It renders" was false. The gap was invisible from the surface.

## Why

- **A surface reference is necessary but not sufficient.** Source → resolve → emit → consume → display: a broken link anywhere yields a referenced-but-absent artifact, and the break is usually upstream of where you're looking.
- **It reorders the work.** The finding turned a flat list of demo tickets into a dependency — the engine had to emit the tokens (VI-478) *before* the demos could exercise them (VI-479). Filing/starting the demos first would have wasted the effort and produced blank UI.
- **"Validates" ≠ "emits."** The theme passed validation the entire time; the drop was a non-blocking warning. A green validator is not evidence the value is present in the output.

## When

Any audit whose question is "does X expose / support / cover Y?" — design-token coverage, feature flags, config surfaces, API fields, i18n keys — and especially before filing or starting downstream work that assumes Y exists.

## How

- Trace Y through every stage from definition to render. Don't stop at the layer that *references* it.
- For token/config pipelines: build the artifact and grep the emitted output (or read computed runtime state) for the value before marking it "covered." A `dynamic` swatch that reads `getComputedStyle` is a cheap probe; a build-and-grep is the definitive one.
- Treat "referenced" and "emitted" as two separate claims, each needing its own evidence.
- If a downstream task depends on the artifact, verify it exists first; if it doesn't, file the producing change as a hard prerequisite and wire the `blocked-by` relation.
- Run a second pass — ideally an adversarial reviewer — that attacks the audit's denominator: "what would make this conclusion wrong?" The emit gap here surfaced only under that lens, not in the first-pass read.
