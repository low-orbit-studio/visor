# Handoff — Admin Editorial → Visor `density` axis + finish the bless

> You are continuing a multi-session effort to make three blessed admin-ui reference
> builds (organization/user/monetization management) render on **pure canonical Visor**
> and **pixel-match their blessed captures**. The hard discovery work is done and proven;
> what remains is an architecture refactor + repeating a proven loop on two more builds +
> publish + bless. Read this whole doc before acting.

## Mission right now

Refactor the editorial treatment from an **external token overlay** into a **first-class
`density` axis on the Visor components themselves**, then finish org + monetization and
publish/bless. Operator (Justin) decided the overlay layer is a sync-prone liability and
wants `density: compact | default | editorial` baked into the components, with **admin-ui =
`editorial` everywhere**.

## Decisions locked with the operator

1. **Density axis** `compact | default | editorial` (keep these exact names — do NOT rename
   `default`→`standard`). Implemented **directly in each component's CSS**, not via an
   external overlay.
2. **Switch mechanism: root `data-density="editorial"`** set once at the app root; component
   CSS keys off the global ancestor, e.g. `:global([data-density="editorial"]) .sizeSm { … }`.
   Per-instance `density` prop also fine where a component already has it (data-table does).
   admin-ui sets the root to editorial and everything inherits.
3. **Treatment → density. Features stay as props/variants.** Only the sizing/type/tonal
   *treatment* (badge 11px+uppercase+tonal, input 33.5px, button 34px, chip 12px, data-table
   editorial density, field type ramp, dialog/dropdown metrics, etc.) folds into the density
   axis. Genuine *features* — `select variant="borderless"`, `badge iconOnly`/`case`,
   `FieldError icon`, `empty-state variant="editorial"`, `chip trailingIcon`, `DialogFooter`,
   `tabs line`, `page-header` media `leading` slot, `section-nav icon` compat — STAY as the
   opt-in props/variants already shipped. They are not treatment.
4. **Drop the overlay** (`design-prototypes/admin-ui/tokens.css`) once values live in the
   components. Also drop the defensive `var(--hook, <default>)` ceremony — since nobody
   consumes Visor yet, just write the editorial values directly under `[data-density=editorial]`.
   Keep the **substrate neutral**: editorial is opt-in via the density attr, never the default.
5. **No reorg of components/blocks/patterns now.** Patterns stay as-is (they're AI composition
   recipes, not code, from VI-41/109/155 — not an admin offshoot). File a small **terminology
   disambiguation** ticket (Visor `patterns/` vs playbook `design-prototypes/.../patterns/`
   vs `pattern-builds/` all collide on the word "pattern").

## What is DONE and committed (do not redo)

**Visor branch `vi-admin-editorial-reconcile`** (worktree:
`/Users/justinschier/Code/visor/.claude/worktrees/vi-admin-editorial-reconcile`), off `main` @ `4c440a6`:
- `907388e` — reconcile 18 components (feature props/variants + zero-regression token hooks).
- `73a99c2` — data-table editorial density (cell padding + `--dt-header-font-size`).
- `74696b1` — chip/input/button editorial sizing hooks.
- `fe425b9` — section-nav `icon` accepts component OR element.
- Changeset: `.changeset/admin-editorial-reconcile-tier-s.md` (`@loworbitstudio/visor` minor).
- Plan/spec: `docs/admin-editorial-reconcile-plan.md`. Validate gate passes (1337 rules, 0 fail).
- The 18 reconciled components + the ADOPT/triage classification are in the plan doc.

**user-management build — DONE: pure canonical + PIXEL-EXACT.** All components re-vendored from
the local reconciled registry; pixel-diff vs blessed baseline: user-detail/invite/states **0px**,
user-list **35px (0.0009%)**. This is the proof the whole approach reaches the bar.

**org-management build — converging.** Re-vendored + section-nav fix un-broke 4 crashed screens;
total drift 29.6% → **0.60%** (primitives/index ≈exact; org-list/states ≈0.38%; states-edge 0.71%;
org-detail 1.29%; roles-table 1.70%; invite-flow 2.90%). Remaining = the SAME treatment residuals
user-mgmt had (input/button/chip already fixed in canonical, so org should largely inherit them on
re-vendor; the >1% screens add matrix-table/form-control/admin-tabbed-editor specifics to bisect).

**monetization build — NOT STARTED.** Also note: per original tracking it still needed operator
visual approval + recipe PR #918. Treat as the last + least-known build.

