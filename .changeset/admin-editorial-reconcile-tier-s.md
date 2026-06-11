---
"@loworbitstudio/visor": minor
---

Reconcile editorial-admin component features into canonical Visor so the blessed admin-ui reference builds (organization/user/monetization management) render pure-on-canonical instead of carrying forked component vintages. All additions are opt-in with same-as-today fallbacks, so existing consumers render byte-identical. See `docs/admin-editorial-reconcile-plan.md`.

- **select** — `variant="borderless"` trigger (drops border, sits on `--field-control-bg`).
- **field** — `FieldError` gains an `icon?` prop (leading glyph) + VI-516 label/description/error typography token hooks.
- **checkbox** — `--checkbox-size` / `--checkbox-radius` hooks.
- **input** — shared `--field-control-bg` role + `--input-placeholder-color` hook.
- **table** — `--dt-container-radius/-shadow`, `--dt-header-bg`, `--dt-row-bg` theme hooks.
- **empty-state** — `variant="editorial"` (filled card + circular icon chip).
- **skeleton** — `shapePill` / `shapeLogo` / `shapeCircle` silhouette classes.
- **chip** — `FilterChip` gains `trailingIcon?` (orthogonal to `count`/`selectedTreatment`).
- **button** — opt-in ghost held/open state (`.variantGhost[data-state="open"]` / `[data-active="true"]` / `.isActive`).
- **badge** — `iconOnly` (circular glyph chip) + `case="sentence"` opt-out (reconciled with the existing `uppercase` prop) + VI-516 `--badge-font-weight/-text-transform/-letter-spacing/-font-size` and per-tone `--badge-*-bg` hooks.
- **dialog** — `DialogFooter` slot + `--dialog-*` editorial hooks + `--overlay-blur`.
- **dropdown-menu** — full `--dropdown-*` editorial hook layer (content/item/label/shortcut/separator + leading-icon size/color + destructive tints).
- **data-table** — `loadingSkeletonCell` render-prop (per-column loading silhouettes).
- **score-indicator** — `variant="solid"` (filled chip) alongside the default `ring`.
- **confirm-dialog** — `severity` / `iconTreatment` (inline | plated) / `mode` (dialog | inline) editorial API (superset of the existing plate default).
- **matrix-table** — editorial API (`columns`/`rows`/`cells`/`renderIdentity`, Check glyph, `--dt-*` rhythm).
- **page-header** — `leading` restored as the media/identity slot (top-aligned, VI-539); the prior line-height control is renamed `titleLeading`. `admin-tabbed-editor` forwards the media slot.
