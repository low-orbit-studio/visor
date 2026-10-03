---
"@loworbitstudio/visor": minor
---

New `time-picker` component: a typeable time field with a clock button that opens a popover of hour and minute columns (plus AM/PM in the 12-hour cycle). `hourCycle` (12 or 24) defaults from the locale, `minuteStep` sets the minute choices and snaps typed times, and the value in and out is always a 24-hour `"HH:MM"` string. The field matches Input at the small size so the two share a baseline in a row, draws its edge from the shared `--control-edge-*` tokens and its popover outline from `--hairline-width`, and the popover accepts a `container` to portal into.
