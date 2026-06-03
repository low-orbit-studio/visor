---
"@loworbitstudio/visor-core": minor
---

Soften dark-mode status `-subtle` surfaces (VI-500). In dark mode,
`--surface-{success,warning,error,info}-subtle` previously resolved to the fully
opaque `-900` shade (e.g. `#7f1d1d`), making tinted Alert/Banner/Toast
backgrounds read as heavy, saturated fills. They now blend the `-900` shade 12%
toward `--surface-card`
(`color-mix(in srgb, var(--color-error-900) 12%, var(--surface-card))`), keeping
a faint hue cue while letting the dark surface read through — mirroring how the
`-50` shade sits gently on white in light mode (12% matches the `-soft` status
tints). Light-mode values are unchanged. The token generator and validator now
pass `color-mix()` expressions through verbatim.
