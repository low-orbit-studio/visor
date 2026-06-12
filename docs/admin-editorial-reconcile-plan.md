# Admin Editorial Reconcile — Canonical Visor Plan

> **Goal.** The blessed admin-ui reference builds (organization-management, user-management,
> monetization) carry an *editorial-admin* component vintage that has diverged from canonical
> Visor. The blessed look is the source of truth. This plan reconciles the editorial features
> **into canonical Visor** so canonical reproduces the blessed look — after which the three
> builds re-vendor from canonical (`visor add`), port consumers, re-capture, and re-bless.
> Pure-on-canonical, not local forks.

## Why this exists

The org build was `visor add`-ed from an earlier canonical vintage. Canonical kept evolving —
sometimes re-implementing the same editorial intent under a different API (badge `uppercase`
prop vs the build's `case`/token model), sometimes racing ahead (popover `SelectionList`),
sometimes dropping a slot (page-header media `leading`). Net: 30 components differ from
canonical 1.6.0. This plan separates "canonical already reproduces the look" (ADOPT) from
"canonical genuinely lacks a consumed blessed feature" (RECONCILE).

## The reconcile pattern (zero-regression)

Most reconciles follow one safe, additive shape:

- **Re-tokenize hardcoded canonical values** as `var(--hook, <current-value>)`. The fallback
  equals today's value, so existing canonical consumers render byte-identical; editorial themes
  set the hook. (VI-516 "theme-tunable" philosophy.)
- **Re-add a dropped prop/variant** as opt-in, default = current behavior.

This means most RECONCILE items are *strictly additive* and cannot regress non-admin consumers.

## ADOPT — canonical already reproduces the blessed look (no Visor change)

`visor add` is safe; at most a trivial consumer touch.

| Item | Note |
|------|------|
| radio-group | blessed-ahead lines are fallback-chaining only |
| avatar | blessed size/font tokens unused; canonical is ahead (has AvatarStack) |
| sparkline | canonical ahead (draw animation); blessed stale |
| toast | only a `var(--primary)` fallback differs |
| admin-shell | cosmetic `--accent-primary`→`--primary` fallback rename |
| admin-list-page | sort-bar-radius hook is canonical-ahead |
| profile-menu | cosmetic fallback rename |
| activity-feed | `compact-3col` is canonical-ahead; blessed uses default |
| bulk-action-bar | canonical splits `flat`; consumer maps `inline` → `inline flat` (consumer touch) |
| popover | canonical ahead (SelectionList); verify no consumer uses a dropped local API |
| tabs | canonical HAS the `line` variant (animated indicator, better); verify `variant="line"` maps |

## RECONCILE — canonical needs the blessed feature

### Tier S — additive token hooks / single prop (zero-regression, mechanical)

| Component | Feature canonical lacks | Consumer uses | Approach |
|-----------|------------------------|---------------|----------|
| select | `variant="borderless"` trigger (sits on `--field-control-bg`, no border) | 2 | re-add variant + `.triggerBorderless` CSS, opt-in |
| field | `FieldError icon` prop (leading warning glyph) | 1 | re-add `icon?` + `.fieldErrorWithIcon`/`.fieldErrorIcon` |
| checkbox | `--checkbox-size` + `--checkbox-radius` hooks | live (tokens.css) | wrap 2 literals in `var(--hook, <today>)` |
| input | `--field-control-bg` role + `--input-placeholder-color` | 3 | thread role through bg + invalid; add placeholder hook |
| chip | `trailingIcon?` prop (caret after count) | 12 | re-add `trailingIcon?` + `.trailing` span, orthogonal to `count`/`selectedTreatment` |
| table | `--dt-container-radius/-shadow`, `--dt-header-bg`, `--dt-row-bg` hooks | 5 | tokenize 4 values; matrix-table already needs these |
| empty-state | `variant="editorial"` (filled card + 64px icon chip) | 1 | re-add CVA `variant` entry + `.editorial` CSS |
| skeleton | `shapePill` (+ `shapeLogo`/`shapeCircle` for completeness) | 2 | add shape modifier classes |
| button | ghost held/open state (`.variantGhost[data-state=open]`) | 0 (wired into export-menu) | additive CSS-only on `.variantGhost`, guard vs canonical active conventions |

### Tier M — multi-hook surfaces / render-props (design care)

| Component | Feature canonical lacks | Consumer uses | Approach |
|-----------|------------------------|---------------|----------|
| badge | `iconOnly` (circular glyph chip) + sentence-case opt-out reconciled with canonical's `uppercase` prop + VI-516 `--badge-font-weight/-text-transform/-letter-spacing` tokens | iconOnly 4, case/uppercase 8 | keep canonical `uppercase` (opt-in); add token-default treatment + `sentenceCase`/`case="sentence"` opt-out + `iconOnly` |
| dialog | `DialogFooter` slot + `--dialog-*` editorial hooks + `--overlay-blur` | footer 1, hooks live | restore `DialogFooter` export; tokenize content/title/desc/overlay |
| dropdown-menu | full `--dropdown-*` editorial hook set (content/item/label/shortcut/separator + leading-icon size/color) | live (profile-menu) | re-tokenize values + re-add `.item > svg` / destructive rules |
| data-table | `loadingSkeletonCell` render-prop (per-column skeleton silhouettes) | 1 | re-add optional prop + conditional in loading-row map (`density="editorial"` already canonical → ADOPT) |
| section-nav | CVA item variants + `icon`/`label`/`count` + editorial border-bottom tab treatment | detail screen | reconcile item API + treatment |
| score-indicator | `ring`/`solid` variants | verify usage | re-add variant CVA + solid CSS (confirm consumed before doing) |

### Tier L — structural / API-decision

| Component | Issue | Consumer uses | Approach |
|-----------|-------|---------------|----------|
| **page-header** | ⚠️ **`leading` prop COLLISION.** Blessed `leading` = media/identity slot (`ReactNode`, avatar lockup left of title). Canonical repurposed `leading` = line-height (`string\|number`) and **removed the media slot entirely**. | media slot: 3 screens + admin-tabbed-editor forwards it | **API decision required** (below). Restore the media slot under a new name; keep line-height. Supersedes **VI-539** (top-align leading slot — assumed the media slot). |
| admin-tabbed-editor | forwards page-header media `leading` | 2 | follows the page-header decision |
| confirm-dialog | `severity` (info/warning/danger) + `iconTreatment` (inline/**plated** icon circle) + `mode` (dialog/inline) | user-states (suspend/delete) | reconcile the editorial confirm API into canonical confirm-dialog |
| matrix-table | bespoke editorial API (`columns`/`rows`/`cells`/`renderIdentity`, Check glyph, editorial cell rhythm) — monetization centerpiece (VI-531 lineage); canonical's matrix-table is a different shape | monetization plans-pricing | largest single reconcile; align the editorial matrix API with canonical |

## The one API decision — page-header `leading`

Canonical 1.6.0 `leading?: string | number` → `--page-header-title-leading` (line-height).
Blessed `leading?: ReactNode` → identity/media slot (`data-slot="page-header-leading"`).
Same name, incompatible. **Recommendation:** keep `leading` for the **media slot** (the
higher-value, blessed, VI-539-tracked feature) and rename canonical's line-height control to
`titleLeading`. Then restore the media-slot markup + `.row[data-has-leading]`/`.leading` CSS,
fold in the VI-539 top-align fix, and drop the consumer override
`[data-slot=page-header-leading]{align-self:flex-start}`.

## Sequencing

1. **Tier S batch** (9 items) — fast, zero-regression, proves the per-component done-loop.
2. **Tier M** (6 items) — badge first (highest use + API reconcile template), then dialog,
   dropdown-menu, data-table, section-nav, score-indicator (verify usage first).
3. **Tier L** (page-header + admin-tabbed-editor as a unit; confirm-dialog; matrix-table).
4. **Publish** — changeset release of `@loworbitstudio/visor` (+ visor-core if tokens move);
   run `npm run smoke:publish` to confirm registry↔published parity.
5. **Re-vendor + re-bless** each build: bump, `visor add --overwrite`, port consumers to the
   reconciled APIs, re-capture entr/dark, pixel-diff vs the blessed captures, re-bless.

## Per-component done-bar

`<name>.tsx` + `.module.css` + `.module.css.d.ts` + `<name>.visor.yaml` (metadata) +
`__tests__/<name>.test.tsx` + `registry/registry-ui.ts` entry (if files change) + docs demo +
changeset. Gate: `npm run typecheck` + `npm run test` + `npm run validate`.

## STATUS — Visor reconcile complete (verified)

All 18 RECONCILE components landed in this worktree. Integration verified:
`tsc --noEmit` 0 errors; `vitest` 545/545 pass across 27 files; CLI `registry.json`
rebuilds (195 entries) carrying every new feature (triggerBorderless, iconOnly,
caseSentence, DialogFooter, loadingSkeletonCell, page-header-leading, …). Changeset
written (`.changeset/admin-editorial-reconcile-tier-s.md`, `@loworbitstudio/visor` minor).
(`build:manifest` fails only because the fresh worktree hasn't built `visor-theme-engine/dist`
— run `npm run build` at root first; unrelated to the reconcile.)

## Remaining phase — re-vendor + pixel-gate + publish + bless ×3

The "looks EXACTLY like blessed" gate is the pixel-diff after re-vendor. Runbook per build
(organization-management, user-management, monetization):

1. Publish: at repo root `npm run build` → `npx changeset version` → publish `@loworbitstudio/visor`
   (per-repo NPM_TOKEN; first scoped publish lags ~8min). OR test pre-publish by running the
   locally-built CLI against the build: `node <worktree>/packages/cli/dist/index.js add --overwrite <name>`.
2. Re-vendor each build: bump `@loworbitstudio/visor` consumption, `visor add --overwrite` the
   reconciled components.
3. Port consumers (the deltas the reconcile introduced):
   - **badge** — admin `tokens.css` overlay must set `--badge-destructive-bg` / `--badge-success-bg`
     / `--badge-warning-bg` / `--badge-info-bg` to the blessed `color-mix(...)` tints (canonical
     default is `--surface-*-subtle`).
   - **confirm-dialog** — add `iconTreatment="inline"` to user-detail's suspend/delete/revoke
     dialogs (user-states already passes `iconTreatment="plated"`; canonical default = plate).
   - **page-header** — drop the consumer override `[data-slot=page-header-leading]{align-self:flex-start}`
     from `prototype-overlay.css` (now canonical via VI-539). Any consumer using `leading` for
     line-height → rename to `titleLeading` (none known in the builds — they use `leading` as the media slot).
   - **bulk-action-bar** — consumer `inline` → `inline flat`.
   - **matrix-table** (monetization) — `renderIdentity` is now `(row) => …` (reads `row.identity`).
   - **section-nav** — canonical superseded the build vintage (`active`→`isActive`, icon as Phosphor
     component); re-vendor replaces it. Zero consumers in user-mgmt; check org/monetization.
4. Re-capture entr/dark (`scripts/capture-extra-themes.mjs`, OUT_DIR → captures dir) and pixel-diff
   vs the blessed `captures/approved` baseline. Within tolerance = looks exactly like blessed → bless.
   Any drift = a reconcile/port gap to fix before blessing.
5. Bless: state.json `blessing_status.blessed=true`, force-add final baseline, land.

## Related prior tickets

VI-516 (badge uppercase/editorial typography), VI-529 (tabs line variant — landed in canonical),
VI-530, VI-531 (matrix-table lineage), VI-539 (page-header top-align leading — subsumed here).
