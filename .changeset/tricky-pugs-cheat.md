---
"@loworbitstudio/visor-core": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

VI-616: ship a `visor-base` layer — token-to-page binding + element reset

visor-core now owns the element-level baseline instead of leaving each consumer and each component to rediscover it.

**New `visor-base` cascade layer.** Added as the FIRST (lowest-priority) entry in both mirrored `LAYER_ORDER` declarations, so a consumer's own unlayered `body {}` and every component `.module.css` beat it unconditionally, while author-origin styles still outrank the UA stylesheet.

**New opt-in export `@loworbitstudio/visor-core/reset`** (`dist/reset.css`) — the *propagation* half. `input, textarea, select, button, optgroup { font: inherit }`, global `box-sizing: border-box`, zeroed UA margin on form controls, button chrome normalisation, `img/svg/video` block sizing, and `appearance: none` for `input[type=search|number]`. It is a separate export: `.`, `./css`, `./tokens` and `./primitives` emit no element rules, so consumers relying on Tailwind preflight are byte-unchanged.

**NextJS adapter now emits the *origination* half** — a `@layer visor-base` block binding `font-family: var(--font-body)`, `color`, `background` and `font-size` to `body` (mirroring what the docs adapter has always done), plus the `@import "@loworbitstudio/visor-core/reset";` line for new scaffolds. Previously `--font-sans` was defined and bound to nothing, so `font: inherit` on a control faithfully propagated whatever the consumer hand-wrote. Opt out with `includeBaseLayer: false`.

**New `missing-visor-base-layer` warning in `visor check design`** — fires when an app renders Visor form controls but imports neither the reset nor Tailwind preflight, and also when the *installed* visor-core predates the `/reset` export (a file-existence test for `dist/reset.css`, not a version comparison). Honours `.visorrc.json` `disabledRules`.

**Component sweep.** Removed 24 redundant `font-family: inherit` / `font: inherit` declarations across components and blocks, and reconciled the drifted variants: hardcoded `system-ui` fallbacks behind body-font tokens now fall back to `inherit`, and color-picker's hardcoded mono stack now routes through `var(--font-mono)`. The ~20 button-rendering components that were never patched need no patch. A new `element-defaults-owned-by-base` validator rule keeps it that way, deriving its native-control target set from the CLI's native map rather than a hardcoded path list.
