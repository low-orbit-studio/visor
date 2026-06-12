---
"@loworbitstudio/visor": minor
---

Density axis + editorial-admin reconcile. Components gain a first-class **density axis** (`compact | default | editorial`): the editorial-admin treatment (sizing, type ramp, tonal fills) is baked into each component's CSS under `:global([data-density="editorial"])`, switched by a single `data-density="editorial"` attribute on any ancestor (typically the app root). The former external token-overlay hook layer is retired. Default rendering is byte-identical for existing consumers; editorial is opt-in. See `docs/density.md` and `docs/admin-editorial-reconcile-plan.md`.

Density treatment (under `data-density="editorial"`): badge 11px/600 uppercase tracked + tonal color-mix fills; chip (FilterChip) 12px, neutral-elevated selected, circular primary count pill; input sm 33.5px/radius-md, controls on the card tier via `--field-control-bg`; button md 34px / sm 13px, secondary on card, ghost transparent, gated at 0.5 opacity; checkbox 18px/4px on the subtle surface with hairline border; avatar sm 22 / default 28 / lg 40 with per-size fallback initials; field 13/11/13px label/description/error ramp; dialog + inline confirm-card editorial modal metrics (480px / radius-xl / spacing-8 / shadow-lg / 2px overlay blur / 2xl·700 title); dropdown-menu full editorial menu metrics; data-table editorial density (row-py spacing-5, 11px headers, flush container, card header / page-card-mix rows — shared with table and matrix-table via the `--dt-*` roles); bulk-action-bar blessed inline strip; skeleton dim text-tinted gradient; tabs primary underline indicator.

Reconciled features (opt-in props/variants, density-independent):

- **select** — `variant="borderless"` trigger (drops border, sits on `--field-control-bg`).
- **field** — `FieldError` gains an `icon?` prop (leading glyph).
- **empty-state** — `variant="editorial"` (filled card + circular icon chip).
- **skeleton** — `shapePill` / `shapeLogo` / `shapeCircle` silhouette classes.
- **chip** — `FilterChip` gains `trailingIcon?` (orthogonal to `count`/`selectedTreatment`).
- **button** — opt-in ghost held/open state (`.variantGhost[data-state="open"]` / `[data-active="true"]` / `.isActive`).
- **badge** — `iconOnly` (circular glyph chip) + `case="sentence"` opt-out (reconciled with the existing `uppercase` prop).
- **dialog** — `DialogFooter` slot.
- **data-table** — `loadingSkeletonCell` render-prop (per-column loading silhouettes).
- **score-indicator** — `variant="solid"` (filled chip) alongside the default `ring`.
- **confirm-dialog** — `severity` / `iconTreatment` (inline | plated) / `mode` (dialog | inline) editorial API.
- **matrix-table** — editorial API (`columns`/`rows`/`cells`/`renderIdentity`, Check glyph, `--dt-*` rhythm).
- **page-header** — `leading` restored as the media/identity slot (vertically centered against the title stack; supersedes VI-539's top-align, which assumed a different slot); the prior line-height control is renamed `titleLeading`. `admin-tabbed-editor` forwards the media slot.
- **section-nav** — blessed item API (`active` accepted as alias of `isActive`), icon accepts a component or a rendered element; blessed strip treatment (hairline baseline, tertiary resting items, 11px count pill).
- **tabs** — line-variant parity (content-width triggers, hairline underline) and `font-family: inherit` on triggers; trigger label only wraps in a span when `count` is passed, so consumer icon+label flex gaps apply.
