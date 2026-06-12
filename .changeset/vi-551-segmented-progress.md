---
"@loworbitstudio/visor": minor
---

Add `SegmentedProgress` primitive (VI-551) — discrete per-step progress meter.

New data-display primitive installable via `npx visor add segmented-progress`.
Renders N equal pill segments in a row, each independently expressing `done`,
`current`, or `pending` state. Designed for multi-step onboarding, wizard flows,
and survey/elicitation UIs where individual step completion matters.

- `role="progressbar"` with `aria-valuemin/max/now` and a required `aria-label`
- `done` segments: solid `var(--primary)` fill
- `current` segment (optional): `linear-gradient` from primary (55%) to `var(--surface-muted)` (45%) — matches the brand-workbench prototype treatment
- `pending` segments: `var(--surface-muted)` fill
- Two sizes: `sm` (6px, prototype height) and `md` (8px)
- CVA size variants, CSS Modules, all colors via design tokens
- `prefers-reduced-motion` support
