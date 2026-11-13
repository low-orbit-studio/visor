---
"@loworbitstudio/visor": minor
"@loworbitstudio/visor-theme-engine": minor
"@loworbitstudio/visor-core": patch
---

Add BillingSlider, a range slider for how many hours a package bills. It takes `min` (the floor), `max` (the end, computed by the caller), `step` (0.25), `marks[]` (notches; past the mark with `hatchPast` the filled range stripes), `evidence` (`value` worked as a solid strip along the foot with a tick, `agent` as a dotted extension, `proposed` as a pale one with a dashed tick; a tick past `max` becomes an arrow), `gap` (stripes between the thumb and the evidence tick) and a Paper `hue`. The thumb is a tall pill with a value bubble while it has focus. Arrows step, Shift + arrows step four times, Home and End go to the floor and the end, Enter calls `onValueCommit`, Escape goes back to `savedValue`, and `valueText` sets `aria-valuetext`. `status="saving"` pulses the thumb; `size="lg"` is the hero track. The new `billing-slider` component-token family (`track-bg`, `thumb-bg`, `thumb-grip`, `gap-color`) is bound on Paper, with the gap in Emerald (money at stake). `npx visor add billing-slider`.
