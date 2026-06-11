---
"@loworbitstudio/visor": minor
---

right-rail-list: add `rowSize` prop for dense admin rail text sizing

Exposes a `rowSize="xs"` prop (default: `"sm"`) so consumers can opt-in to the smaller `--font-size-xs` (~11 px) row text for dense admin side-rails without forking the block. Existing callers are unaffected — `"sm"` remains the default.
