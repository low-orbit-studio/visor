---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": minor
---

Stepper gains a `rail` variant: a side list of form sections, used vertically. Each `StepperTrigger` is one row-wide button holding a dot mark and its label (the trigger's children), with no circles, glyphs or separators; the current row's mark stretches to a pill and its trigger carries `aria-current="step"`. The four states are one ink at 100/64/40/24%: the theme's `--text-primary`, or under `data-glass="on"` the glass layer's scrim ink (white) with FormDeck's soft label shadow. The default and prominent variants are unchanged. The theme engine adds a `stepper` component-token family (`rail-gap`, `rail-padding`, `rail-mark-gap`, `rail-font-size`, `rail-font-weight`, `rail-letter-spacing`, `rail-mark-size`, `rail-mark-active-width`) and three glass values: `scrim` (dark glass under white labels on a photo, default `rgb(0 0 0 / 0.55)`, so white clears 4.5:1 over any photo, even pure white), `scrim-ink` (default white) and `ink-shadow`. visor-core's `[data-glass="on"]` switch already copies every glass key generically, so with no switch change its built `tokens.css` now also sets `--glass-on-scrim`, `--glass-on-scrim-ink` and `--glass-on-ink-shadow` (and `[data-glass="off"]` clears them): that new output is visor-core's bump.
