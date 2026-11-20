---
"@loworbitstudio/visor": minor
---

feat: add ThemeToggle and PhotoPicker (VI-793), lifted from Honcho Backstage

`npx visor add theme-toggle` ships a round light/dark button. Dark shows the sun and light shows the moon; on a press the icon going away turns 100deg and shrinks to 0.3 as it fades while the other springs in (turn 600ms, scale 500ms on the spring, fade 300ms, press dips to 0.94). Controlled (`value`, `onValueChange`), keyed off its own `data-tone`, named "Switch light or dark" by default. Reduced motion cross-fades in place. Size, background, hover background, ring, colour, icon size and easing are `--theme-toggle-*` variables over Visor tokens.

`npx visor add photo-picker` ships a grid of 4:3 photo thumbnails, one chosen: `aria-pressed` buttons, each named by its label or "Photo N", a 2px ring on the chosen one and a 1.08 zoom on hover. A staggered draw wave rises from the top left on mount and whenever `play` changes (except to `false`), and `load` holds the thumbnails back until it has been true once. Columns are `--photo-picker-columns` (5) and `--photo-picker-columns-narrow` (3, at 760px and under); every other visual value is a `--photo-picker-*` variable. The consumer supplies the popover or panel.
