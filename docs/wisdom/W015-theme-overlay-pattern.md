# W015 — Custom Theme Drift Eliminated via Overlay Pattern

**Tags:** themes, sync, ci, git

## The Lesson

`visor theme sync` no longer rewrites `packages/docs/app/globals.css` or `packages/docs/lib/theme-config.ts` with custom theme entries. Both tracked files are stock-only by construction. Custom theme aggregation lives in two gitignored overlay files that sync generates.

**Do not** manually revert these tracked files after running sync — they will be clean after sync by design.

## Why This Matters

Prior to VI-168, syncing custom themes contaminated tracked files, causing recurring CI failures (PR #204) and a fragile manual revert workflow. The overlay pattern eliminates drift by construction:

- `packages/docs/app/custom-themes.generated.css` — custom `@import`s (gitignored, always written by sync)
- `packages/docs/lib/theme-config.custom.generated.ts` — exports `customThemeGroups` (gitignored, always written by sync)

## How It Works

- `globals.css`: marker-bounded block (`BEGIN/END visor-theme-imports`) holds **stock slugs only**. Sync only updates this block when `themes/` (not `custom-themes/`) changes. Custom overlay `@import` sits immediately after the END marker.
- `theme-config.ts`: hand-authored shell with marker-bounded `STOCK_GROUPS` block. Sync only updates this block for stock changes. Custom groups merge at runtime via `[...STOCK_GROUPS, ...customThemeGroups]`.
- `ensure-theme-overlays.mjs`: runs as `predev`/`prebuild`/`pretest`. Creates empty valid stubs if overlay files are missing (fresh-clone CI safety).

## Previous Workflow (Obsolete)

~~After every sync, revert tracked files to stock-only state: `git checkout HEAD -- packages/docs/app/globals.css packages/docs/lib/theme-config.ts`~~

That workflow is gone. Sync leaves tracked files untouched when only custom themes change.
