---
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor": minor
---

VI-796: corner shape and motion as theme values. A theme can set `corners: squircle`, which emits `--corner-shape: squircle` and binds `corner-shape` to every element in the `visor-base` layer; browsers without `corner-shape` draw round. `motion.easing-out` sets `--motion-easing-ease-out`, and the opt-in `duration-enter`, `duration-exit`, `duration-page`, `duration-stagger` and `duration-enter-delay` keys emit `--motion-duration-<role>` only when a theme sets them. Themes that set none of these emit the same CSS as before.
