---
"@loworbitstudio/visor-theme-engine": minor
---

VI-478: emit brand soft/glow/strong + status-soft alpha-overlay tokens

Add `interactive-primary-soft`, `interactive-primary-glow`, `interactive-primary-strong`
to the interactive semantic map and `surface-success-soft`, `surface-warning-soft`,
`surface-error-soft` to the surface map. These BL-193 alpha-overlay families were
previously present in theme overrides but absent from the semantic map, so
`applyOverrides` silently dropped them and they emitted no CSS under any theme.

soft/glow default to a theme-tracking `color-mix()` of the corresponding color
(distinct from the OPAQUE `surface-*-subtle` tints); `strong` is a solid lightened-brand
emphasis color. Themes pin exact values via `overrides`. The status-soft keys are
prefixed (`surface-*-soft`) so they route through the surface map. Clears the
`UNKNOWN_OVERRIDE_KEY` warnings for these families.