## THE EDITORIAL VALUES (bake these into `[data-density="editorial"]`)

These are the proven blessed values, currently in `design-prototypes/admin-ui/tokens.css` (the
overlay being retired). Move each into the matching component's CSS under the density attribute.
Source of truth = this block (the overlay file is uncommitted and may be torn down):

```css
/* badge */            text-transform: uppercase; font-weight: 600; letter-spacing: 0.04em; font-size: 11px;
                       variantDestructive bg: color-mix(in srgb, var(--destructive) 20%, transparent);
                       variantSuccess bg:     color-mix(in srgb, var(--success) 18%, transparent);
                       variantWarning bg:     color-mix(in srgb, var(--warning) 20%, transparent);
                       variantInfo bg:        color-mix(in srgb, var(--info) 18%, transparent);
                       iconOnly size 1.375rem / glyph 0.875rem  (this is a FEATURE already, keep)
/* chip (FilterChip) */ sizeMd font-size: var(--font-size-xs) (12px); gap: var(--spacing-2);
                       .selected bg var(--surface-elev), border transparent, color var(--text-primary);
                       .filterChip[data-selected=false] bg var(--surface-elev);
                       .count min-width/height 1.25rem, padding-x var(--spacing-1), weight semibold, align center;
                       .selected .count bg var(--primary), color var(--primary-text)
/* input */            sizeSm height: 33.5px; border-radius: var(--radius-md)
/* button */           sizeMd height: 2.125rem + line-height: normal; sizeSm font-size: 0.8125rem (13px)
/* data-table */       density="editorial" ALREADY canonical (kept). header font-size 11px (--dt-header-font-size),
                       editorial cell padding var(--spacing-5), row-py var(--spacing-4) [overlay set row-py to spacing-4],
                       --dt-header-bg var(--surface-card),
                       --dt-row-bg color-mix(in srgb, var(--surface-page) 75%, var(--surface-card) 25%),
                       --dt-container-radius 0, --dt-container-shadow none
/* checkbox */         --checkbox-size 1.125rem; --checkbox-radius 4px; --checkbox-bg var(--surface-subtle);
                       --checkbox-bg-hover var(--surface-subtle); --checkbox-border var(--hairline-strong)
/* avatar */           sm 22px / default 28px / lg 40px; fallback-font sm 11px / default font-size-sm / lg 13px
/* field */            label 13px/secondary; description 11px/tertiary; error 13px (--text-13 / --text-11)
/* dialog */           surface var(--surface-card); max-width 480px; radius var(--radius-xl); padding var(--spacing-8);
                       shadow var(--shadow-lg); overlay-blur 2px; title var(--font-size-2xl)/700; desc var(--text-tertiary)
/* dropdown-menu */    content bg var(--surface-elev), radius radius-md, padding 6px, gap 1px,
                       ring inset 0 0 0 1px var(--hairline); item 13px, padding 8px 10px, gap spacing-3, radius-sm,
                       icon var(--text-tertiary)/16px, hover-bg var(--surface-subtle),
                       destructive-hover color-mix(destructive 14%); label 11px uppercase 0.08em tertiary, padding 6px 10px 2px;
                       shortcut 11px var(--text-muted) 0.04em; separator var(--hairline) margin 4px 2px
/* skeleton */         from color-mix(text-primary 6%) / to color-mix(text-primary 10%)
/* tabs */             editorial underline indicator = var(--primary) (line variant is a FEATURE, keep)
/* base controls */    --interactive-secondary-bg var(--surface-card); --interactive-ghost-bg transparent; --input-bg var(--surface-card)
/* field-control-bg */ ROLE = var(--input-bg) default; in-dialog SUBTLE override is applied scoped to the modal form, not globally
```

