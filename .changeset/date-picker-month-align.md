---
"@loworbitstudio/visor": minor
---

DatePicker opens its calendar on the month of `value` instead of the device's current month (VI-654), and takes `align` (default `"start"`), `sideOffset` (default `4`), `collisionPadding` (default `0`) and `defaultOpen` for the popover; defaults are unchanged. The trigger and popover edges now draw from the shared `--control-edge-*` tokens as an outline instead of a visible `border`. New render fixtures: `date-picker` `default` / `align-end`.
