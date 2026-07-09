# BO-67 — render-vs-design self-check, retroactive proof on doc-nav

This directory is the evidence for BO-67's third success criterion:

> Proven retroactively on doc-nav: the check flags the exact gray-pill / radius / alignment deltas the operator had to hand-catch.

It demonstrates that the [Component Build Workflow](../../../CLAUDE.md) render-vs-design self-check — render the built component via `visor render` across ≥2 themes × both modes, then multimodally diff it against `design_ref` — surfaces the same drift the operator caught by hand across VI-611 (and VI-612), **before** those PRs landed.

## `design_ref`

[`doc-nav-approved.png`](./doc-nav-approved.png) is the approved-design reference for doc-nav (a `visor render doc-nav --theme space --mode dark` capture of the polished, post-VI-611 component — the state the operator signed off on; the original PL-2185 mockup lives in the design tool). `components/ui/doc-nav/doc-nav.visor.yaml` points its `design_ref` at this file, which makes doc-nav a live example of the intrinsic, default-on trigger.

## How this was produced

```bash
# 1. Approved (current) doc-nav — the design_ref reference set.
npx tsx packages/cli/src/index.ts render doc-nav --theme space    --mode dark  --out doc-nav-approved-space-dark.png
npx tsx packages/cli/src/index.ts render doc-nav --theme space    --mode light --out doc-nav-approved-space-light.png
npx tsx packages/cli/src/index.ts render doc-nav --theme blackout --mode dark  --out doc-nav-approved-blackout-dark.png

# 2. Temporarily restore the PRE-VI-611 doc-nav (commit 4999f286, VI-608's initial build)
#    — the "ugly-but-CI-green" state that shipped before the operator's hand-review.
git show 4999f286:components/ui/doc-nav/doc-nav.module.css > components/ui/doc-nav/doc-nav.module.css
git show 4999f286:components/ui/doc-nav/doc-nav.tsx        > components/ui/doc-nav/doc-nav.tsx

# 3. Render the pre-fix component across the same theme × mode set.
npx tsx packages/cli/src/index.ts render doc-nav --theme space    --mode dark  --out doc-nav-prefix-space-dark.png
npx tsx packages/cli/src/index.ts render doc-nav --theme space    --mode light --out doc-nav-prefix-space-light.png
npx tsx packages/cli/src/index.ts render doc-nav --theme blackout --mode dark  --out doc-nav-prefix-blackout-dark.png

# 4. Restore.
git checkout HEAD -- components/ui/doc-nav/doc-nav.module.css components/ui/doc-nav/doc-nav.tsx
```

Both pre-fix and approved renders passed `validate:strict` in their own eras — the CSS compiled, the tokens were "correct." That is exactly the point: a green pipeline is not proof of fidelity (W-110, W-111). Only the rendered diff below exposes the drift.

## Side-by-side

| Delta class | Pre-VI-611 (`*-prefix-*`) | Approved (`*-approved-*`) |
|---|---|---|
| **Pill fill (gray-pill)** | Resting pills read as a light medium-gray — `--surface-subtle`, which resolves *lighter* than the card in dark themes | Recessed wells (`--doc-nav-pill-bg`), darker than the card in **both** modes (the surface ramp inverts light↔dark) |
| **Radius** | Group clusters + collapsed chips inherit the theme `--radius-*` scale — decorative themes inflate it (Strata `--radius-xl` → 32px); collapsed chips render fully pill-shaped | Fixed `--doc-nav-group-radius: 0.75rem` (~12px), matching the design's per-theme intent |
| **Type** | Pill + group labels are title-case at `--font-size-xs` (12px) — "Getting Started", "Overview" | All-caps mono at `--font-size-2xs` (11px) — "GETTING STARTED", "OVERVIEW" |
| **Active pill** | Weak outlined/tinted "Getting Started" — no accent pop | Vivid `--doc-nav-accent` fill with `aria-current` styling |
| **Group dots** | Monochrome gray dots on every group | Color-coded per group (cyan Shared, indigo product groups) |
| **Alignment** | All-caps group-label caps ride ~2px high off the scope dot (tall inherited line-height) | `line-height: 1` centers the caps optically on the dot (measured 0px offset) |

These map one-to-one to the fixes documented in VI-611's commit (`12e22e35`): "tighter group radius, darker recessed pills, smaller pill/label type", "darken collapsed group chips", and "vertically center group-label caps against the scope dot."

## Captures

- `doc-nav-approved-space-dark.png` vs `doc-nav-prefix-space-dark.png` — clearest (dark mode, where the `--surface-subtle` inversion bites hardest).
- `doc-nav-approved-blackout-dark.png` vs `doc-nav-prefix-blackout-dark.png` — second theme; same deltas hold.
- `doc-nav-approved-space-light.png` vs `doc-nav-prefix-space-light.png` — light mode coverage.

## Why this matters

Before this workflow, doc-nav shipped from VI-608 CI-green but visually wrong, and the operator had to serve as the fidelity gate across two follow-up tickets (VI-611, VI-612). With `design_ref` present, the render-vs-design self-check is default-on and would have surfaced every delta above at build time — no opt-in checklist item to forget (W-111).