NOTE on mechanism per value: a value that is genuinely *per-instance density* (data-table) keeps
its prop; everything else becomes `:global([data-density="editorial"]) .<class> { … }` in the
component's own `.module.css`. The admin builds put `data-density="editorial"` on the app root
(e.g. in `app/layout.tsx`'s root element or the admin-shell root).

## Execution runbook (sequenced)

### Phase A — Density refactor in canonical Visor (use subagents per component)
For each treatment component (badge, button, input, chip, data-table[already], checkbox, avatar,
field, dialog, dropdown-menu, skeleton, tabs, base controls):
1. Replace the `var(--hook, <canonical-default>)` lines with: keep the canonical default as the
   `.compact`/`.default` rendering, and add `:global([data-density="editorial"]) .<class> { … }`
   carrying the editorial value from the block above.
2. Remove the now-unneeded `--hook` indirection (no external driver anymore).
3. Update `.module.css.d.ts` if classes change; update `.visor.yaml` density docs; add/adjust a test.
4. `cd <visor-worktree> && npx vitest run components/ui/<name>` must pass.
Then: `npx tsc --noEmit` clean + `npm run validate` (pre-commit gate, 49 rules) + commit.
**Decide:** is `density` a shared root-attr convention doc'd somewhere central in Visor? Add a short
docs page + maybe a `<VisorDensity>`/data-attr helper. (Keep it minimal.)

### Phase B — Drop the overlay + re-wire the builds
- Delete `design-prototypes/admin-ui/tokens.css` editorial component-token block (keep only genuine
  per-build/brand bits if any — most should be gone). The builds inline it via
  `app/layout.tsx` `readFileSync("../../../tokens.css")`; replace that with setting
  `data-density="editorial"` on the root element. The palette **themes** (entr etc.) stay.
- In-dialog SUBTLE `--field-control-bg` override: keep as a scoped rule in the build's modal form
  (it was always scoped, not global).

### Phase C — Re-validate user-management is STILL pixel-exact
Re-vendor + re-capture + pixel-diff (runbook below). MUST stay 0px / 35px. If drift, the density
rules don't match the overlay values — fix the component, not the build.

### Phase D — Finish org-management to 0
Re-vendor canonical (now density-based) + set root `data-density="editorial"` + capture + diff.
Bisect any >0 screen with the proven method (below). roles-table validates matrix-table; invite-flow
is form controls; org-detail is admin-tabbed-editor + page-header media slot.

### Phase E — monetization
Likely needs: confirm operator visual approval status + recipe PR #918. Then same loop. Its net-new
surface is matrix-table (plans-pricing). It has the same clone-era components, so it inherits the
density fixes; bisect residuals.

### Phase F — Publish + bless
- Publish `@loworbitstudio/visor` via changesets: at visor repo root `npm run build` →
  `npx changeset version` → publish (per-repo NPM_TOKEN; first scoped publish lags ~8min; see memory
  `npm-publish-token-setup`). Run `npm run smoke:publish` to confirm registry↔published parity.
- Re-vendor each build from the PUBLISHED registry (replace the local-CLI path).
- Bless each: pixel-diff clean → set `state.json` `blessing_status.blessed=true`, force-add the final
  `captures/approved` baseline (PL-1567 convention), land the PR, move the Linear ticket to Done.
- Tracking tickets: PL-1634 (meta), PL-1635 (user-mgmt), PL-1636 (monetization). File the VI density
  refactor + terminology tickets.

## Mechanics & hard-won gotchas (operational — READ)

- **Paths.**
  - Visor worktree (edit canonical here): `/Users/justinschier/Code/visor/.claude/worktrees/vi-admin-editorial-reconcile`
  - Local CLI (use this, NOT `npx visor`, to vendor the reconciled registry):
    `node <visor-worktree>/packages/cli/dist/index.js add <names> --overwrite`
  - Builds (playbook worktree PL-1635):
    `/Users/justinschier/Code/low-orbit/low-orbit-playbook/.claude/worktrees/PL-1635/design-prototypes/admin-ui/pattern-builds/<org|user|monetization>-management/reference-build`
  - Shared overlay (being retired): `.../design-prototypes/admin-ui/tokens.css`
- **REBUILD THE REGISTRY AFTER EVERY CANONICAL EDIT** before re-vendoring, or `visor add` writes
  STALE files: `cd <visor-worktree> && npm run build:registry -w packages/cli`. (Lost ~an hour to this.)
- **`visor add` writes `.tsx`+`.css` only, NOT `.module.css.d.ts`.** The builds have committed sidecar
  `.d.ts` that win over Next's ambient type. After `visor add`, copy the sidecar from canonical:
  `cp <visor-worktree>/components/ui/<c>/<c>.module.css.d.ts <build>/components/ui/<c>/`.
- **Worktree node_modules:** the Visor worktree needs a real `npm install` (not a symlink) for the CLI
  build (`tsup`); `build:manifest` fails until `packages/theme-engine` is built
  (`npm run build -w packages/tokens` then `-w packages/theme-engine`) but `build:registry` (what
  `visor add` needs) succeeds regardless. Builds need their own `npm install` (org/monetization fresh).
- **Dev servers:** user-mgmt 4029, org 4030 — use distinct ports per build; `PORT=4030 npx next dev -p 4030`.
  Next dev caches the `readFileSync`'d overlay/layout → **restart the server after editing tokens.css**
  (irrelevant once the overlay is gone). Component file changes hot-reload.
- **Capture:** `cd <build> && PORT=<p> OUT_DIR=captures/<name> node scripts/capture-extra-themes.mjs`.
  Captures the build's screens (+ primitives + index for org) at 1280×800 @2x, default theme (entr/dark).
  Deterministic (same input → same px). Baselines: `<build>/../captures/approved/` (pattern-build level).
- **Pixel-diff script** (recreate at `/tmp/pixeldiff.mjs`, run from build dir so pngjs/pixelmatch resolve;
  uses `includeAA:false` = real differences only):
  ```js
  import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs"; import { join } from "node:path"
  import { PNG } from "pngjs"; import pixelmatch from "pixelmatch"
  const [baseDir,candDir,outDir]=process.argv.slice(2)
  const names=readdirSync(baseDir).filter(f=>f.endsWith(".png")).map(f=>f.replace(/\.png$/,"")).sort()
  let td=0,tp=0,rows=[]
  for(const s of names){const a=PNG.sync.read(readFileSync(join(baseDir,s+".png")));const cp=join(candDir,s+".png")
    if(!existsSync(cp)){rows.push(s+": MISSING");continue}
    const b=PNG.sync.read(readFileSync(cp))
    if(a.width!==b.width||a.height!==b.height){rows.push(s+": DIM MISMATCH");continue}
    const d=new PNG({width:a.width,height:a.height})
    const n=pixelmatch(a.data,b.data,d.data,a.width,a.height,{threshold:0.1,includeAA:false})
    td+=n;tp+=a.width*a.height; if(outDir&&n>0)writeFileSync(join(outDir,"diff__"+s+".png"),PNG.sync.write(d))
    rows.push(`${s}: ${n} px (${(n/(a.width*a.height)*100).toFixed(3)}%) ${n?"":"✓"}`)}
  console.log(rows.join("\n")); console.log(`TOTAL ${td} px (${(td/tp*100).toFixed(4)}%)`)
  ```
  Run: copy to `<build>/pixeldiff.tmp.mjs`, `node <build>/pixeldiff.tmp.mjs <build>/../captures/approved <build>/captures/<name> <build>/captures/diff`, rm it.
- **Bisect method (proven):** to find a drift culprit — `git checkout HEAD -- components` reverts the build
  to blessed vintage (0px confirms the baseline reproduces); then re-vendor components in halves and
  re-diff to isolate. A `/tmp/shiftdetect.mjs` (tries dx,dy −3..3) distinguishes a global shift from
  scattered diffs (no shift ever helped here — drifts were real component differences).
- **Deterministic findings already solved (don't rediscover):**
  - user-list "pervasive ghosting" = `input` sizeSm 36px vs blessed 33.5px (search bar shifts the table
    below it). Fixed.
  - user-invite/states drift = `button` sizeMd 40 vs 34 + sizeSm 12 vs 13. Fixed.
  - org 4 crashed screens = `section-nav` `icon` element-vs-component. Fixed (fe425b9).
  - badge/chip/data-table treatment fixed via overlay (→ now move to density).
  - Components that are ADOPT/byte-identical to blessed: table, dialog, select, dropdown-menu(tsx),
    popover, avatar(unused tokens), sparkline, toast, admin-shell, admin-list-page, profile-menu,
    activity-feed, bulk-action-bar(consumer `inline`→`inline flat` if pixel-needed). See plan doc.
- **Consumer ports discovered (apply only if pixel-diff demands):** badge tonal handled by density now;
  `confirm-dialog` user-detail dialogs may want `iconTreatment="inline"` (canonical default = plate) —
  but these are modal states, often not in the captured screen; verify with the gate. `bulk-action-bar`
  `inline`→`inline flat`. matrix-table `renderIdentity` is now `(row)=>…` (monetization consumer).

## Open items / risks
- monetization is the least-known build (visual approval + PR #918). Confirm with operator before blessing.
- The density refactor must keep user-management at 0px — the captures are the contract; trust the gate.
- 12 validate warnings exist on the Visor branch (css-module-types-sync comment parsing, matrix-table
  spacing 2px/6px which are blessed-fidelity, select focus-ring) — pre-existing/acceptable, not blockers.
- After publish, switch the builds from the local-CLI path to `npx @loworbitstudio/visor` and re-confirm.
